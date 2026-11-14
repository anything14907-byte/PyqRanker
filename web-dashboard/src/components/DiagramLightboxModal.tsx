import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitImageResource, DiagramOcclusionMask } from '../types';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Brain, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  Save, 
  Sparkles,
  Edit2,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { formatImageCategoryBadge, saveUnitImageMasks, saveUnitImageNotes } from '../utils/unitImageService';

interface DiagramLightboxModalProps {
  images: UnitImageResource[];
  initialImageId: string;
  onClose: () => void;
  onDeleteImage?: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DiagramLightboxModal: React.FC<DiagramLightboxModalProps> = ({
  images,
  initialImageId,
  onClose,
  onDeleteImage,
  onShowToast
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const idx = images.findIndex(img => img.id === initialImageId);
    return idx !== -1 ? idx : 0;
  });

  const activeImage = images[currentIndex];

  // Canvas Viewport State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Self-Test Mode (Occlusion Masks)
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [masks, setMasks] = useState<DiagramOcclusionMask[]>(activeImage?.masks || []);
  const [isDrawingMask, setIsDrawingMask] = useState<boolean>(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [tempBox, setTempBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Exam Notes / Captions
  const [examNotes, setExamNotes] = useState<string>(activeImage?.examNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Sync masks & notes when currentIndex changes
  useEffect(() => {
    if (activeImage) {
      setMasks(activeImage.masks || []);
      setExamNotes(activeImage.examNotes || '');
      setZoomLevel(1);
      setRotation(0);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [currentIndex, activeImage]);

  // Keyboard navigation: Left / Right arrows, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  if (!activeImage) return null;

  const categoryInfo = formatImageCategoryBadge(activeImage.category);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(images.length - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetView = () => {
    setZoomLevel(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || !isDrawingMask) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawingMask && isTestMode) {
      // Start drawing occlusion mask relative to image
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      setDrawingStart({ x: Math.max(0, Math.min(100, clickX)), y: Math.max(0, Math.min(100, clickY)) });
      return;
    }

    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawingMask && drawingStart && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      const x = Math.min(drawingStart.x, currentX);
      const y = Math.min(drawingStart.y, currentY);
      const width = Math.abs(currentX - drawingStart.x);
      const height = Math.abs(currentY - drawingStart.y);

      setTempBox({ x, y, width, height });
      return;
    }

    if (!isPanning) return;
    setPanPosition({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = async () => {
    if (isDrawingMask && drawingStart && tempBox && tempBox.width > 2 && tempBox.height > 2) {
      const newMask: DiagramOcclusionMask = {
        id: `mask-${Date.now().toString(36)}`,
        x: tempBox.x,
        y: tempBox.y,
        width: tempBox.width,
        height: tempBox.height,
        label: 'Hidden Label',
        isRevealed: false
      };
      const updatedMasks = [...masks, newMask];
      setMasks(updatedMasks);
      await saveUnitImageMasks(activeImage.id, updatedMasks);
      activeImage.masks = updatedMasks;
      onShowToast('Occlusion mask created! Click to test recall. 🧠', 'success');
      setDrawingStart(null);
      setTempBox(null);
      setIsDrawingMask(false);
      return;
    }

    setDrawingStart(null);
    setTempBox(null);
    setIsPanning(false);
  };

  const handleToggleMaskReveal = async (maskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = masks.map(m => m.id === maskId ? { ...m, isRevealed: !m.isRevealed } : m);
    setMasks(updated);
    await saveUnitImageMasks(activeImage.id, updated);
    activeImage.masks = updated;
  };

  const handleDeleteMask = async (maskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = masks.filter(m => m.id !== maskId);
    setMasks(updated);
    await saveUnitImageMasks(activeImage.id, updated);
    activeImage.masks = updated;
    onShowToast('Mask removed.', 'info');
  };

  const handleRevealAllMasks = async () => {
    const updated = masks.map(m => ({ ...m, isRevealed: true }));
    setMasks(updated);
    await saveUnitImageMasks(activeImage.id, updated);
    activeImage.masks = updated;
  };

  const handleHideAllMasks = async () => {
    const updated = masks.map(m => ({ ...m, isRevealed: false }));
    setMasks(updated);
    await saveUnitImageMasks(activeImage.id, updated);
    activeImage.masks = updated;
  };

  const handleSaveNotes = async () => {
    setIsEditingNotes(false);
    await saveUnitImageNotes(activeImage.id, examNotes);
    activeImage.examNotes = examNotes;
    onShowToast('Exam diagram key points saved! 📝', 'success');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = activeImage.dataUrl;
    link.download = `${activeImage.title.replace(/\s+/g, '_')}_diagram.png`;
    link.click();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-stone-950/98 backdrop-blur-md select-none animate-fade-in"
      onMouseUp={handleMouseUp}
    >
      {/* -------------------------------------------------------------
          TOP BAR: TITLE, CATEGORY, FLIPPER COUNTER & CONTROLS
          ------------------------------------------------------------- */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-stone-900/95 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Left: Category Badge + Title + Counter */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black border flex items-center gap-1.5 shrink-0 ${categoryInfo.color}`}>
            <span>{categoryInfo.icon}</span>
            <span className="hidden sm:inline">{categoryInfo.label}</span>
          </span>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-serif font-black text-white truncate">
              {activeImage.title}
            </h2>
            <div className="text-[10px] font-mono text-stone-400">
              {currentIndex + 1} of {images.length} visuals {activeImage.fileSize ? `• ${activeImage.fileSize}` : ''}
            </div>
          </div>
        </div>

        {/* Center: Rapid Flipper Controls */}
        <div className="hidden md:flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/10">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Previous diagram (← Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-mono font-bold text-amber-400 tabular-nums">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Next diagram (→ Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom, Mask Self-Test Toggle, Download & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Zoom & Rotate Controls */}
          <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-white/70 hover:text-white"
              title="Reset 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-1 border-l border-white/10 pl-1.5"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* "🧠 Mask Labels to Test Myself" Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsTestMode(!isTestMode);
              if (isTestMode) {
                setIsDrawingMask(false);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isTestMode 
                ? 'bg-amber-500 text-stone-950 font-black ring-2 ring-amber-400' 
                : 'bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10'
            }`}
            title="Toggle interactive diagram label masking for active recall testing"
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isTestMode ? '🧠 Self-Test Active' : '🧠 Mask Labels to Test Myself'}
            </span>
            <span className="sm:hidden">Self-Test</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
            title="Download diagram image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          {onDeleteImage && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${activeImage.title}" permanently?`)) {
                  onDeleteImage(activeImage.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
              title="Delete diagram"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
            title="Close Lightbox (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------
          TEST-MODE SUBHEADER BAR: ADD MASK, REVEAL ALL, HIDE ALL
          ------------------------------------------------------------- */}
      {isTestMode && (
        <div className="px-6 py-2 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs font-mono animate-fade-slide-down shrink-0 z-20">
          <div className="flex items-center gap-2 text-amber-300">
            <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              <strong>Active Recall Test:</strong> Drag on the diagram to mask labels. Click any mask to reveal or hide the answer!
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDrawingMask(!isDrawingMask)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                isDrawingMask 
                  ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-300' 
                  : 'bg-stone-800 text-amber-400 border border-amber-500/40 hover:bg-stone-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isDrawingMask ? 'Drawing Active (Click & Drag)' : '+ Draw New Mask'}</span>
            </button>

            <button
              type="button"
              onClick={handleHideAllMasks}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3 text-stone-400" />
              <span>Hide All</span>
            </button>

            <button
              type="button"
              onClick={handleRevealAllMasks}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold flex items-center gap-1"
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              <span>Reveal All</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MAIN VIEWPORT: DIAGRAM IMAGE, OCCLUSION MASKS & FLIPPER ARROWS
          ------------------------------------------------------------- */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className={`flex-1 relative overflow-hidden flex items-center justify-center ${
          isDrawingMask ? 'cursor-crosshair' : zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        {/* Rapid Flipper Left Arrow (On Canvas) */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-white/10 shadow-2xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
          title="Previous diagram (← Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Rapid Flipper Right Arrow (On Canvas) */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-white/10 shadow-2xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
          title="Next diagram (→ Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Image Wrapper with Zoom & Rotation */}
        <div 
          className="relative transition-transform duration-100 ease-out inline-block max-w-[95%] max-h-[90%]"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          <img
            ref={imageRef}
            src={activeImage.dataUrl}
            alt={activeImage.title}
            className="rounded-lg shadow-2xl max-w-full max-h-[78vh] object-contain select-none pointer-events-auto border border-white/10"
            draggable={false}
          />

          {/* Occlusion Masks (Rendered over the image) */}
          {masks.map((mask) => (
            <div
              key={mask.id}
              onClick={(e) => handleToggleMaskReveal(mask.id, e)}
              className={`absolute rounded transition-all duration-200 cursor-pointer flex items-center justify-center p-1 group/mask ${
                mask.isRevealed 
                  ? 'bg-emerald-500/20 border-2 border-dashed border-emerald-400 text-emerald-300 backdrop-blur-xs' 
                  : 'bg-stone-950/95 border-2 border-amber-500/80 text-amber-300 shadow-xl'
              }`}
              style={{
                left: `${mask.x}%`,
                top: `${mask.y}%`,
                width: `${mask.width}%`,
                height: `${mask.height}%`,
                zIndex: 10
              }}
              title={mask.isRevealed ? 'Click to hide label' : 'Click to reveal hidden label underneath'}
            >
              <div className="text-[10px] font-mono font-bold truncate select-none text-center px-1">
                {mask.isRevealed ? (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Eye className="w-3 h-3" />
                    <span>Revealed</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-300">
                    <Brain className="w-3 h-3" />
                    <span>? Recall</span>
                  </span>
                )}
              </div>

              {/* Quick Delete Mask Button */}
              {isTestMode && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteMask(mask.id, e)}
                  className="absolute -top-2.5 -right-2.5 p-1 rounded-full bg-red-600 text-white shadow-md opacity-0 group-hover/mask:opacity-100 transition-opacity"
                  title="Remove mask"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}

          {/* Active Drawing Preview Box */}
          {isDrawingMask && tempBox && (
            <div
              className="absolute border-2 border-dashed border-amber-400 bg-amber-500/30 rounded pointer-events-none"
              style={{
                left: `${tempBox.x}%`,
                top: `${tempBox.y}%`,
                width: `${tempBox.width}%`,
                height: `${tempBox.height}%`,
                zIndex: 15
              }}
            />
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          BOTTOM CAPTION & KEY EXAM POINTS BAR
          ------------------------------------------------------------- */}
      <footer className="bg-stone-900/95 border-t border-white/10 px-4 sm:px-6 py-3 shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Key Exam Points to Draw / Write:</span>
              </span>
              
              {!isEditingNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[10px] font-mono text-stone-400 hover:text-amber-400 flex items-center gap-1"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Edit Points</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  placeholder="Key diagram labels, rubric rules, or steps to draw in university exam..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-amber-500/50 text-white text-xs font-serif focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <p className="text-xs font-serif text-stone-300 leading-relaxed truncate">
                {examNotes || (
                  <span className="italic text-stone-500">
                    No key exam points added yet. Click "Edit Points" to add critical markings, formulas, or rubric steps.
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-stone-400">
            <span>Use Left/Right arrows (← / →) to flip rapidly</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

