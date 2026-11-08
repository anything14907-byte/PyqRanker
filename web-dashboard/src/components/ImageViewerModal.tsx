import React, { useState, useRef } from 'react';
import { SubjectFile } from '../types';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Star, 
  CheckCircle2, 
  Circle, 
  Download, 
  Maximize2 
} from 'lucide-react';

interface ImageViewerModalProps {
  file: SubjectFile | null;
  onClose: () => void;
  onToggleImportant?: (id: string) => void;
  onToggleDone?: (id: string) => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  file,
  onClose,
  onToggleImportant,
  onToggleDone
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!file) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name || 'image.png';
    link.click();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black/95 select-none animate-fade-in"
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Bar */}
      <div className="h-16 px-4 sm:px-6 bg-[#0F172A]/95 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        
        {/* Left: Title & Status */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="truncate text-sm sm:text-base font-bold text-white max-w-[200px] sm:max-w-md">
            {file.name}
          </div>

          {file.isImportant && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Important</span>
            </span>
          )}

          {file.isDone && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Done</span>
            </span>
          )}
        </div>

        {/* Center/Right: Zoom Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <div className="hidden sm:flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-white min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Reset Zoom (1:1)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Important */}
          {onToggleImportant && (
            <button
              onClick={() => onToggleImportant(file.id)}
              className={`p-2 rounded-xl border transition-colors ${
                file.isImportant 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title={file.isImportant ? 'Unmark Important' : 'Mark as Important'}
            >
              <Star className={`w-4 h-4 ${file.isImportant ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          {/* Toggle Done */}
          {onToggleDone && (
            <button
              onClick={() => onToggleDone(file.id)}
              className={`p-2 rounded-xl border transition-colors ${
                file.isDone 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title={file.isDone ? 'Mark as Not Done' : 'Mark as Done'}
            >
              {file.isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            </button>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            title="Download original file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 border border-white/20 transition-colors ml-2"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Main Image View Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center p-4 relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <img
          src={file.dataUrl}
          alt={file.name}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxHeight: '90vh',
            maxWidth: '90vw'
          }}
          className="object-contain rounded-lg shadow-2xl transition-transform"
        />

        {/* Mobile Zoom Floating Bar */}
        <div className="sm:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-[#1E293B] rounded-2xl p-1.5 border border-white/20 shadow-2xl">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white/80 active:text-white"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="px-3 text-xs font-mono font-bold text-white">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white/80 active:text-white"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-white/80 active:text-white border-l border-white/20 ml-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
