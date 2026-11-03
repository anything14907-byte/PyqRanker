import Peer, { DataConnection } from 'peerjs';
import { storageService, encodeStatePayload, decodeStatePayload } from '../utils/storageService';

export interface SyncPayload {
  type: 'STATE_UPDATE' | 'SYNC_STATE' | 'VIEW_CHANGE' | 'THEME_CHANGE' | 'HEARTBEAT' | 'REQUEST_STATE';
  senderId: string;
  senderDevice: string;
  timestamp: number;
  data?: any;
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

// Multiple public STUN servers for reliable NAT traversal across mobile & Wi-Fi networks
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ]
  }
};

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
  private broadcastDebounceTimer: any = null;

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
    this.checkUrlForPayloadAndRoom();
  }

  private detectDeviceName(): string {
    if (typeof navigator === 'undefined') return 'Device';
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'Apple iPhone';
    if (/iPad/i.test(ua)) return 'Apple iPad';
    if (/Android/i.test(ua)) return 'Android Device';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'MacBook / Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Linux/i.test(ua)) return 'Linux Device';
    return 'Web Device';
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('pyq_device_sync_channel_v2');
        this.broadcastChannel.onmessage = (event) => {
          const data: SyncPayload = event.data;
          if (data && data.senderId !== this.myPeerId) {
            // Silently import state into local storage if it's a state packet
            if ((data.type === 'STATE_UPDATE' || data.type === 'SYNC_STATE') && (data.data || data.payload)) {
              try {
                storageService.importFullAppState(data.data || data.payload);
              } catch (e) {
                console.error('Error applying broadcast channel update:', e);
              }
            }

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
      console.warn('BroadcastChannel not supported:', e);
    }
  }

  /**
   * Check URL query parameters (?room=... &sync=... &payload=...) on application startup
   */
  private checkUrlForPayloadAndRoom() {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const payloadParam = urlParams.get('payload');
      const roomParam = urlParams.get('room') || urlParams.get('sync');

      // 1. If state payload is present in the URL, immediately decode and import it
      if (payloadParam && payloadParam.trim()) {
        try {
          const decoded = decodeStatePayload(payloadParam.trim());
          if (decoded) {
            console.log('📦 Found initial full-state payload in URL, importing...');
            storageService.importFullAppState(decoded);

            // Dispatch global event for celebratory banner & notification
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('pyq-qr-state-synced', {
                detail: { source: 'url_payload' }
              }));
            }, 300);
          }
        } catch (e) {
          console.error('Failed to parse URL payload on startup:', e);
        }

        // Clean up URL query parameters without page reload so it doesn't re-run on subsequent refreshes
        try {
          const cleanUrl = window.location.pathname + (roomParam ? `?room=${encodeURIComponent(roomParam)}` : '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {}
      }

      // 2. If room code is present in the URL, connect to that room
      if (roomParam && roomParam.trim()) {
        const cleanCode = roomParam.trim().toUpperCase();
        setTimeout(() => {
          this.connectToRoom(cleanCode);
        }, 600);
      }
    } catch (err) {
      console.warn('Error reading sync URL params on startup:', err);
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

      this.peer = new Peer(hostPeerId, PEER_CONFIG);

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
        console.warn('PeerJS notice (host):', err);
        // If host ID is already taken, another peer in this room is active; join as client
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
        isConnected: true, // BroadcastChannel remains active
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

      this.peer = new Peer(randomClientId, PEER_CONFIG);

      this.peer.on('open', () => {
        const targetHostId = `pyqsync-${roomCode.replace(/[^A-Z0-9]/g, '')}`;
        const conn = this.peer!.connect(targetHostId, {
          reliable: true
        });
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS notice (client):', err);
        // If host isn't online yet, become host for this room
        if (err.type === 'peer-unavailable') {
          this.initAsHost(roomCode);
        } else {
          this.updateStatus({
            isConnecting: false,
            error: `Sync status: ${err.message || 'Local mode active'}`
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

      // 1. Immediately exchange full state upon connection
      try {
        const fullState = storageService.getFullAppState();
        conn.send({
          type: 'STATE_UPDATE',
          senderId: this.myPeerId,
          senderDevice: this.deviceName,
          timestamp: Date.now(),
          data: fullState,
          payload: fullState
        });
      } catch (e) {
        console.warn('Could not send initial state to peer:', e);
      }

      // 2. Also request latest state from peer
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
        // Automatically deep-merge incoming state into localStorage
        if ((payload.type === 'STATE_UPDATE' || payload.type === 'SYNC_STATE') && (payload.data || payload.payload)) {
          try {
            const stateToImport = payload.data || payload.payload;
            storageService.importFullAppState(stateToImport);
          } catch (e) {
            console.error('Error importing incoming peer state:', e);
          }
        }

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
    // 1. Send via WebRTC peer data channels
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch (e) {
          console.warn('Failed to send via peer connection:', e);
        }
      }
    });

    // 2. Send via BroadcastChannel (local browser tabs)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn('Failed to post to BroadcastChannel:', e);
      }
    }
  }

  /**
   * Broadcast a full state update across all connected devices (Debounced to ~120ms)
   */
  public broadcastStateUpdate(explicitState?: any) {
    if (this.broadcastDebounceTimer) {
      clearTimeout(this.broadcastDebounceTimer);
    }

    this.broadcastDebounceTimer = setTimeout(() => {
      try {
        const state = explicitState || storageService.getFullAppState();
        const stringified = JSON.stringify(state);
        if (stringified === this.lastSentHash) return;
        this.lastSentHash = stringified;

        const packet: SyncPayload = {
          type: 'STATE_UPDATE',
          senderId: this.myPeerId,
          senderDevice: this.deviceName,
          timestamp: Date.now(),
          data: state,
          payload: state
        };

        this.broadcastPayload(packet);

        this.updateStatus({
          lastSyncTimestamp: Date.now(),
          lastMessage: 'Live state update broadcasted'
        });
      } catch (e) {
        console.warn('Failed to broadcast state update:', e);
      }
    }, 120);
  }

  public syncFullState(state: any) {
    this.broadcastStateUpdate(state);
  }

  public broadcastState(state: any) {
    this.broadcastStateUpdate(state);
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
      try { fn(payload); } catch (e) { console.error('Error in sync listener:', e); }
    });
  }

  private updateStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach(fn => {
      try { fn(this.status); } catch (e) {}
    });
  }

  /**
   * Generates a Magic Sync URL containing room code AND base64/URI encoded full state payload
   */
  public getShareableUrl(roomCode?: string, includePayload = true): string {
    const code = roomCode || this.currentRoomCode || this.status.roomCode || this.generateRoomCode();
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;

    if (!includePayload) {
      return `${base}?room=${encodeURIComponent(code)}&sync=${encodeURIComponent(code)}`;
    }

    try {
      const compactState = storageService.getFullAppState(true);
      const encoded = encodeStatePayload(compactState);
      return `${base}?room=${encodeURIComponent(code)}&sync=${encodeURIComponent(code)}&payload=${encodeURIComponent(encoded)}`;
    } catch (e) {
      console.warn('Could not encode payload into shareable URL:', e);
      return `${base}?room=${encodeURIComponent(code)}&sync=${encodeURIComponent(code)}`;
    }
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
