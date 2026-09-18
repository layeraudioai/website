import React from 'react';
import {
  ChevronRight,
  ChevronDown,
  Trash2,
  Copy,
  Layers,
  Link,
  Zap,
  Cpu,
} from 'lucide-react';
import { VisualElement } from '../../types/editor';

interface ElementTreeProps {
  rootElement: VisualElement;
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveElement?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

const TreeNode: React.FC<{
  element: VisualElement;
  depth: number;
  rootId: string;
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveElement?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}> = ({
  element,
  depth,
  rootId,
  selectedElementId,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const isSelected = element.id === selectedElementId;
  const isRoot = element.id === rootId;
  const hasChildren = element.children && element.children.length > 0;

  // Check bindings
  const hasVarBinding =
    !!element.bindings?.textBinding ||
    (element.bindings?.attributeBindings && element.bindings.attributeBindings.length > 0);
  const hasEventBinding =
    element.bindings?.eventBindings && element.bindings.eventBindings.length > 0;

  const handleDragStart = (e: React.DragEvent) => {
    if (isRoot) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'tree-element',
        elementId: element.id,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData || !onMoveElement) return;

    try {
      const data = JSON.parse(rawData);
      if ((data.type === 'tree-element' || data.type === 'canvas-element') && data.elementId) {
        if (data.elementId !== element.id) {
          onMoveElement(data.elementId, element.id, hasChildren || isRoot ? 'inside' : 'after');
        }
      }
    } catch (err) {
      console.error('Failed to parse tree drop event:', err);
    }
  };

  return (
    <div className="select-none text-xs">
      <div
        draggable={!isRoot}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelectElement(element.id)}
        style={{ paddingLeft: `${Math.max(4, depth * 14)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition ${
          isDragOver ? 'ring-2 ring-indigo-500 bg-indigo-950/40' : ''
        } ${
          isSelected
            ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center space-x-1.5 truncate">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-slate-700/60 rounded text-slate-400"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <span className="font-mono text-[11px] text-slate-500 uppercase font-semibold">
            {element.tag}
          </span>
          <span className="font-medium truncate max-w-[120px] text-slate-200">
            {element.name || element.id}
          </span>

          {/* Logic Pointing Indicators */}
          {hasVarBinding && (
            <span
              title="Pointed to reactive variable"
              className="px-1 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center space-x-0.5"
            >
              <Link className="w-2.5 h-2.5" />
            </span>
          )}

          {hasEventBinding && (
            <span
              title="Pointed to function, class method, or worker event"
              className="px-1 py-0.2 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded flex items-center space-x-0.5"
            >
              <Zap className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Action icons on hover or selected */}
        <div
          className={`flex items-center space-x-1 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {!isRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement(element.id);
              }}
              title="Duplicate element"
              className="p-1 hover:bg-slate-700/80 rounded text-slate-400 hover:text-slate-200"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}

          {!isRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement(element.id);
              }}
              title="Delete element"
              className="p-1 hover:bg-rose-900/60 rounded text-slate-400 hover:text-rose-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {element.children.map((child) => (
            <TreeNode
              key={child.id}
              element={child}
              depth={depth + 1}
              rootId={rootId}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              onDeleteElement={onDeleteElement}
              onDuplicateElement={onDuplicateElement}
              onMoveElement={onMoveElement}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ElementTree: React.FC<ElementTreeProps> = ({
  rootElement,
  selectedElementId,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-1">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1 flex items-center justify-between">
        <span>DOM Hierarchy</span>
        <Layers className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="space-y-0.5">
        <TreeNode
          element={rootElement}
          depth={0}
          rootId={rootElement.id}
          selectedElementId={selectedElementId}
          onSelectElement={onSelectElement}
          onDeleteElement={onDeleteElement}
          onDuplicateElement={onDuplicateElement}
          onMoveElement={onMoveElement}
        />
      </div>
    </div>
  );
};
