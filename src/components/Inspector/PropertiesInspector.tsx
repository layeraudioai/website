import React from 'react';
import {
  Palette,
  Sliders,
  Type,
  Maximize2,
  Tag,
  Crosshair,
  Layers,
  Sparkles,
  Trash2,
  Copy,
} from 'lucide-react';
import { VisualElement } from '../../types/editor';
import { ProjectData } from '../../types/logic';
import { BindingInspector } from './BindingInspector';

interface PropertiesInspectorProps {
  element: VisualElement;
  project: ProjectData;
  onUpdateElement: (updated: VisualElement) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
}

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  element,
  project,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}) => {
  const [activeTab, setActiveTab] = React.useState<'pointing' | 'styles'>('pointing');
  const isRoot = element.id === project.rootElement.id;

  const handleUpdateField = (field: keyof VisualElement, val: any) => {
    onUpdateElement({ ...element, [field]: val });
  };

  const handleUpdateAttribute = (key: string, val: string) => {
    onUpdateElement({
      ...element,
      attributes: {
        ...element.attributes,
        [key]: val,
      },
    });
  };

  const handleRemoveAttribute = (key: string) => {
    const next = { ...element.attributes };
    delete next[key];
    onUpdateElement({ ...element, attributes: next });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-xs overflow-hidden select-none">
      {/* Element Header with Quick Actions */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
            &lt;{element.tag}&gt;
          </span>
          <span className="font-semibold text-slate-200 truncate">{element.name}</span>
        </div>
        
        <div className="flex items-center space-x-1.5">
          {onDuplicateElement && !isRoot && (
            <button
              onClick={() => onDuplicateElement(element.id)}
              title="Duplicate element"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}

          {onDeleteElement && !isRoot && (
            <button
              onClick={() => onDeleteElement(element.id)}
              title="Delete element (Del / Backspace)"
              className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <span className="text-[10px] font-mono text-slate-500 pl-1">#{element.id}</span>
        </div>
      </div>

      {/* Inspector Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 shrink-0">
        <button
          onClick={() => setActiveTab('pointing')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center space-x-1.5 font-semibold text-xs border-b-2 transition cursor-pointer ${
            activeTab === 'pointing'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
          <span>Logic Pointing</span>
          {(element.bindings?.textBinding ||
            element.bindings?.eventBindings?.length ||
            element.bindings?.attributeBindings?.length) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('styles')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center space-x-1.5 font-semibold text-xs border-b-2 transition cursor-pointer ${
            activeTab === 'styles'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Styles & Props</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'pointing' ? (
          <BindingInspector
            element={element}
            project={project}
            onUpdateElement={onUpdateElement}
          />
        ) : (
          <div className="space-y-4">
            {/* Element Name */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Element Label / Name</label>
              <input
                type="text"
                value={element.name}
                onChange={(e) => handleUpdateField('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Static Text Content (if not bound to variable) */}
            {!['input', 'img', 'br'].includes(element.tag) && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                  <span>Static Text Content</span>
                  {element.bindings?.textBinding && (
                    <span className="text-[10px] text-emerald-400">
                      (Overridden by state.{element.bindings.textBinding.targetId})
                    </span>
                  )}
                </label>
                <textarea
                  value={element.content}
                  onChange={(e) => handleUpdateField('content', e.target.value)}
                  disabled={!!element.bindings?.textBinding}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-950"
                  placeholder="Element inner text..."
                />
              </div>
            )}

            {/* Tailwind Classes */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                <span>Tailwind CSS Classes</span>
                <span className="text-[10px] text-indigo-400">Utility classes</span>
              </label>
              <textarea
                value={element.classes}
                onChange={(e) => handleUpdateField('classes', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                placeholder="e.g. flex items-center p-4 bg-slate-800 rounded-xl"
              />
            </div>

            {/* Quick Tailwind Presets */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Quick Style Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Centered Flex', cls: 'flex items-center justify-center gap-3' },
                  { label: 'Card Box', cls: 'bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg' },
                  { label: 'Primary Pill', cls: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium shadow-md' },
                  { label: 'Badge Emerald', cls: 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
                  { label: 'Input Field', cls: 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white' },
                  { label: 'Title H1', cls: 'text-3xl font-extrabold text-white tracking-tight' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const existing = element.classes ? element.classes + ' ' : '';
                      handleUpdateField('classes', (existing + preset.cls).trim());
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 rounded text-[10px] transition cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HTML Attributes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">HTML Attributes</span>
              </div>

              {element.tag === 'input' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Input Type</label>
                    <select
                      value={element.attributes?.type || 'text'}
                      onChange={(e) => handleUpdateAttribute('type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    >
                      <option value="text">text</option>
                      <option value="number">number</option>
                      <option value="password">password</option>
                      <option value="email">email</option>
                      <option value="checkbox">checkbox</option>
                      <option value="range">range</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Placeholder</label>
                    <input
                      type="text"
                      value={element.attributes?.placeholder || ''}
                      onChange={(e) => handleUpdateAttribute('placeholder', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {element.tag === 'img' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Image Source (src)</label>
                  <input
                    type="text"
                    value={element.attributes?.src || ''}
                    onChange={(e) => handleUpdateAttribute('src', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
