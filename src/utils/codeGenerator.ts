import { ProjectData } from '../types/logic';
import { VisualElement } from '../types/editor';
import { composeAioHtml } from './codeFormatter';

function renderElementToHtml(el: VisualElement, indent = 4): string {
  const pad = ' '.repeat(indent);
  const tag = el.tag;
  const attrs: string[] = [];

  if (el.id) attrs.push(`id="${el.id}"`);
  if (el.classes && el.classes.trim()) attrs.push(`class="${el.classes.trim()}"`);

  // Custom inline styles
  if (el.styles && Object.keys(el.styles).length > 0) {
    const styleStr = Object.entries(el.styles)
      .map(([k, v]) => {
        const cssKey = k.startsWith('--') ? k : k.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${v}`;
      })
      .join('; ');
    attrs.push(`style="${styleStr}"`);
  }

  // Attributes
  if (el.attributes) {
    Object.entries(el.attributes).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        attrs.push(`${k}="${v}"`);
      }
    });
  }

  const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  // Void elements
  const isVoid = ['input', 'img', 'br', 'hr'].includes(tag);
  if (isVoid) {
    return `${pad}<${tag}${attrString} />`;
  }

  if (el.children && el.children.length > 0) {
    const inner = el.children.map((child) => renderElementToHtml(child, indent + 2)).join('\n');
    return `${pad}<${tag}${attrString}>\n${inner}\n${pad}</${tag}>`;
  }

  const content = el.content ? el.content : '';
  return `${pad}<${tag}${attrString}>${content}</${tag}>`;
}

export function generateHtmlFile(project: ProjectData): string {
  const bodyContent = renderElementToHtml(project.rootElement, 4);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <meta name="description" content="${project.description || 'Exported standalone project'}">
  <!-- Tailwind CSS CDN for instant rendering -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
${bodyContent}

  <!-- Application Logic & Thread Runtime -->
  <script src="app.js"></script>
</body>
</html>`;
}

export function generateCssFile(project: ProjectData): string {
  return `/* Exported Custom CSS for ${project.name} */
/* Global Reset & Base Typography */
* {
  box-sizing: border-box;
}

${project.customCSS || '/* Custom CSS rules go here */'}
`;
}

export function generateWorkerFile(project: ProjectData): string {
  if (!project.workers || project.workers.length === 0) {
    return `// No Web Workers configured in this project.`;
  }

  // If there is a primary worker or combined workers:
  return project.workers
    .map(
      (w) => `/**
 * Web Worker Thread: ${w.name}
 * Description: ${w.description || 'Background worker thread'}
 */
${w.scriptCode}
`
    )
    .join('\n\n// -----------------------------------------\n\n');
}

export function generateAppJsFile(project: ProjectData, isStandaloneBundle = false): string {
  // Collect all bindings across elements
  const allElements: VisualElement[] = [];
  function collect(el: VisualElement) {
    allElements.push(el);
    el.children.forEach(collect);
  }
  collect(project.rootElement);

  // Initial state variables object
  const stateInitObj = project.variables.reduce((acc, v) => {
    acc[v.name] = v.value ?? v.defaultValue;
    return acc;
  }, {} as Record<string, any>);

  // Classes declarations
  const classesJs = project.classes
    .map((c) => {
      const methodsJs = c.methods
        .map((m) => `  ${m.name}(${m.params.join(', ')}) {\n    ${m.code.replace(/\n/g, '\n    ')}\n  }`)
        .join('\n\n');

      return `// --- Class: ${c.name} ---
class ${c.name} {
  constructor(${c.constructorParams.join(', ')}) {
${c.properties.map((p) => `    this.${p.name} = ${JSON.stringify(p.initialValue)};`).join('\n')}
    ${c.constructorCode ? c.constructorCode.replace(/\n/g, '\n    ') : ''}
  }

${methodsJs}
}`;
    })
    .join('\n\n');

  // Classes instantiation
  const instancesJs = project.classes
    .map((c) => `const ${c.instanceName} = new ${c.name}();\nclasses['${c.instanceName}'] = ${c.instanceName};\nwindow['${c.instanceName}'] = ${c.instanceName};\nwindow['${c.name}'] = ${c.name};`)
    .join('\n');

  // Functions declarations
  const functionsJs = project.functions
    .map((f) => {
      return `// Function: ${f.name}
function ${f.name}(${f.params.join(', ')}) {
  ${f.code.replace(/\n/g, '\n  ')}
}
functions['${f.name}'] = ${f.name};
window['${f.name}'] = ${f.name};`;
    })
    .join('\n\n');

  // Worker initialization
  let workersJs = '';
  if (project.workers && project.workers.length > 0) {
    if (isStandaloneBundle) {
      // In standalone single-file bundle, workers are spawned via Blob URL so it works offline and directly from file://
      workersJs = project.workers
        .map((w) => {
          const escapedCode = JSON.stringify(w.scriptCode);
          return `// Web Worker Thread: ${w.name} (Standalone Blob Worker)
const ${w.instanceName}Blob = new Blob([${escapedCode}], { type: 'application/javascript' });
const ${w.instanceName} = new Worker(URL.createObjectURL(${w.instanceName}Blob));
workers['${w.instanceName}'] = ${w.instanceName};
window['${w.instanceName}'] = ${w.instanceName};

${w.instanceName}.onmessage = function(event) {
  ${w.onMessageCode.replace(/\n/g, '\n  ')}
};

${w.instanceName}.onerror = function(err) {
  console.error('Worker error in [${w.name}]:', err);
};`;
        })
        .join('\n\n');
    } else {
      // In multi-file project, worker can load from worker.js (or fallback to Blob if opened via file://)
      workersJs = project.workers
        .map((w) => {
          const escapedCode = JSON.stringify(w.scriptCode);
          return `// Web Worker Thread: ${w.name}
let ${w.instanceName};
try {
  ${w.instanceName} = new Worker('worker.js');
} catch (e) {
  console.warn('Direct worker.js load failed (often due to file:// protocol), using Blob fallback:', e);
  const blob = new Blob([${escapedCode}], { type: 'application/javascript' });
  ${w.instanceName} = new Worker(URL.createObjectURL(blob));
}
workers['${w.instanceName}'] = ${w.instanceName};
window['${w.instanceName}'] = ${w.instanceName};

${w.instanceName}.onmessage = function(event) {
  ${w.onMessageCode.replace(/\n/g, '\n  ')}
};

${w.instanceName}.onerror = function(err) {
  console.error('Worker error in [${w.name}]:', err);
};`;
        })
        .join('\n\n');
    }
  }

  // Generate DOM binding synchronization logic
  const textBindingRules: string[] = [];
  const attrBindingRules: string[] = [];
  const eventBindingListeners: string[] = [];

  allElements.forEach((el) => {
    const elId = el.id;

    // Text binding
    if (el.bindings?.textBinding) {
      const tb = el.bindings.textBinding;
      if (tb.sourceType === 'variable') {
        let valExpr = `state['${tb.targetId}']`;
        if (tb.format === 'currency') valExpr = `'$' + ${valExpr}`;
        else if (tb.format === 'uppercase') valExpr = `String(${valExpr}).toUpperCase()`;
        textBindingRules.push(`
    const el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')} = document.getElementById('${elId}');
    if (el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}) {
      const val = ${valExpr};
      el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}.textContent = val !== undefined ? val : '';
    }`);
      }
    }

    // Attribute bindings
    if (el.bindings?.attributeBindings) {
      el.bindings.attributeBindings.forEach((ab) => {
        if (ab.sourceType === 'variable') {
          attrBindingRules.push(`
    const el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')} = document.getElementById('${elId}');
    if (el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}) {
      const val = state['${ab.targetId}'];
      if ('${ab.attributeName}' === 'value') {
        if (el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}.value !== String(val)) {
          el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}.value = val !== undefined ? val : '';
        }
      } else if ('${ab.attributeName}'.startsWith('style.')) {
        const styleProp = '${ab.attributeName}'.replace('style.', '');
        el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}.style[styleProp] = val;
      } else {
        el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}.setAttribute('${ab.attributeName}', val);
      }
    }`);
        }
      });
    }

    // Event bindings
    if (el.bindings?.eventBindings) {
      el.bindings.eventBindings.forEach((eb) => {
        let handlerBody = '';
        if (eb.actionType === 'callFunction') {
          const payload = eb.payloadExpr ? eb.payloadExpr : '';
          handlerBody = `if (typeof functions['${eb.targetId}'] === 'function') {
      functions['${eb.targetId}'](${payload});
    }`;
        } else if (eb.actionType === 'setVariable') {
          const expr = eb.payloadExpr || '$event.target.value';
          handlerBody = `state['${eb.targetId}'] = ${expr.replace(/\$event/g, 'event')};`;
        } else if (eb.actionType === 'incrementVariable') {
          handlerBody = `state['${eb.targetId}'] = (Number(state['${eb.targetId}']) || 0) + 1;`;
        } else if (eb.actionType === 'toggleVariable') {
          handlerBody = `state['${eb.targetId}'] = !state['${eb.targetId}'];`;
        } else if (eb.actionType === 'invokeClassMethod') {
          handlerBody = `// Invoking class method ${eb.targetId}
    const [inst, mth] = '${eb.targetId}'.split('.');
    if (classes[inst] && typeof classes[inst][mth] === 'function') {
      classes[inst][mth](${eb.payloadExpr || ''});
    }`;
        } else if (eb.actionType === 'postWorkerMessage') {
          handlerBody = `if (workers['${eb.targetId}']) {
      workers['${eb.targetId}'].postMessage(${eb.payloadExpr || '{ command: "start" }'});
    }`;
        }

        eventBindingListeners.push(`
  // Event: ${el.name || elId} -> ${eb.eventName}
  const el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')} = document.getElementById('${elId}');
  if (el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}) {
    el_${elId.replace(/[^a-zA-Z0-9_]/g, '_')}.addEventListener('${eb.eventName}', function(event) {
      ${handlerBody}
    });
  }`);
      });
    }
  });

  const importsList = project.imports || [];
  const importsHeader = importsList.length > 0 ? importsList.join('\n') + '\n\n' : '';

  return `/**
 * Standalone Application Runtime
 * Project: ${project.name}
 * Generated by Browser Visual Editor
 */

${importsHeader}// --- Runtime Scope Objects ---
const functions = {};
const classes = {};
const workers = {};

// --- Reactive State Proxy ---
const rawState = ${JSON.stringify(stateInitObj, null, 2)};

function syncDOM() {
  ${textBindingRules.join('')}
  ${attrBindingRules.join('')}
}

const state = new Proxy(rawState, {
  set(target, prop, value) {
    target[prop] = value;
    syncDOM();
    return true;
  }
});

// Expose to window for debugging, inline handlers, and inspector inspection
window.appState = state;
window.state = state;
window.appClasses = classes;
window.classes = classes;
window.appWorkers = workers;
window.workers = workers;
window.appFunctions = functions;
window.functions = functions;

// --- Classes Definitions ---
${classesJs}

// --- Instantiate Classes ---
${instancesJs}

// --- Functions Definitions ---
${functionsJs}

// --- Web Workers (Background Threads) ---
${workersJs}

// --- Attach DOM Event Listeners & Initialize UI ---
function initApp() {
${eventBindingListeners.join('')}

  // Initial DOM synchronization
  syncDOM();
  console.log('Project [${project.name}] initialized with state, classes, and worker threads.');
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`;
}

export function generateStandaloneHtmlFile(project: ProjectData): string {
  const bodyContent = renderElementToHtml(project.rootElement, 4);
  const appJsCode = generateAppJsFile(project, true);
  const cssCode = project.customCSS || '';

  // Generate external CDN scripts
  const externalScriptsHtml = (project.externalScripts || [])
    .map((src) => `  <script src="${src}"></script>`)
    .join('\n');

  // Build import map for any bare specifier imports
  const importMap: Record<string, string> = {
    'canvas-confetti': 'https://esm.sh/canvas-confetti@1.9.4',
    'lodash': 'https://esm.sh/lodash-es@4.17.21',
    'date-fns': 'https://esm.sh/date-fns',
    'd3': 'https://esm.sh/d3@7',
    'three': 'https://esm.sh/three@0.160.0',
    'lucide': 'https://esm.sh/lucide',
  };

  (project.imports || []).forEach((imp) => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/);
    const specifier = match ? (match[1] || match[2]) : null;
    if (specifier && !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('http')) {
      if (!importMap[specifier]) {
        importMap[specifier] = `https://esm.sh/${specifier}`;
      }
    }
  });

  const importMapHtml = `  <script type="importmap">
  {
    "imports": ${JSON.stringify(importMap, null, 6)}
  }
  </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <meta name="description" content="${project.description || 'Exported standalone application'}">
  <!-- Tailwind CSS CDN for instant styling -->
  <script src="https://cdn.tailwindcss.com"></script>
${externalScriptsHtml ? externalScriptsHtml + '\n' : ''}${importMapHtml}
  <style>
${cssCode}
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
${bodyContent}

  <script type="module">
${appJsCode}
  </script>
</body>
</html>`;
}

/**
 * Generates formatted All-In-One (AIO) HTML file matching:
 * <html>
 *   <header></header>
 *   <body></body>
 *   <script></script>
 *   <style></style>
 * </html>
 */
export function generateAioHtmlFile(project: ProjectData): string {
  const root = project.rootElement;
  let headerHtml = '';
  let bodyHtml = '';

  const headerChild = root.children?.find((c) => c.tag === 'header');
  if (headerChild) {
    headerHtml = renderElementToHtml(headerChild, 4);
    const otherChildren = root.children?.filter((c) => c.tag !== 'header') || [];
    const tempRoot = { ...root, children: otherChildren };
    bodyHtml = renderElementToHtml(tempRoot, 4);
  } else {
    bodyHtml = renderElementToHtml(root, 4);
  }

  const appJsCode = generateAppJsFile(project, true);
  const cssCode = project.customCSS || '';

  return composeAioHtml({
    headerHtml: headerHtml || undefined,
    bodyHtml,
    css: cssCode,
    js: appJsCode,
    title: project.name,
    externalScripts: project.externalScripts,
  });
}

