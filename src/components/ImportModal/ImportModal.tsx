import React from 'react';
import {
  Upload,
  FolderArchive,
  FileCode,
  FileText,
  Check,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Zap,
  Box,
  Eye,
} from 'lucide-react';
import { ProjectData } from '../../types/logic';
import {
  importProjectFromCode,
  importProjectFromZip,
  CLIENT_IMPORT_PRESETS,
  ImportPreset,
} from '../../utils/codeImporter';
import {
  formatAioHtml,
  decomposeAioHtml,
  composeAioHtml,
  formatHtml,
  formatCss,
  formatJs,
} from '../../utils/codeFormatter';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProject: (project: ProjectData) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportProject,
}) => {
  const [activeTab, setActiveTab] = React.useState<'upload' | 'paste' | 'templates'>('upload');
  const [pasteTab, setPasteTab] = React.useState<'standalone' | 'html' | 'css' | 'js' | 'worker'>('standalone');

  // Input states
  const [projectName, setProjectName] = React.useState('Imported Project');
  const [standaloneHtml, setStandaloneHtml] = React.useState('');
  const [htmlCode, setHtmlCode] = React.useState('');
  const [cssCode, setCssCode] = React.useState('');
  const [jsCode, setJsCode] = React.useState('');
  const [workerCode, setWorkerCode] = React.useState('');

  // Upload states
  const [uploadedFilesList, setUploadedFilesList] = React.useState<{ name: string; size: string; type: string }[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Drag over state
  const [isDragOver, setIsDragOver] = React.useState(false);

  // File input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ImportPreset) => {
    setProjectName(preset.name);
    setHtmlCode(preset.html);
    setCssCode(preset.css);
    setJsCode(preset.js);
    setWorkerCode(preset.worker || '');
    if (preset.id === 'aio-html-app') {
      setStandaloneHtml(preset.html);
      setPasteTab('standalone');
    } else {
      setStandaloneHtml('');
      setPasteTab('html');
    }
    setActiveTab('paste');
    setSuccessMessage(`Loaded "${preset.name}" preset! Click "Import Project" to load.`);
    setErrorMessage(null);
  };

  const handleFormatCurrentTab = () => {
    try {
      if (pasteTab === 'standalone') {
        const input = standaloneHtml.trim() || handleGetAioBoilerplate();
        const formatted = formatAioHtml(input);
        setStandaloneHtml(formatted);
        setSuccessMessage('Formatted All-In-One HTML with canonical <html>, <header>, <body>, <script>, and <style> sections!');
      } else if (pasteTab === 'html') {
        setHtmlCode(formatHtml(htmlCode));
        setSuccessMessage('Formatted HTML markup with 2-space indentation.');
      } else if (pasteTab === 'css') {
        setCssCode(formatCss(cssCode));
        setSuccessMessage('Formatted CSS stylesheet with structured rules.');
      } else if (pasteTab === 'js') {
        setJsCode(formatJs(jsCode));
        setSuccessMessage('Formatted JavaScript logic and event handlers.');
      }
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Formatting error: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDecomposeAio = () => {
    try {
      const input = standaloneHtml.trim();
      if (!input) {
        setErrorMessage('Please paste or enter All-In-One HTML first.');
        return;
      }
      const decomposed = decomposeAioHtml(input);
      setHtmlCode(decomposed.combinedHtml || input);
      setCssCode(decomposed.css || '');
      setJsCode(decomposed.js || '');
      setPasteTab('html');
      setSuccessMessage('Successfully decomposed All-In-One HTML into separate HTML, CSS, and JS tabs!');
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Failed to decompose AIO HTML: ' + (err.message || 'Unknown error'));
    }
  };

  const handleComposeToAio = () => {
    try {
      const composed = composeAioHtml({
        html: htmlCode,
        css: cssCode,
        js: jsCode,
        title: projectName,
      });
      setStandaloneHtml(composed);
      setPasteTab('standalone');
      setSuccessMessage('Successfully composed separate tabs into formatted All-In-One (AIO) HTML document!');
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Failed to compose AIO HTML: ' + (err.message || 'Unknown error'));
    }
  };

  const handleGetAioBoilerplate = () => {
    return `<!DOCTYPE html>
<html>
  <header class="w-full py-4 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30">AIO</div>
      <div>
        <h1 class="text-base font-bold text-white tracking-tight">${projectName.trim() || 'All-In-One Application'}</h1>
        <p class="text-xs text-slate-400">Integrated HTML, CSS & JavaScript</p>
      </div>
    </div>
    <div class="flex items-center space-x-3 text-xs">
      <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Live Sync</span>
      <span id="counter-badge" class="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">Clicks: 0</span>
    </div>
  </header>
  <body class="p-6 bg-slate-950 text-slate-100 min-h-screen">
    <main class="max-w-4xl mx-auto space-y-6">
      <div class="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center space-y-4 shadow-xl">
        <h2 class="text-xl font-bold text-white">Interactive AIO Application</h2>
        <p class="text-xs text-slate-400 max-w-md">
          This project demonstrates seamless All-In-One HTML parsing and formatting with structured &lt;header&gt;, &lt;body&gt;, &lt;script&gt;, and &lt;style&gt; sections.
        </p>
        <div class="flex gap-3">
          <button id="btn-increment" onclick="incrementCounter()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer">
            + Increment Counter
          </button>
          <button id="btn-reset" onclick="resetCounter()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer">
            Reset
          </button>
        </div>
      </div>
    </main>
  </body>
  <script>
    let counter = 0;

    function incrementCounter() {
      counter++;
      state.counter = counter;
      const badge = document.getElementById('counter-badge');
      if (badge) {
        badge.textContent = 'Clicks: ' + counter;
      }
    }

    function resetCounter() {
      counter = 0;
      state.counter = 0;
      const badge = document.getElementById('counter-badge');
      if (badge) {
        badge.textContent = 'Clicks: 0';
      }
    }
  </script>
  <style>
    /* All-In-One Custom CSS */
    #counter-badge {
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #counter-badge:hover {
      transform: scale(1.05);
    }
    .custom-gradient {
      background: linear-gradient(135deg, #1e1e2e 0%, #11111b 100%);
    }
  </style>
</html>`;
  };

  const handleLoadAioBoilerplate = () => {
    setStandaloneHtml(handleGetAioBoilerplate());
    setSuccessMessage('Loaded All-In-One (AIO) HTML starter boilerplate.');
    setErrorMessage(null);
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const summaryList = files.map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        type: f.type || 'file',
      }));
      setUploadedFilesList(summaryList);

      // Check if there is a ZIP file
      const zipFile = files.find((f) => f.name.endsWith('.zip'));
      if (zipFile) {
        const imported = await importProjectFromZip(zipFile);
        onImportProject(imported);
        onClose();
        return;
      }

      // Check if there is a project JSON file
      const jsonFile = files.find((f) => f.name.endsWith('.json'));
      if (jsonFile && files.length === 1) {
        const text = await jsonFile.text();
        const parsed = JSON.parse(text);
        if (parsed.rootElement) {
          onImportProject(parsed);
          onClose();
          return;
        }
      }

      // Handle individual HTML, CSS, JS files
      let loadedHtml = '';
      let loadedCss = '';
      let loadedJs = '';
      let loadedWorker = '';
      let inferredName = files[0].name.replace(/\.[^/.]+$/, '');

      for (const file of files) {
        const lower = file.name.toLowerCase();
        const text = await file.text();
        if (lower.endsWith('.html') || lower.endsWith('.htm')) {
          const decomposed = decomposeAioHtml(text);
          loadedHtml = decomposed.combinedHtml || text;
          if (decomposed.css) {
            loadedCss += (loadedCss ? '\n\n' : '') + decomposed.css;
          }
          if (decomposed.js) {
            loadedJs += (loadedJs ? '\n\n' : '') + decomposed.js;
          }
        } else if (lower.endsWith('.css')) {
          loadedCss += (loadedCss ? '\n\n' : '') + text;
        } else if (lower.includes('worker') && lower.endsWith('.js')) {
          loadedWorker = text;
        } else if (lower.endsWith('.js')) {
          loadedJs += (loadedJs ? '\n\n' : '') + text;
        }
      }

      if (!loadedHtml && (loadedJs || loadedCss)) {
        loadedHtml = `<div class="max-w-4xl mx-auto p-6 space-y-4">
  <div class="border-b border-slate-800 pb-4">
    <h1 class="text-2xl font-bold text-white">${inferredName || 'Imported Application'}</h1>
    <p class="text-xs text-slate-400 mt-1">Imported application logic & styles</p>
  </div>
  <div id="app" class="p-6 bg-slate-900 border border-slate-800 rounded-xl min-h-[220px] flex items-center justify-center text-slate-400 text-sm">
    Application Container (#app)
  </div>
</div>`;
      }

      if (loadedHtml) {
        const imported = importProjectFromCode(
          inferredName || 'Imported Project',
          loadedHtml,
          loadedCss,
          loadedJs,
          loadedWorker
        );
        onImportProject(imported);
        onClose();
      } else {
        setErrorMessage('No HTML, JavaScript, or CSS files were found among the uploaded files.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse uploaded project files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectImportPreset = (preset: ImportPreset) => {
    try {
      const imported = importProjectFromCode(
        preset.name,
        preset.html,
        preset.css,
        preset.js,
        preset.worker || ''
      );
      onImportProject(imported);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import preset.');
    }
  };

  const handleExecuteImport = () => {
    setErrorMessage(null);

    // If on templates tab, import preset directly
    if (activeTab === 'templates') {
      const targetPreset = CLIENT_IMPORT_PRESETS[0];
      if (targetPreset) {
        handleDirectImportPreset(targetPreset);
      }
      return;
    }

    // If on upload tab with no files chosen, trigger file browser
    if (activeTab === 'upload') {
      fileInputRef.current?.click();
      return;
    }

    try {
      let finalHtml = htmlCode.trim();
      let finalCss = cssCode.trim();
      let finalJs = jsCode.trim();

      if (pasteTab === 'standalone' && standaloneHtml.trim()) {
        const decomposed = decomposeAioHtml(standaloneHtml.trim());
        finalHtml = decomposed.combinedHtml || standaloneHtml.trim();
        if (decomposed.css) {
          finalCss = [finalCss, decomposed.css].filter(Boolean).join('\n\n');
        }
        if (decomposed.js) {
          finalJs = [finalJs, decomposed.js].filter(Boolean).join('\n\n');
        }
      }

      if (!finalHtml && !finalJs && !finalCss) {
        setErrorMessage('Please provide HTML markup, JavaScript, or CSS code to import.');
        return;
      }

      const effectiveHtml = finalHtml || `<div class="max-w-4xl mx-auto p-6 space-y-4">
  <div class="border-b border-slate-800 pb-4">
    <h1 class="text-2xl font-bold text-white">${projectName.trim() || 'Imported Application'}</h1>
    <p class="text-xs text-slate-400 mt-1">Imported client-side logic & styles</p>
  </div>
  <div id="app" class="p-6 bg-slate-900 border border-slate-800 rounded-xl min-h-[220px] flex items-center justify-center text-slate-400 text-sm">
    Application Container (#app)
  </div>
</div>`;

      const imported = importProjectFromCode(
        projectName.trim() || 'Imported Project',
        effectiveHtml,
        finalCss,
        finalJs,
        workerCode
      );

      onImportProject(imported);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while importing project code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Client-Side Project</h2>
              <p className="text-xs text-slate-400">
                Import standalone HTML, CSS, JavaScript, ES6 classes, Web Workers, or .ZIP project archives.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Tabs */}
        <div className="px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1 text-xs">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-1.5 py-3 px-4 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Upload ZIP or Files</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center space-x-1.5 py-3 px-4 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Paste Code (HTML / CSS / JS)</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-1.5 py-3 px-4 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'templates'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Starter Templates</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Project Name:</span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-44"
              placeholder="Project Name..."
            />
          </div>
        </div>

        {/* Status / Alert Banner */}
        {errorMessage && (
          <div className="px-6 py-2 bg-rose-950/50 border-b border-rose-800/60 flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="px-6 py-2 bg-emerald-950/50 border-b border-emerald-800/60 flex items-center space-x-2 text-emerald-300 text-xs">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* TAB 1: File / ZIP Upload */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragOver
                    ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.html,.htm,.css,.js,.json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  Drag & Drop Project ZIP or Web Files Here
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Supports exported project <span className="text-indigo-400 font-mono">.zip</span> archives, single-file <span className="text-emerald-400 font-mono">.html</span> documents, or simultaneous <span className="text-cyan-400 font-mono">index.html + style.css + app.js</span> uploads.
                </p>

                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  Browse Files...
                </button>
              </div>

              {/* Supported formats callout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
                    <FolderArchive className="w-4 h-4" />
                    <span>Project Archive (.ZIP)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Extracts html, css, js, and worker scripts automatically with hierarchy preserved.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                    <FileCode className="w-4 h-4" />
                    <span>Standalone HTML</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Parses DOM elements, extracts &lt;style&gt; into custom CSS, and &lt;script&gt; into project logic.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                    <Cpu className="w-4 h-4" />
                    <span>Web Worker & Classes</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Detects worker.js, ES6 classes, constructor props, and reactive state variables.
                  </p>
                </div>
              </div>

              {uploadedFilesList.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Uploaded Files:</span>
                  <div className="space-y-1.5">
                    {uploadedFilesList.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 text-xs font-mono"
                      >
                        <span className="text-white truncate">{f.name}</span>
                        <span className="text-slate-500 text-[11px] shrink-0 ml-2">{f.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Paste Code */}
          {activeTab === 'paste' && (
            <div className="h-full flex flex-col space-y-4">
              {/* Paste sub-tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 text-xs gap-2">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <button
                    onClick={() => setPasteTab('standalone')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                      pasteTab === 'standalone'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>All-in-One (AIO) HTML</span>
                  </button>

                  <div className="h-3 w-px bg-slate-800" />

                  <button
                    onClick={() => setPasteTab('html')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      pasteTab === 'html'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    HTML Markup
                  </button>

                  <button
                    onClick={() => setPasteTab('css')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      pasteTab === 'css'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    CSS Stylesheet
                  </button>

                  <button
                    onClick={() => setPasteTab('js')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      pasteTab === 'js'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    JavaScript Logic
                  </button>

                  <button
                    onClick={() => setPasteTab('worker')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
                      pasteTab === 'worker'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Web Worker</span>
                  </button>
                </div>

                {/* Right toolbar actions */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleFormatCurrentTab}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    title="Format and auto-indent code"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Format {pasteTab === 'standalone' ? 'AIO HTML' : 'Code'}</span>
                  </button>

                  {pasteTab === 'standalone' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDecomposeAio}
                        disabled={!standaloneHtml.trim()}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        title="Split AIO HTML into separate HTML, CSS, and JS tabs"
                      >
                        <Layers className="w-3 h-3 text-indigo-400" />
                        <span>Split to Tabs</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadAioBoilerplate}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        title="Load starter AIO template"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>AIO Template</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleComposeToAio}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 rounded-lg text-[11px] font-medium transition cursor-pointer"
                      title="Compose current HTML, CSS, and JS tabs into All-In-One HTML"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Combine into AIO</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Paste editor fields */}
              <div className="flex-1 min-h-[340px]">
                {pasteTab === 'standalone' && (
                  <div className="h-full flex flex-col space-y-2">
                    <div className="flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span>All-In-One (AIO) HTML document:</span>
                        <div className="hidden sm:flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">&lt;html&gt;</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">&lt;header&gt;</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">&lt;body&gt;</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">&lt;script&gt;</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">&lt;style&gt;</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500">Auto-formats & parses tags</span>
                    </div>
                    <textarea
                      value={standaloneHtml}
                      onChange={(e) => setStandaloneHtml(e.target.value)}
                      placeholder={`<!DOCTYPE html>\n<html>\n  <header class="w-full p-4 border-b border-slate-800">\n    <h1 class="text-lg font-bold text-white">Application Header</h1>\n  </header>\n  <body class="p-6 bg-slate-950 text-slate-100">\n    <main class="max-w-4xl mx-auto space-y-4">\n      <button id="btn-demo" onclick="demoAction()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">Action</button>\n    </main>\n  </body>\n  <script>\n    function demoAction() {\n      console.log("AIO action executed");\n    }\n  </script>\n  <style>\n    #btn-demo { transition: opacity 0.2s; }\n  </style>\n</html>`}
                      className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                )}

                {pasteTab === 'html' && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className="text-xs text-slate-400">HTML markup snippet or document body:</span>
                    <textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      placeholder={`<div class="max-w-xl mx-auto p-6 bg-slate-800 rounded-xl">\n  <h1 class="text-2xl font-bold text-white">Application Title</h1>\n  <button id="action-btn" class="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">Click Me</button>\n</div>`}
                      className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                )}

                {pasteTab === 'css' && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className="text-xs text-slate-400">Custom CSS rules & styling:</span>
                    <textarea
                      value={cssCode}
                      onChange={(e) => setCssCode(e.target.value)}
                      placeholder={`/* Custom styles */\n.card-hover {\n  transition: transform 0.2s;\n}\n.card-hover:hover {\n  transform: translateY(-4px);\n}`}
                      className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                )}

                {pasteTab === 'js' && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className="text-xs text-slate-400">JavaScript functions, ES6 classes, and state variables:</span>
                    <textarea
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      placeholder={`let count = 0;\n\nfunction increment() {\n  state.count = (state.count || 0) + 1;\n}\n\nclass DataManager {\n  constructor() {\n    this.items = [];\n  }\n  addItem(item) {\n    this.items.push(item);\n  }\n}`}
                      className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                )}

                {pasteTab === 'worker' && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className="text-xs text-slate-400">Web Worker background thread script (self.onmessage):</span>
                    <textarea
                      value={workerCode}
                      onChange={(e) => setWorkerCode(e.target.value)}
                      placeholder={`self.onmessage = function(e) {\n  const { command, data } = e.data;\n  // Heavy computation in background thread...\n  self.postMessage({ result: 'done' });\n};`}
                      className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Starter Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Ready-To-Import Client-Side Applications
                </h3>
                <p className="text-xs text-slate-400">
                  Select any pre-built HTML, CSS, JavaScript & Web Worker project to immediately inspect, test, and edit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CLIENT_IMPORT_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col justify-between space-y-3 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {preset.category}
                        </span>
                        {preset.worker && (
                          <span className="flex items-center space-x-1 text-[10px] text-cyan-400 font-mono">
                            <Cpu className="w-3 h-3" />
                            <span>Worker</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs group-hover:text-indigo-400 transition">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2">
                      <button
                        onClick={() => handleDirectImportPreset(preset)}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import This Project</span>
                      </button>

                      <button
                        onClick={() => handleSelectPreset(preset)}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <span>Inspect & Edit Code</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Imports HTML tags, styles, functions, classes, and Web Worker threads into the Visual Studio runtime.
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
