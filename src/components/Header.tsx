import React from 'react';
import {
  Code2,
  Cpu,
  Eye,
  GitFork,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { EditorMode } from '../types/editor';
import { ProjectData } from '../types/logic';
import { STARTER_PROJECTS } from '../utils/defaultProject';

interface HeaderProps {
  currentProject: ProjectData;
  onSelectProject: (proj: ProjectData) => void;
  activeMode: EditorMode;
  onChangeMode: (mode: EditorMode) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onResetProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onSelectProject,
  activeMode,
  onChangeMode,
  onOpenImport,
  onOpenExport,
  onResetProject,
}) => {
  const [templateDropdownOpen, setTemplateDropdownOpen] = React.useState(false);

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold tracking-tight text-base">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline text-white font-semibold">Visual Studio</span>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Project & Template Dropdown */}
        <div className="relative">
          <button
            onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <span className="truncate max-w-[160px] md:max-w-[220px]">
              {currentProject.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {templateDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setTemplateDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Preset Projects
                </div>
                {STARTER_PROJECTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(JSON.parse(JSON.stringify(p)));
                      setTemplateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex flex-col hover:bg-slate-800 transition cursor-pointer ${
                      currentProject.id === p.id ? 'bg-indigo-950/40 border-l-2 border-indigo-500 text-white' : 'text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[11px] text-slate-400 truncate mt-0.5">
                      {p.description}
                    </span>
                  </button>
                ))}
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    const blank: ProjectData = {
                      id: `blank-${Date.now()}`,
                      name: 'Untitled Project',
                      description: 'Fresh clean project canvas',
                      customCSS: '',
                      variables: [
                        { id: 'v1', name: 'count', type: 'number', value: 0, defaultValue: 0, description: 'Reactive count' },
                        { id: 'v2', name: 'message', type: 'string', value: 'Hello World', defaultValue: 'Hello World', description: 'Greeting' }
                      ],
                      functions: [
                        { id: 'f1', name: 'increment', params: [], code: 'state.count = (state.count || 0) + 1;', description: 'Add 1 to count' }
                      ],
                      classes: [],
                      workers: [],
                      rootElement: {
                        id: 'root-box',
                        tag: 'div',
                        name: 'Root Container',
                        classes: 'min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center gap-4',
                        styles: {},
                        attributes: {},
                        content: '',
                        bindings: {},
                        children: [
                          {
                            id: 'h1-title',
                            tag: 'h1',
                            name: 'Heading',
                            classes: 'text-3xl font-bold text-indigo-400',
                            styles: {},
                            attributes: {},
                            content: 'New Application',
                            bindings: {},
                            children: []
                          },
                          {
                            id: 'count-label',
                            tag: 'p',
                            name: 'Counter Value',
                            classes: 'text-2xl font-mono bg-slate-800 px-4 py-2 rounded-lg',
                            styles: {},
                            attributes: {},
                            content: '0',
                            bindings: {
                              textBinding: { sourceType: 'variable', targetId: 'count' }
                            },
                            children: []
                          },
                          {
                            id: 'inc-btn',
                            tag: 'button',
                            name: 'Increment Button',
                            classes: 'px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg text-sm font-medium transition cursor-pointer',
                            styles: {},
                            attributes: {},
                            content: 'Click to Count +',
                            bindings: {
                              eventBindings: [
                                { id: 'eb1', eventName: 'click', actionType: 'callFunction', targetId: 'increment' }
                              ]
                            },
                            children: []
                          }
                        ]
                      },
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    };
                    onSelectProject(blank);
                    setTemplateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 transition cursor-pointer flex items-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create Blank Project</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    setTemplateDropdownOpen(false);
                    onOpenImport();
                  }}
                  className="w-full text-left px-3 py-2 text-indigo-400 hover:bg-slate-800 transition cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Project (.zip, .html, .js)...</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mode Switcher Navigation Tabs */}
      <nav className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-inner">
        <button
          onClick={() => onChangeMode('canvas')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'canvas'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Visual Canvas Editor with Drag-and-Drop & CSS styling"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Visual Canvas</span>
        </button>

        <button
          onClick={() => onChangeMode('dataflow')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'dataflow'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Data Flow Diagram showing UI pointers to Variables, Functions, Classes & Workers"
        >
          <GitFork className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Wiring Graph</span>
        </button>

        <button
          onClick={() => onChangeMode('preview')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'preview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Interactive Live Run with real Web Workers & State execution"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Live Run</span>
        </button>

        <button
          onClick={() => onChangeMode('code')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'code'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="View Generated HTML, CSS, JS and Web Worker code"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Code</span>
        </button>
      </nav>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onResetProject}
          title="Reset project to initial state"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/50 text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          title="Import HTML, CSS, JS, Web Workers, or ZIP project"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Import</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Project</span>
        </button>
      </div>
    </header>
  );
};
