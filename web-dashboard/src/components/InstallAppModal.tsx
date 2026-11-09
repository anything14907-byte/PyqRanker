import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Download, 
  Share, 
  PlusSquare, 
  Check, 
  Sparkles,
  QrCode,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { storageService } from '../utils/storageService';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onPromptTriggered?: () => void;
  onPromptHandled?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onPromptTriggered,
  onPromptHandled,
  onShowToast
}) => {
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isDesktop: boolean;
    platformName: string;
  }>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isDesktop: true,
    platformName: 'Desktop'
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      const isMobile = isIOS || isAndroid || /Mobi|Mobile/.test(ua);
      const isDesktop = !isMobile;
      const platformName = isIOS ? 'iPhone / iPad' : isAndroid ? 'Android' : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : 'Windows / PC';
      setDeviceInfo({ isMobile, isIOS, isAndroid, isDesktop, platformName });

      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsStandalone(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://anything14907-byte.github.io/PyqRanker/';
      QRCode.toDataURL(currentUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#0A0F1D',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('QR code error', err);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          onShowToast?.('App installation started! 🚀', 'success');
        }
        if (onPromptTriggered) onPromptTriggered();
        if (onPromptHandled) onPromptHandled();
        onClose();
      } catch (err) {
        console.warn('Install prompt error', err);
      }
    } else {
      if (deviceInfo.isDesktop) {
        onShowToast?.('To install, click the install icon in your browser address bar (top right) or scan the QR code with your phone!', 'info');
      }
    }
  };

  const handleDownloadOfflineBackup = () => {
    try {
      storageService.exportBackup();
      onShowToast?.('Offline study data backup (.json) saved to device! 💾', 'success');
    } catch (err) {
      onShowToast?.('Failed to export offline backup', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 animate-fade-slide-up">
      <div 
        className="w-full max-w-lg rounded-3xl p-6 sm:p-7 relative border shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
        style={{
          background: '#0F172A',
          borderColor: 'rgba(255, 255, 255, 0.22)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-glow-cyan flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                {deviceInfo.isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  {deviceInfo.isMobile ? 'Install on Your Phone' : 'Install Study OS App'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-cyan-300 border border-white/15">
                  {deviceInfo.platformName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Native offline-ready PWA with zero browser address bar clutter.
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

        {/* ALREADY INSTALLED BADGE */}
        {isStandalone && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Study OS is already installed and running as a standalone app!</span>
          </div>
        )}

        {/* CASE 1: IPHONE / IPAD (SAFARI ADD TO HOME SCREEN GUIDE) */}
        {deviceInfo.isIOS ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>How to Install on iPhone / iPad (Safari)</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    1
                  </div>
                  <div>
                    Tap the <strong>Share button [↑]</strong> in the bottom toolbar of Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    2
                  </div>
                  <div>
                    Scroll down and tap <strong>"Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-white" /></strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    3
                  </div>
                  <div>
                    Tap <strong>Add</strong> in the top-right corner. Study OS will now launch full-screen from your home screen like a native iOS app!
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadOfflineBackup}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Offline Backup (.json)</span>
            </button>
          </div>
        ) : deviceInfo.isAndroid ? (
          /* CASE 2: ANDROID (NATIVE PWA PROMPT OR CHROME MENU) */
          <div className="space-y-4">
            {deferredPrompt ? (
              <button
                onClick={handleNativeInstall}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-sm shadow-glow-cyan flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Tap to Install on Android Now</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>How to Install on Android Chrome:</span>
                </div>
                <p>
                  Tap the <strong>three dots (⋮)</strong> in Chrome at the top right, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
            )}

            <button
              onClick={handleDownloadOfflineBackup}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Offline Backup (.json)</span>
            </button>
          </div>
        ) : (
          /* CASE 3: LAPTOP / DESKTOP (MAC / WINDOWS / LINUX) */
          <div className="space-y-5">
            {/* Desktop Install Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="text-xs font-bold text-white">Install Desktop App</div>
                <div className="text-[11px] text-slate-300">Run in a clean window on macOS / Windows with dock icon.</div>
              </div>

              <button
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-glow-cyan transition-all active:scale-95"
              >
                <Laptop className="w-4 h-4" />
                <span>Install on {deviceInfo.platformName}</span>
              </button>
            </div>

            {/* Instant Camera QR Code to Install on Phone */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Scan to install on phone" className="w-28 h-28 object-contain rounded-xl" />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center bg-slate-100 rounded-xl text-[10px] text-slate-500">
                    Generating...
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan with Phone Camera to Install</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Open your iPhone or Android camera to instantly load Study OS on your mobile device and add it to your home screen.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadOfflineBackup}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Offline Backup File (.json)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
