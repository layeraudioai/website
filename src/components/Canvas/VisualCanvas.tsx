import React from 'react';
import { Monitor, Tablet, Smartphone, ZoomIn, ZoomOut, Maximize2, Trash2, Copy, CornerDownRight } from 'lucide-react';
import { VisualElement, ViewportSize } from '../../types/editor';
import { ProjectData } from '../../types/logic';
import { CanvasElement } from './CanvasElement';
import { findParentInTree, createDefaultElement } from '../../utils/elementHelpers';

interface VisualCanvasProps {
  project: ProjectData;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveElement: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  onInsertElement: (targetId: string, element: VisualElement, position: 'before' | 'after' | 'inside') => void;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  project,
  selectedElementId,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
  onInsertElement,
}) => {
  const [viewport, setViewport] = React.useState<ViewportSize>('desktop');
  const [zoom, setZoom] = React.useState<number>(100);
  const [hoveredElementId, setHoveredElementId] = React.useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = React.useState<boolean>(false);

  // Keyboard shortcut for deleting selected element
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        if (selectedElementId !== project.rootElement.id) {
          e.preventDefault();
          onDeleteElement(selectedElementId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, project.rootElement.id, onDeleteElement]);

  const handleSelectParent = (childId: string) => {
    const parent = findParentInTree(project.rootElement, childId);
    if (parent) {
      onSelectElement(parent.id);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.type === 'palette-item') {
        const newEl = createDefaultElement(data.tag);
        onInsertElement(project.rootElement.id, newEl, 'inside');
      } else if (data.type === 'canvas-element' || data.type === 'tree-element') {
        if (data.elementId && data.elementId !== project.rootElement.id) {
          onMoveElement(data.elementId, project.rootElement.id, 'inside');
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped canvas data:', err);
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
      default:
        return 'w-full max-w-5xl';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 overflow-hidden select-none">
      {/* Canvas Top Bar: Viewport & Zoom Controls */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1 rounded text-xs transition cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1 rounded text-xs transition cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1 rounded text-xs transition cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected element quick actions in canvas header */}
        {selectedElementId && selectedElementId !== project.rootElement.id && (
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Selected:</span>
            <span className="font-mono text-indigo-400 text-[11px]">#{selectedElementId}</span>
            <div className="h-3 w-px bg-slate-800" />
            <button
              onClick={() => onDuplicateElement(selectedElementId)}
              title="Duplicate (Ctrl+D)"
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Duplicate</span>
            </button>
            <button
              onClick={() => onDeleteElement(selectedElementId)}
              title="Delete (Del / Backspace)"
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-[10px]">Delete</span>
            </button>
          </div>
        )}

        {/* Viewport Width and Zoom Controls */}
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-500">
            {viewport === 'desktop' ? 'Fluid Desktop' : viewport === 'tablet' ? '768px' : '375px'}
          </span>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Artboard Canvas Scroll Area */}
      <div
        onClick={() => onSelectElement(null)}
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
        className="flex-1 overflow-auto p-6 md:p-8 flex justify-center items-start bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className={`transition-all duration-150 ${getViewportWidth()} shadow-2xl rounded-xl overflow-hidden border ${
            isDragOverCanvas ? 'border-indigo-500 ring-2 ring-indigo-500/40' : 'border-slate-800'
          } bg-slate-900 min-h-[560px]`}
        >
          {/* Inject project custom CSS */}
          {project.customCSS && (
            <style>
              {project.customCSS}
              {`\n${project.customCSS.replace(/\bbody\b/g, '#sc-root')}`}
            </style>
          )}

          <CanvasElement
            element={project.rootElement}
            project={project}
            selectedElementId={selectedElementId}
            hoveredElementId={hoveredElementId}
            onSelectElement={(id) => onSelectElement(id)}
            onHoverElement={(id) => setHoveredElementId(id)}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
            onMoveElement={onMoveElement}
            onInsertElement={onInsertElement}
            onSelectParent={handleSelectParent}
          />
        </div>
      </div>
    </div>
  );
};
