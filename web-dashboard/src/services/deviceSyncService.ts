import Peer, { DataConnection } from 'peerjs';

export interface SyncPayload {
  type: 'SYNC_STATE' | 'VIEW_CHANGE' | 'THEME_CHANGE' | 'HEARTBEAT' | 'REQUEST_STATE';
  senderId: string;
  senderDevice: string;
  timestamp: number;
  payload?: any;
}

export interface SyncStatus {
  roomCode: string;
  connectedPeersCount: number;
  isConnecting: boolean;
  isConnected: boolean;
  error?: string | null;
  lastSyncTimestamp?: number | null;
  lastMessage?: string | null;
}

type SyncListener = (payload: SyncPayload) => void;
type StatusListener = (status: SyncStatus) => void;

class DeviceSyncService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private myPeerId: string = '';
  private currentRoomCode: string = '';
  private isHost: boolean = false;
  private syncListeners: Set<SyncListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private deviceName: string = '';
  private lastSentHash: string = '';

  public status: SyncStatus = {
    roomCode: '',
    connectedPeersCount: 0,
    isConnecting: false,
    isConnected: false,
    error: null,
    lastSyncTimestamp: null,
    lastMessage: null
  };

  constructor() {
    this.deviceName = this.detectDeviceName();
    this.initBroadcastChannel();
    
    // Auto-check URL query parameter (?sync=ROOM_CODE)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSyncCode = urlParams.get('sync');
      if (urlSyncCode && urlSyncCode.trim()) {
        const cleanCode = urlSyncCode.trim().toUpperCase();
        setTimeout(() => {
          this.connectToRoom(cleanCode);
        }, 800);
      }
    }
  }

  private detectDeviceName(): string {
    if (typeof navigator === 'undefined') return 'Device';
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return 'Apple iPhone';
    if (/Android/i.test(ua)) return 'Android Device';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'MacBook / Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    return 'Tablet / Desktop';
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('pyq_device_sync_channel_v1');
        this.broadcastChannel.onmessage = (event) => {
          const data: SyncPayload = event.data;
          if (data && data.senderId !== this.myPeerId) {
            this.notifyListeners(data);
            this.updateStatus({
              connectedPeersCount: Math.max(1, this.connections.size + 1),
              isConnected: true,
              lastSyncTimestamp: Date.now(),
              lastMessage: `Synced via BroadcastChannel (${data.senderDevice})`
            });
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'LQ-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public initAsHost(customCode?: string): string {
    const roomCode = (customCode || this.currentRoomCode || this.generateRoomCode()).toUpperCase();
    this.currentRoomCode = roomCode;
    this.isHost = true;
    this.cleanupPeer();

    this.updateStatus({
      roomCode,
      isConnecting: true,
      isConnected: false,
      error: null
    });

    try {
      const hostPeerId = `pyqsync-${roomCode.replace(/[^A-Z0-9]/g, '')}`;
      this.myPeerId = hostPeerId;

      this.peer = new Peer(hostPeerId, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.updateStatus({
          isConnecting: false,
          isConnected: true,
          roomCode,
          lastMessage: `Room ${roomCode} ready for pairing`
        });
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer error (host):', err);
        // If host ID is taken, another tab may be host; connect as client
        if (err.type === 'unavailable-id') {
          this.connectToRoom(roomCode);
        } else {
          this.updateStatus({
            isConnecting: false,
            error: `Connection notice: ${err.message || 'Offline mode active'}`
          });
        }
      });
    } catch (err: any) {
      console.warn('Failed to init PeerJS host:', err);
      this.updateStatus({
        isConnecting: false,
        isConnected: true, // BroadcastChannel fallback is still live!
        error: null
      });
    }

    return roomCode;
  }

  public connectToRoom(rawRoomCode: string) {
    const roomCode = rawRoomCode.trim().toUpperCase();
    if (!roomCode) return;

    this.currentRoomCode = roomCode;
    this.isHost = false;
    this.cleanupPeer();

    this.updateStatus({
      roomCode,
      isConnecting: true,
      isConnected: false,
      error: null
    });

    try {
      const randomClientId = `pyqclient-${Math.random().toString(36).substring(2, 9)}`;
      this.myPeerId = randomClientId;

      this.peer = new Peer(randomClientId, {
        debug: 1
      });

      this.peer.on('open', () => {
        const targetHostId = `pyqsync-${roomCode.replace(/[^A-Z0-9]/g, '')}`;
        const conn = this.peer!.connect(targetHostId, {
          reliable: true
        });
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer client error:', err);
        // If cannot connect to host, maybe this device should be the host for that room!
        if (err.type === 'peer-unavailable') {
          this.initAsHost(roomCode);
        } else {
          this.updateStatus({
            isConnecting: false,
            error: `Sync status: ${err.message || 'Using local sync'}`
          });
        }
      });
    } catch (err: any) {
      console.warn('Failed to connect to room:', err);
      this.updateStatus({
        isConnecting: false,
        error: 'Failed to initialize peer connection.'
      });
    }
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.updateStatus({
        connectedPeersCount: this.connections.size,
        isConnected: true,
        isConnecting: false,
        error: null,
        lastMessage: `Connected to ${this.connections.size} device(s)`
      });

      // Request latest state from peer upon opening
      this.broadcastPayload({
        type: 'REQUEST_STATE',
        senderId: this.myPeerId,
        senderDevice: this.deviceName,
        timestamp: Date.now()
      });
    });

    conn.on('data', (data: any) => {
      const payload = data as SyncPayload;
      if (payload && payload.senderId !== this.myPeerId) {
        this.notifyListeners(payload);
        this.updateStatus({
          lastSyncTimestamp: Date.now(),
          lastMessage: `Received update from ${payload.senderDevice}`
        });
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.updateStatus({
        connectedPeersCount: this.connections.size,
        lastMessage: 'A device disconnected'
      });
    });

    conn.on('error', (err) => {
      console.warn('Connection error:', err);
      this.connections.delete(conn.peer);
    });
  }

  public broadcastPayload(payload: SyncPayload) {
    // 1. Send via PeerJS WebRTC connections
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch (e) {
          console.warn('Failed to send via peer connection', e);
        }
      }
    });

    // 2. Send via BroadcastChannel (local tabs on same machine/browser)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn('Failed to post to BroadcastChannel', e);
      }
    }
  }

  public syncFullState(state: any) {
    const stringified = JSON.stringify(state);
    if (stringified === this.lastSentHash) return;
    this.lastSentHash = stringified;

    this.broadcastPayload({
      type: 'SYNC_STATE',
      senderId: this.myPeerId,
      senderDevice: this.deviceName,
      timestamp: Date.now(),
      payload: state
    });

    this.updateStatus({
      lastSyncTimestamp: Date.now(),
      lastMessage: 'Full state broadcasted to peers'
    });
  }

  public broadcastState(state: any) {
    this.syncFullState(state);
  }

  public syncView(view: string, activeSubjectId?: string) {
    this.broadcastPayload({
      type: 'VIEW_CHANGE',
      senderId: this.myPeerId,
      senderDevice: this.deviceName,
      timestamp: Date.now(),
      payload: { view, activeSubjectId }
    });
  }

  public syncTheme(themeMode: string, liquidMotionEnabled: boolean) {
    this.broadcastPayload({
      type: 'THEME_CHANGE',
      senderId: this.myPeerId,
      senderDevice: this.deviceName,
      timestamp: Date.now(),
      payload: { themeMode, liquidMotionEnabled }
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  public onSync(listener: SyncListener): () => void {
    return this.subscribe(listener);
  }

  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private notifyListeners(payload: SyncPayload) {
    this.syncListeners.forEach(fn => {
      try { fn(payload); } catch (e) { console.error('Error in sync listener', e); }
    });
  }

  private updateStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach(fn => {
      try { fn(this.status); } catch (e) {}
    });
  }

  public getShareableUrl(roomCode?: string): string {
    const code = roomCode || this.currentRoomCode || this.status.roomCode;
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?sync=${encodeURIComponent(code)}`;
  }

  public cleanupPeer() {
    this.connections.forEach(c => {
      try { c.close(); } catch (e) {}
    });
    this.connections.clear();

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

export const deviceSyncService = new DeviceSyncService();
