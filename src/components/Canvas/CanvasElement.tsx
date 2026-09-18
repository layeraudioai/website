import React from 'react';
import { VisualElement } from '../../types/editor';
import { ProjectData } from '../../types/logic';
import { Link, Zap, Trash2, Copy, GripVertical, ArrowUp } from 'lucide-react';
import { createDefaultElement } from '../../utils/elementHelpers';

interface CanvasElementProps {
  element: VisualElement;
  project: ProjectData;
  selectedElementId: string | null;
  hoveredElementId: string | null;
  onSelectElement: (id: string, e: React.MouseEvent) => void;
  onHoverElement: (id: string | null, e: React.MouseEvent) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveElement: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  onInsertElement: (targetId: string, element: VisualElement, position: 'before' | 'after' | 'inside') => void;
  onSelectParent?: (currentId: string) => void;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  project,
  selectedElementId,
  hoveredElementId,
  onSelectElement,
  onHoverElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
  onInsertElement,
  onSelectParent,
}) => {
  const isSelected = element.id === selectedElementId;
  const isHovered = element.id === hoveredElementId && !isSelected;
  const isRoot = element.id === project.rootElement.id;

  const [dropPosition, setDropPosition] = React.useState<'before' | 'after' | 'inside' | null>(null);
  const [isDraggingSelf, setIsDraggingSelf] = React.useState(false);

  // Resolve content: check if pointed to variable
  let displayContent = element.content;
  const textBind = element.bindings?.textBinding;
  if (textBind && textBind.sourceType === 'variable') {
    const boundVar = project.variables.find((v) => v.name === textBind.targetId);
    if (boundVar) {
      const val = boundVar.value !== undefined ? boundVar.value : boundVar.defaultValue;
      if (textBind.format === 'currency') displayContent = `$${val}`;
      else if (textBind.format === 'uppercase') displayContent = String(val).toUpperCase();
      else displayContent = String(val);
    }
  }

  // Resolve input value if attribute bound
  let inputValue = element.attributes?.value;
  const attrBindValue = element.bindings?.attributeBindings?.find((b) => b.attributeName === 'value');
  if (attrBindValue && attrBindValue.sourceType === 'variable') {
    const boundVar = project.variables.find((v) => v.name === attrBindValue.targetId);
    if (boundVar) {
      inputValue = String(boundVar.value ?? boundVar.defaultValue);
    }
  }

  const Tag = (['card'].includes(element.tag) ? 'div' : ['badge'].includes(element.tag) ? 'span' : element.tag) as any;
  const isContainer = [
    'div',
    'section',
    'header',
    'main',
    'footer',
    'card',
    'form',
    'ul',
    'ol',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'nav',
    'article',
    'aside',
  ].includes(element.tag);
  const isVoid = ['input', 'img', 'br', 'hr'].includes(element.tag);

  // Drag Source Handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (isRoot) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setIsDraggingSelf(true);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'canvas-element',
        elementId: element.id,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDraggingSelf(false);
  };

  // Drop Target Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const height = rect.height;

    if (isRoot) {
      setDropPosition('inside');
      return;
    }

    if (isContainer) {
      if (relY < height * 0.25) {
        setDropPosition('before');
      } else if (relY > height * 0.75) {
        setDropPosition('after');
      } else {
        setDropPosition('inside');
      }
    } else {
      if (relY < height * 0.5) {
        setDropPosition('before');
      } else {
        setDropPosition('after');
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const pos = dropPosition || (isContainer ? 'inside' : 'after');
    setDropPosition(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      if (data.type === 'palette-item') {
        const newEl = createDefaultElement(data.tag);
        onInsertElement(element.id, newEl, pos);
      } else if (data.type === 'canvas-element' || data.type === 'tree-element') {
        if (data.elementId && data.elementId !== element.id) {
          onMoveElement(data.elementId, element.id, pos);
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped element data:', err);
    }
  };

  // Common element attributes
  const domProps: Record<string, any> = {
    id: element.id,
    draggable: !isRoot,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    className: `${element.classes || ''} ${
      isDraggingSelf ? 'opacity-40' : ''
    } ${
      isSelected
        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 relative'
        : isHovered
        ? 'ring-1 ring-indigo-400/60 ring-dashed relative'
        : 'relative'
    }`,
    style: element.styles || {},
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectElement(element.id, e);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      e.stopPropagation();
      onHoverElement(element.id, e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.stopPropagation();
      onHoverElement(null, e);
    },
  };

  // Pass HTML attributes
  if (element.attributes) {
    Object.entries(element.attributes).forEach(([k, v]) => {
      if (k !== 'value') domProps[k] = v;
    });
  }

  if (element.tag === 'input') {
    domProps.value = inputValue !== undefined ? inputValue : '';
    domProps.readOnly = true; // In editor design canvas, keep readOnly so click selects element
  }

  // Visual insertion lines and container highlight
  const dropIndicators = (
    <>
      {dropPosition === 'before' && (
        <span className="absolute -top-1 left-0 right-0 h-1.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/80 z-30 pointer-events-none flex items-center justify-start">
          <span className="w-2.5 h-2.5 -ml-1 bg-indigo-500 rounded-full inline-block" />
        </span>
      )}
      {dropPosition === 'after' && (
        <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/80 z-30 pointer-events-none flex items-center justify-start">
          <span className="w-2.5 h-2.5 -ml-1 bg-indigo-500 rounded-full inline-block" />
        </span>
      )}
      {dropPosition === 'inside' && (
        <span className="absolute inset-0 ring-2 ring-indigo-500 ring-dashed bg-indigo-500/10 rounded pointer-events-none z-20 block" />
      )}
    </>
  );

  // Floating selection and action toolbar for selected element
  const selectionToolbar = isSelected ? (
    <span
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-7 left-0 z-30 inline-flex items-center space-x-1 px-1.5 py-0.5 bg-slate-900 border border-indigo-500 text-white rounded-md text-[10px] font-sans shadow-xl select-none"
    >
      {/* Drag handle */}
      {!isRoot && (
        <span
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title="Drag to reorder or move"
          className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-white inline-flex items-center justify-center"
        >
          <GripVertical className="w-3 h-3" />
        </span>
      )}

      {/* Tag badge */}
      <span className="font-bold font-mono text-indigo-400">&lt;{element.tag}&gt;</span>
      <span className="text-slate-400 max-w-[80px] truncate">{element.name || element.id}</span>

      {/* Logic binding chips */}
      {textBind && (
        <span className="inline-flex items-center text-emerald-300 text-[9px] bg-emerald-950/60 border border-emerald-500/30 px-1 rounded">
          <Link className="w-2.5 h-2.5 mr-0.5 inline-block" />
          {textBind.targetId}
        </span>
      )}
      {element.bindings?.eventBindings?.length ? (
        <span className="inline-flex items-center text-amber-300 text-[9px] bg-amber-950/60 border border-amber-500/30 px-1 rounded">
          <Zap className="w-2.5 h-2.5 mr-0.5 inline-block" />
          {element.bindings.eventBindings[0].targetId}
        </span>
      ) : null}

      <span className="h-3 w-px bg-slate-700 mx-0.5 inline-block" />

      {/* Select Parent Button */}
      {!isRoot && onSelectParent && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onSelectParent(element.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onSelectParent(element.id);
            }
          }}
          title="Select parent container"
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer inline-flex items-center justify-center"
        >
          <ArrowUp className="w-2.5 h-2.5" />
        </span>
      )}

      {/* Duplicate Button */}
      {!isRoot && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateElement(element.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onDuplicateElement(element.id);
            }
          }}
          title="Duplicate element"
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer inline-flex items-center justify-center"
        >
          <Copy className="w-2.5 h-2.5" />
        </span>
      )}

      {/* Object Deletion Button */}
      {!isRoot && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteElement(element.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onDeleteElement(element.id);
            }
          }}
          title="Delete element (Del / Backspace)"
          className="p-1 hover:bg-rose-600 rounded text-rose-400 hover:text-white transition cursor-pointer inline-flex items-center justify-center"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </span>
      )}
    </span>
  ) : null;

  if (isVoid) {
    return (
      <span className="relative inline-block w-full">
        {dropIndicators}
        {selectionToolbar}
        <Tag {...domProps} />
      </span>
    );
  }

  if (element.tag === 'textarea') {
    domProps.defaultValue = displayContent || '';
    domProps.readOnly = true;
    return (
      <span className="relative inline-block w-full">
        {dropIndicators}
        {selectionToolbar}
        <textarea {...domProps} />
      </span>
    );
  }

  return (
    <Tag {...domProps}>
      {dropIndicators}
      {selectionToolbar}
      {element.children && element.children.length > 0 ? (
        element.children.map((child) => (
          <CanvasElement
            key={child.id}
            element={child}
            project={project}
            selectedElementId={selectedElementId}
            hoveredElementId={hoveredElementId}
            onSelectElement={onSelectElement}
            onHoverElement={onHoverElement}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
            onMoveElement={onMoveElement}
            onInsertElement={onInsertElement}
            onSelectParent={onSelectParent}
          />
        ))
      ) : (
        displayContent
      )}
    </Tag>
  );
};
