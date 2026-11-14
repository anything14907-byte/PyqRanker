import { UnitImageResource, UnitImageCategory, DiagramOcclusionMask } from '../types';
import { indexedDbService } from './indexedDbService';

/**
 * Service to manage visual graphs, diagrams, handwritten notes, and PYQ snapshots
 * stored permanently in IndexedDB (StudyOS_Unit_Images).
 */

export function formatImageCategoryBadge(category: UnitImageCategory): { label: string; icon: string; color: string } {
  switch (category) {
    case 'graph':
      return { label: 'Graph', icon: '📊', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    case 'diagram':
      return { label: 'Diagram', icon: '📐', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    case 'pyq':
      return { label: 'PYQ Snapshot', icon: '🔥', color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' };
    case 'formula':
      return { label: 'Formula Sheet', icon: '📝', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
    case 'handwritten':
      return { label: 'Handwritten Note', icon: '✍️', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    default:
      return { label: 'Visual', icon: '🖼️', color: 'bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-500/30' };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses and reads an image File into a Data URL, keeping crisp quality while preventing memory bloat.
 */
export async function compressAndReadFile(file: File): Promise<{ dataUrl: string; fileSize: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // If it's SVG, don't recompress through canvas to preserve vectors
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          fileSize: formatFileSize(file.size),
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            fileSize: formatFileSize(file.size),
            mimeType: file.type || 'image/png'
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mime, 0.88);
        const estBytes = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          fileSize: formatFileSize(estBytes),
          mimeType: mime
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          fileSize: formatFileSize(file.size),
          mimeType: file.type || 'image/png'
        });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Creates and persists a new UnitImageResource in IndexedDB.
 */
export async function createAndSaveUnitImage(params: {
  subjectId: string;
  unitId: string;
  unit?: number;
  pyqId?: string;
  title: string;
  category: UnitImageCategory;
  dataUrl: string;
  mimeType: string;
  fileSize?: string;
  examNotes?: string;
  examPoints?: string[];
}): Promise<UnitImageResource> {
  const newImage: UnitImageResource = {
    id: `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    subjectId: params.subjectId,
    unitId: params.unitId,
    unit: params.unit,
    pyqId: params.pyqId,
    title: params.title.trim() || 'Untitled Diagram',
    category: params.category || 'diagram',
    dataUrl: params.dataUrl,
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    examNotes: params.examNotes || '',
    examPoints: params.examPoints || [],
    masks: [],
    createdAt: Date.now()
  };

  await indexedDbService.saveUnitImage(newImage);
  return newImage;
}

export async function loadUnitImages(subjectId?: string, unitId?: string): Promise<UnitImageResource[]> {
  try {
    return await indexedDbService.getUnitImages(subjectId, unitId);
  } catch (err) {
    console.error('Failed to load unit images from IndexedDB:', err);
    return [];
  }
}

export async function deleteUnitImage(id: string): Promise<void> {
  await indexedDbService.deleteUnitImage(id);
}

export async function saveUnitImageMasks(id: string, masks: DiagramOcclusionMask[]): Promise<void> {
  await indexedDbService.updateUnitImageMasks(id, masks);
}

export async function saveUnitImageNotes(id: string, examNotes: string): Promise<void> {
  await indexedDbService.updateUnitImageNotes(id, examNotes);
}
