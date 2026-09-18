import React from 'react';
import {
  Layers,
  ListTree,
  Crosshair,
  GitFork,
  Cpu,
  Database,
  Zap,
  Box,
  Code2,
  Upload,
  Download,
  Plus,
  ArrowRight,
  FolderArchive,
  FileCode,
  Check,
  Copy,
} from 'lucide-react';
import { EditorMode, ElementTag, VisualElement } from './types/editor';
import { ProjectData } from './types/logic';
import { MULTITHREADED_WORKER_PROJECT, STARTER_PROJECTS } from './utils/defaultProject';
import {
  findElementById,
  updateElementInTree,
  removeElementFromTree,
  addChildToElement,
  duplicateElementInTree,
  createDefaultElement,
  moveElementInTree,
  insertElementAt,
} from './utils/elementHelpers';
import { Header } from './components/Header';
import { ElementPalette } from './components/LeftSidebar/ElementPalette';
import { ElementTree } from './components/LeftSidebar/ElementTree';
import { PropertiesInspector } from './components/Inspector/PropertiesInspector';
import { VisualCanvas } from './components/Canvas/VisualCanvas';
import { LogicManager } from './components/LogicPanel/LogicManager';
import { DataFlowView } from './components/DataFlowGraph/DataFlowView';
import { LivePreview } from './components/Preview/LivePreview';
import { ExportModal } from './components/CodeModal/ExportModal';
import { ImportModal } from './components/ImportModal/ImportModal';
import {
  generateHtmlFile,
  generateCssFile,
  generateAppJsFile,
  generateWorkerFile,
  generateStandaloneHtmlFile,
} from './utils/codeGenerator';
import { downloadProjectZip, downloadStandaloneHtml, openPreviewInNewWindow } from './utils/exportProject';

