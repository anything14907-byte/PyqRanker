import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  RefreshCw, 
  Laptop, 
  Smartphone, 
  Radio, 
  Download, 
  Upload, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { deviceSyncService, SyncStatus } from '../services/deviceSyncService';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onExportSnapshot?: () => void;
  onImportSnapshot?: () => void;
  onStateSynced?: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onExportSnapshot,
  onImportSnapshot,
  onStateSynced
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(deviceSyncService.status);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const unsub = deviceSyncService.onStatus((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (!syncStatus.roomCode) {
        deviceSyncService.initAsHost();
      }
    }
  }, [isOpen, syncStatus.roomCode]);

  // Generate QR Code whenever room code is ready
  useEffect(() => {
    if (syncStatus.roomCode) {
      const shareUrl = deviceSyncService.getShareableUrl(syncStatus.roomCode);
      QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#0A0F1D',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Failed to generate QR code', err);
      });
    }
  }, [syncStatus.roomCode]);

  if (!isOpen) return null;

  const shareUrl = deviceSyncService.getShareableUrl(syncStatus.roomCode);

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      onShowToast?.('Magic Sync Link copied to clipboard! 📋', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopyCode = () => {
    if (!syncStatus.roomCode) return;
    navigator.clipboard.writeText(syncStatus.roomCode).then(() => {
      setCopiedCode(true);
      onShowToast?.(`Pairing code ${syncStatus.roomCode} copied!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: 'PyqRanker — Real-Time Study Sync',
          text: `Scan or click this link to instantly sync PyqRanker with my device (Code: ${syncStatus.roomCode})`,
          url: shareUrl
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInputCode.trim()) return;
    setIsJoining(true);
    deviceSyncService.connectToRoom(joinInputCode.trim());
    onShowToast?.(`Connecting to device ${joinInputCode.trim().toUpperCase()}...`, 'info');
    setTimeout(() => {
      setIsJoining(false);
      setJoinInputCode('');
      if (onStateSynced) onStateSynced();
    }, 1500);
  };

  const handleNewRoom = () => {
    const newCode = deviceSyncService.initAsHost(deviceSyncService.generateRoomCode());
    onShowToast?.(`Created new sync room ${newCode}`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xl animate-fade-slide-up">
      <div 
        className="w-full max-w-xl rounded-3xl p-6 sm:p-7 relative border shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(28px) saturate(210%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(28px) saturate(210%) brightness(1.08)',
          borderColor: 'rgba(255, 255, 255, 0.22)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
        }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-500 p-0.5 shadow-glow-cyan flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Real-Time Multi-Device Hub
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                  syncStatus.connectedPeersCount > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${syncStatus.connectedPeersCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                  {syncStatus.connectedPeersCount > 0 
                    ? `🟢 ${syncStatus.connectedPeersCount} Device${syncStatus.connectedPeersCount > 1 ? 's' : ''} Connected` 
                    : '⚪ Ready to Pair'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero-setup WebRTC peer-to-peer sync. No server account required.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 2-Column Pairing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
          {/* Left: Instant Scannable QR Code */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>Instant Camera QR Code</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white shadow-xl border border-white/40">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code for ${syncStatus.roomCode}`} 
                  className="w-44 h-44 object-contain rounded-xl"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-300 leading-snug">
              Point your phone's camera at this QR code to connect and sync in under 2 seconds.
            </span>
          </div>

          {/* Right: 6-Digit Code & Fast Join Input */}
          <div className="space-y-4">
            {/* 6-Character Room Badge */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your 6-Character Pairing Code
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                  {syncStatus.roomCode || 'LQ-SYNC'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleNewRoom}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
                    title="Generate new code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Join Another Device Form */}
            <form onSubmit={handleJoinSubmit} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Join Another Device
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. LQ-4829"
                  value={joinInputCode}
                  onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase"
                />
                <button
                  type="submit"
                  disabled={isJoining || !joinInputCode.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1 shadow-glow-cyan"
                >
                  <span>Connect</span>
                </button>
              </div>
            </form>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Magic Link'}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                title="Share via WhatsApp, AirDrop, Messages"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Bidirectional Synchronization Details */}
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3 text-xs text-cyan-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="font-bold text-white">Live Bidirectional State Synchronization</div>
            <p>
              When your phone and laptop pair, subjects, syllabus checkboxes, study timer logs, flashcards, and display themes sync instantaneously both ways.
            </p>
          </div>
        </div>

        {/* Offline Backup & Snapshot Utilities */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">Strict local privacy — zero cloud database storage</span>
          </div>

          <div className="flex items-center gap-2">
            {onExportSnapshot && (
              <button
                onClick={onExportSnapshot}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Export offline JSON backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Snapshot</span>
              </button>
            )}
            {onImportSnapshot && (
              <button
                onClick={onImportSnapshot}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Import JSON backup"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
