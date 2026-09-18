import React from 'react';
import {
  Square,
  Type,
  Heading1,
  Heading2,
  MousePointerClick,
  TextCursorInput,
  Award,
  CreditCard,
  Rows3,
  SlidersHorizontal,
  Image,
  Layers,
} from 'lucide-react';
import { ElementTag } from '../../types/editor';

interface ElementPaletteProps {
  onAddElement: (tag: ElementTag) => void;
  selectedElementId: string | null;
}

interface PaletteItem {
  tag: ElementTag;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORIES: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'Layout & Containers',
    items: [
      { tag: 'div', label: 'Flex Container', icon: Rows3, description: 'Flexible container for grouping items' },
      { tag: 'card', label: 'Card Container', icon: CreditCard, description: 'Styled card container with border and shadow' },
      { tag: 'section', label: 'Section Block', icon: Square, description: 'Semantic section wrapper' },
    ],
  },
  {
    name: 'Typography & Badges',
    items: [
      { tag: 'h1', label: 'Main Heading (H1)', icon: Heading1, description: 'Primary page or banner title' },
      { tag: 'h2', label: 'Subheading (H2)', icon: Heading2, description: 'Section title or card heading' },
      { tag: 'p', label: 'Paragraph Text', icon: Type, description: 'Standard body text block' },
      { tag: 'badge', label: 'Status Badge', icon: Award, description: 'Pill badge for status or tag' },
    ],
  },
  {
    name: 'Forms & Interactive',
    items: [
      { tag: 'button', label: 'Action Button', icon: MousePointerClick, description: 'Button for clicks, functions, or workers' },
      { tag: 'input', label: 'Value Input', icon: TextCursorInput, description: 'Text or number input field' },
      { tag: 'progress', label: 'Progress Gauge', icon: SlidersHorizontal, description: 'Visual progress or metric bar' },
      { tag: 'canvas', label: 'Canvas Element', icon: Image, description: 'HTML5 2D canvas for graphics' },
    ],
  },
];

export const ElementPalette: React.FC<ElementPaletteProps> = ({
  onAddElement,
  selectedElementId,
}) => {
  const handleDragStart = (e: React.DragEvent, tag: ElementTag) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'palette-item',
        tag,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4 select-none">
      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-2.5 text-xs text-indigo-200">
        <span className="font-semibold block mb-0.5">Drag & Drop or Click</span>
        Drag any element directly onto the visual canvas to position it, or click to append to{' '}
        <span className="text-indigo-400 font-mono">
          {selectedElementId ? `#${selectedElementId}` : 'the root layout'}
        </span>
        .
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.name} className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            {cat.name}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {cat.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.tag}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item.tag)}
                  onClick={() => onAddElement(item.tag)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-left transition group cursor-grab active:cursor-grabbing hover:shadow-md"
                >
                  <div className="p-1.5 rounded-md bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-700 transition">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {item.description}
                    </div>
                  </div>
                  <span className="text-slate-600 group-hover:text-indigo-400 text-xs font-mono">
                    +
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