export default function App() {
  const [project, setProject] = React.useState<ProjectData>(() =>
    JSON.parse(JSON.stringify(MULTITHREADED_WORKER_PROJECT))
  );

  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(
    'btn-trigger-worker'
  );
  const [activeMode, setActiveMode] = React.useState<EditorMode>('canvas');
  const [leftTab, setLeftTab] = React.useState<'elements' | 'tree' | 'logic'>('elements');
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [codeViewerTab, setCodeViewerTab] = React.useState<'html' | 'css' | 'js' | 'worker' | 'standalone'>('html');
  const [copied, setCopied] = React.useState(false);

  const handleImportProject = (importedProj: ProjectData) => {
    setProject(importedProj);
    setSelectedElementId(importedProj.rootElement.id);
    setActiveMode('canvas');
  };

  // Selected element lookup
  const selectedElement = React.useMemo(() => {
    if (!selectedElementId) return null;
    return findElementById(project.rootElement, selectedElementId);
  }, [project.rootElement, selectedElementId]);

  // Tree manipulation handlers
  const handleUpdateElement = (updated: VisualElement) => {
    setProject((prev) => ({
      ...prev,
      rootElement: updateElementInTree(prev.rootElement, updated.id, () => updated),
    }));
  };

  const handleAddElement = (tag: ElementTag) => {
    const newEl = createDefaultElement(tag);
    const parentId = selectedElementId || project.rootElement.id;

    setProject((prev) => ({
      ...prev,
      rootElement: addChildToElement(prev.rootElement, parentId, newEl),
    }));
    setSelectedElementId(newEl.id);
  };

  const handleDeleteElement = (id: string) => {
    if (id === project.rootElement.id) return;
    setProject((prev) => ({
      ...prev,
      rootElement: removeElementFromTree(prev.rootElement, id),
    }));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleDuplicateElement = (id: string) => {
    setProject((prev) => ({
      ...prev,
      rootElement: duplicateElementInTree(prev.rootElement, id),
    }));
  };

  const handleMoveElement = (
    sourceId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => {
    setProject((prev) => ({
      ...prev,
      rootElement: moveElementInTree(prev.rootElement, sourceId, targetId, position),
    }));
  };

  const handleInsertElement = (
    targetId: string,
    newElement: VisualElement,
    position: 'before' | 'after' | 'inside'
  ) => {
    setProject((prev) => ({
      ...prev,
      rootElement: insertElementAt(prev.rootElement, targetId, newElement, position),
    }));
    setSelectedElementId(newElement.id);
  };

  const handleUpdateProject = (partial: Partial<ProjectData>) => {
    setProject((prev) => ({ ...prev, ...partial }));
  };

  const handleResetProject = () => {
    const orig = STARTER_PROJECTS.find((p) => p.id === project.id) || MULTITHREADED_WORKER_PROJECT;
    setProject(JSON.parse(JSON.stringify(orig)));
    setSelectedElementId(null);
  };

  // Standalone code representations for the Code mode
  const htmlCode = React.useMemo(() => generateHtmlFile(project), [project]);
  const cssCode = React.useMemo(() => generateCssFile(project), [project]);
  const jsCode = React.useMemo(() => generateAppJsFile(project, false), [project]);
  const workerCode = React.useMemo(() => generateWorkerFile(project), [project]);
  const standaloneCode = React.useMemo(() => generateStandaloneHtmlFile(project), [project]);

  const activeCodeString =
    codeViewerTab === 'html'
      ? htmlCode
      : codeViewerTab === 'css'
      ? cssCode
      : codeViewerTab === 'js'
      ? jsCode
      : codeViewerTab === 'worker'
      ? workerCode
      : standaloneCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCodeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        currentProject={project}
        onSelectProject={(newProj) => {
          setProject(newProj);
          setSelectedElementId(null);
        }}
        activeMode={activeMode}
        onChangeMode={(m) => setActiveMode(m)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onResetProject={handleResetProject}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeMode === 'canvas' && (
          <>
            {/* Left Sidebar: Elements / Tree / Logic */}
            <aside className="w-72 md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-10">
              {/* Sidebar Tabs */}
              <div className="h-10 bg-slate-950 border-b border-slate-800 flex text-xs select-none">
                <button
                  onClick={() => setLeftTab('elements')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 font-medium border-b-2 transition cursor-pointer ${
                    leftTab === 'elements'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Elements</span>
                </button>

                <button
                  onClick={() => setLeftTab('tree')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 font-medium border-b-2 transition cursor-pointer ${
                    leftTab === 'tree'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListTree className="w-3.5 h-3.5" />
                  <span>DOM Tree</span>
                </button>

                <button
                  onClick={() => setLeftTab('logic')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 font-medium border-b-2 transition cursor-pointer ${
                    leftTab === 'logic'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Logic</span>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden">
                {leftTab === 'elements' && (
                  <ElementPalette
                    onAddElement={handleAddElement}
                    selectedElementId={selectedElementId}
                  />
                )}
                {leftTab === 'tree' && (
                  <ElementTree
                    rootElement={project.rootElement}
                    selectedElementId={selectedElementId}
                    onSelectElement={(id) => setSelectedElementId(id)}
                    onDeleteElement={handleDeleteElement}
                    onDuplicateElement={handleDuplicateElement}
                    onMoveElement={handleMoveElement}
                  />
                )}
                {leftTab === 'logic' && (
                  <div className="h-full overflow-hidden">
                    <LogicManager
                      project={project}
                      onUpdateProject={handleUpdateProject}
                    />
                  </div>
                )}
              </div>
            </aside>

            {/* Center: Visual Canvas */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
              <VisualCanvas
                project={project}
                selectedElementId={selectedElementId}
                onSelectElement={(id) => setSelectedElementId(id)}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onMoveElement={handleMoveElement}
                onInsertElement={handleInsertElement}
              />
            </main>

            {/* Right Sidebar: Logic Pointing & Style Inspector */}
            <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10">
              {selectedElement ? (
                <PropertiesInspector
                  key={selectedElement.id}
                  element={selectedElement}
                  project={project}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onDuplicateElement={handleDuplicateElement}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                  <Crosshair className="w-8 h-8 mb-2 opacity-40 text-indigo-400" />
                  <p className="font-semibold text-slate-300 mb-1">No Element Selected</p>
                  <p className="text-slate-500 max-w-[200px]">
                    Click any element in the canvas or DOM Tree to point its text, attributes, or events to variables, functions, classes, or Web Workers.
                  </p>
                </div>
              )}
            </aside>
          </>
        )}

        {/* Wiring & Data Flow Graph Mode */}
        {activeMode === 'dataflow' && (
          <DataFlowView
            project={project}
            onSelectElement={(id) => {
              setSelectedElementId(id);
              setActiveMode('canvas');
            }}
            onOpenLogic={() => {
              setActiveMode('canvas');
              setLeftTab('logic');
            }}
          />
        )}

        {/* Live Interactive Run Mode */}
        {activeMode === 'preview' && (
          <LivePreview project={project} onUpdateProject={handleUpdateProject} />
        )}

        {/* Standalone Project Code & Export Mode */}
        {activeMode === 'code' && (
          <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
            {/* Top Toolbar */}
            <div className="h-12 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  {[
                    { id: 'html', label: 'index.html' },
                    { id: 'css', label: 'style.css' },
                    { id: 'js', label: 'app.js' },
                    { id: 'worker', label: 'worker.js' },
                    { id: 'standalone', label: 'standalone.html' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCodeViewerTab(tab.id as any)}
                      className={`px-3 py-1 rounded font-mono font-medium transition cursor-pointer ${
                        codeViewerTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Import existing HTML, CSS, JS project"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Import Code</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => downloadProjectZip(project)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Download .ZIP</span>
                </button>

                <button
                  onClick={() => downloadStandaloneHtml(project)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download HTML</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto p-6 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
              <pre className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <code>{activeCodeString}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Standalone Project Export Modal */}
      <ExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Standalone Client-Side Project Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportProject={handleImportProject}
      />
    </div>
  );
}
