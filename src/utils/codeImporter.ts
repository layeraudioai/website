import JSZip from 'jszip';
import { VisualElement, ElementTag, EventBinding } from '../types/editor';
import { ProjectData, StateVariable, ProjectFunction, ProjectClass, ProjectWorker } from '../types/logic';
import { normalizeProjectTree } from './elementHelpers';

// Allowed visual tags
const VALID_TAGS: ElementTag[] = [
  'div',
  'section',
  'header',
  'main',
  'footer',
  'button',
  'input',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'badge',
  'card',
  'img',
  'form',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'ul',
  'ol',
  'li',
  'label',
  'textarea',
  'progress',
  'canvas',
  'a',
  'nav',
  'article',
  'aside',
  'select',
  'option',
  'code',
  'pre',
  'blockquote',
  'hr',
  'br',
  'svg',
  'path',
];

let globalElementCounter = 0;

function sanitizeTag(tagName: string): ElementTag {
  const lower = tagName.toLowerCase();
  if (VALID_TAGS.includes(lower as ElementTag)) {
    return lower as ElementTag;
  }
  if (['strong', 'b', 'i', 'em', 'small', 'kbd', 'mark', 'u', 's'].includes(lower)) {
    return 'span';
  }
  // Standard valid HTML custom elements or tags can be preserved directly
  if (/^[a-z][a-z0-9-]*$/.test(lower)) {
    return lower as ElementTag;
  }
  return 'div';
}

/**
 * Convert inline CSS style string to a React-compatible style object with camelCase properties
 */
export function parseInlineStyles(styleAttr: string): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleAttr) return styles;

  styleAttr.split(';').forEach((pair) => {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) return;
    const rawKey = pair.slice(0, colonIdx).trim();
    const value = pair.slice(colonIdx + 1).trim();
    if (!rawKey || !value) return;

    // Convert kebab-case to camelCase for React, except CSS variables (--var)
    let camelKey = rawKey;
    if (!rawKey.startsWith('--')) {
      camelKey = rawKey.replace(/-([a-z])/gi, (_, letter) => letter.toUpperCase());
    }
    styles[camelKey] = value;
  });

  return styles;
}

export interface ParsedHtmlResult {
  rootElement: VisualElement;
  extractedCSS: string;
  extractedScripts: string[];
  externalScripts?: string[];
  extractedTitle?: string;
}

/**
 * Convert a DOM node into a VisualElement tree
 */
function domNodeToVisualElement(
  node: Element,
  index = 0,
  functionsList: ProjectFunction[] = []
): VisualElement | null {
  const nodeTag = node.tagName.toLowerCase();

  // Skip script, style, and head tags as they are extracted separately
  if (['script', 'style', 'noscript', 'meta', 'title', 'head', 'link'].includes(nodeTag)) {
    return null;
  }

  const tag = sanitizeTag(nodeTag);
  globalElementCounter++;
  const uniqueSuffix = `${Math.random().toString(36).substring(2, 6)}-${globalElementCounter}`;
  // Ensure child elements never take the reserved 'sc-root' id
  const rawId = node.id || '';
  const elementId = rawId && rawId !== 'sc-root' ? rawId : `el-${tag}-${uniqueSuffix}`;
  const classes = node.getAttribute('class') || node.className || '';

  // Parse inline styles with camelCase conversion for React
  const styleAttr = node.getAttribute('style');
  const styles: Record<string, string> = styleAttr ? parseInlineStyles(styleAttr) : {};

  // Parse standard attributes
  const attributes: Record<string, string> = {};
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    const name = attr.name.toLowerCase();
    if (!['class', 'style', 'id'].includes(name) && !name.startsWith('on')) {
      attributes[name] = attr.value;
    }
  }

  // Extract inline event handlers (e.g. onclick="myFunc()", onkeydown="...", etc.)
  const eventBindings: EventBinding[] = [];
  const eventNames: Array<'click' | 'input' | 'change' | 'submit' | 'keydown' | 'keyup'> = [
    'click',
    'input',
    'change',
    'submit',
    'keydown',
    'keyup',
  ];
  
  eventNames.forEach((ev) => {
    const inlineHandler = node.getAttribute(`on${ev}`);
    if (inlineHandler) {
      // Check if it's a function call like myFunction() or increment()
      const match = inlineHandler.trim().match(/^([a-zA-Z0-9_$]+)\s*\((.*)\)\s*;?$/);
      if (match) {
        const funcName = match[1];
        const args = match[2];
        eventBindings.push({
          id: `eb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventName: ev,
          actionType: 'callFunction',
          targetId: funcName,
          payloadExpr: args.trim() || undefined,
        });

        // Ensure this function exists in functionsList if not already present
        if (!functionsList.some((f) => f.name === funcName)) {
          functionsList.push({
            id: `fn-${Date.now()}-${funcName}`,
            name: funcName,
            params: args ? ['args'] : [],
            code: `// Imported from inline on${ev}="${inlineHandler}"\nconsole.log('Executed ${funcName}');`,
            description: `Event handler for ${ev}`,
          });
        }
      } else {
        // Generic code handler
        const generatedFuncName = `handle_${elementId.replace(/[^a-zA-Z0-9_]/g, '_')}_${ev}`;
        eventBindings.push({
          id: `eb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventName: ev,
          actionType: 'callFunction',
          targetId: generatedFuncName,
        });
        functionsList.push({
          id: `fn-${Date.now()}-${generatedFuncName}`,
          name: generatedFuncName,
          params: ['event'],
          code: `// Imported from on${ev} attribute\n${inlineHandler}`,
          description: `Auto-generated handler for ${elementId}`,
        });
      }
    }
  });

  // Check if node has any child elements
  const hasElementChildren = Array.from(node.childNodes).some(
    (c) => c.nodeType === Node.ELEMENT_NODE && !['script', 'style'].includes((c as Element).tagName.toLowerCase())
  );

  const children: VisualElement[] = [];
  let directTextContent = '';

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = domNodeToVisualElement(child as Element, i, functionsList);
      if (childEl) {
        children.push(childEl);
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        if (hasElementChildren) {
          // If there are other element siblings, preserve this text as a span so it is never lost
          globalElementCounter++;
          children.push({
            id: `txt-${uniqueSuffix}-${i}`,
            tag: 'span',
            name: text.length > 20 ? `${text.slice(0, 18)}...` : text,
            classes: '',
            styles: {},
            attributes: {},
            content: text,
            children: [],
            bindings: {},
          });
        } else {
          directTextContent += (directTextContent ? ' ' : '') + text;
        }
      }
    }
  }

  // Name calculation
  const friendlyName =
    node.getAttribute('aria-label') ||
    node.getAttribute('title') ||
    node.getAttribute('name') ||
    (node.id ? `#${node.id}` : `<${tag}> element`);

  return {
    id: elementId,
    tag,
    name: friendlyName,
    classes,
    styles,
    attributes,
    content: directTextContent,
    children,
    bindings: {
      eventBindings: eventBindings.length > 0 ? eventBindings : undefined,
    },
  };
}

/**
 * Parse an HTML string into an element tree and extract embedded styles and scripts
 */
export function parseHtmlDocument(
  htmlString: string,
  existingFunctions: ProjectFunction[] = []
): ParsedHtmlResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Extract <title> if present
  const extractedTitle = doc.querySelector('title')?.textContent?.trim() || undefined;

  // Extract external <link rel="stylesheet"> links and <style> contents
  let extractedCSS = '';
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.includes('tailwindcss')) {
      extractedCSS += `@import url('${href}');\n`;
    }
  });

  const styleElements = doc.querySelectorAll('style');
  styleElements.forEach((s) => {
    extractedCSS += (s.textContent || '') + '\n';
  });

  // Resilient regex fallback for any <style> tags (e.g. placed after </html> or in unusual positions)
  const rawStyleRegex = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi;
  let rawStyleMatch;
  while ((rawStyleMatch = rawStyleRegex.exec(htmlString)) !== null) {
    const rawCss = rawStyleMatch[1].trim();
    if (rawCss && !extractedCSS.includes(rawCss)) {
      extractedCSS += (extractedCSS ? '\n\n' : '') + rawCss;
    }
  }

  // Extract <script> contents and external script CDN URLs
  const externalScripts: string[] = [];
  const extractedScripts: string[] = [];
  const scriptElements = doc.querySelectorAll('script');
  scriptElements.forEach((s) => {
    const src = s.getAttribute('src');
    if (src) {
      if (!src.includes('tailwindcss')) {
        externalScripts.push(src);
      }
    } else if (s.textContent && s.textContent.trim()) {
      const trimmed = s.textContent.trim();
      // Skip importmaps from script list
      if (!trimmed.startsWith('{') || !trimmed.includes('"imports"')) {
        extractedScripts.push(trimmed);
      }
    }
  });

  // Resilient regex fallback for any <script> tags
  const rawScriptRegex = /<script(?:\s+(?!src)[^>]*)?>([\s\S]*?)<\/script>/gi;
  let rawScriptMatch;
  while ((rawScriptMatch = rawScriptRegex.exec(htmlString)) !== null) {
    const rawJs = rawScriptMatch[1].trim();
    if (rawJs && !rawJs.startsWith('{') && !extractedScripts.includes(rawJs)) {
      extractedScripts.push(rawJs);
    }
  }

  // Target body
  const body = doc.body;
  let targetContainer: Element | null = body;
  let rawBodyClasses = body?.getAttribute('class') || body?.className || '';
  let bodyStyles = body?.getAttribute('style') ? parseInlineStyles(body.getAttribute('style')!) : {};

  // If the body only has one child element and it has id 'sc-root' (e.g. from an exported project or live sync),
  // unwrap it cleanly so we never create duplicate nested sc-root containers!
  if (body && body.children.length === 1) {
    const singleChild = body.children[0];
    const childId = singleChild.getAttribute('id') || singleChild.id;
    if (childId === 'sc-root') {
      targetContainer = singleChild;
      const childClass = singleChild.getAttribute('class') || singleChild.className;
      if (childClass) rawBodyClasses = childClass;
      const childStyle = singleChild.getAttribute('style');
      if (childStyle) {
        bodyStyles = { ...bodyStyles, ...parseInlineStyles(childStyle) };
      }
    }
  }

  const importedChildren: VisualElement[] = [];

  if (targetContainer && targetContainer.children.length > 0) {
    for (let i = 0; i < targetContainer.children.length; i++) {
      const parsed = domNodeToVisualElement(targetContainer.children[i], i, existingFunctions);
      if (parsed) {
        // Prevent duplicate id="sc-root" on any child
        if (parsed.id === 'sc-root') {
          parsed.id = `el-${parsed.tag}-${Math.random().toString(36).substring(2, 7)}`;
        }
        importedChildren.push(parsed);
      }
    }
  } else if (targetContainer && targetContainer.textContent && targetContainer.textContent.trim()) {
    importedChildren.push({
      id: `el-content-${Date.now()}`,
      tag: 'p',
      name: 'Imported Text',
      classes: 'text-slate-200 text-sm leading-relaxed',
      styles: {},
      attributes: {},
      content: targetContainer.textContent.trim(),
      children: [],
      bindings: {},
    });
  }

  // Check if raw HTML had an explicit <header> outside body that DOMParser might have missed
  const rawHeaderMatch = htmlString.match(/<header(?:\s+[^>]*)?>([\s\S]*?)<\/header>/i);
  if (rawHeaderMatch && !importedChildren.some((c) => c.tag === 'header')) {
    const tempDiv = doc.createElement('div');
    tempDiv.innerHTML = rawHeaderMatch[0];
    if (tempDiv.firstElementChild) {
      const headerEl = domNodeToVisualElement(tempDiv.firstElementChild, 0, existingFunctions);
      if (headerEl) {
        importedChildren.unshift(headerEl);
      }
    }
  }

  // If the imported structure is an All-In-One (AIO) HTML shell with empty <header> or <body> tags
  // ensure the visual workspace has clean, interactive default containers
  const isAioHtml =
    htmlString.toLowerCase().includes('<html') ||
    htmlString.toLowerCase().includes('<header') ||
    htmlString.toLowerCase().includes('<body');

  if (importedChildren.length === 0 && isAioHtml) {
    const defaultTitle = extractedTitle || 'All-In-One Application';
    importedChildren.push({
      id: `el-header-${Date.now()}`,
      tag: 'header',
      name: 'Application Header',
      classes: 'w-full py-4 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between',
      styles: {},
      attributes: {},
      content: '',
      children: [
        {
          id: `el-h1-${Date.now() + 1}`,
          tag: 'h1',
          name: 'Header Title',
          classes: 'text-lg font-bold text-white tracking-tight',
          styles: {},
          attributes: {},
          content: defaultTitle,
          children: [],
          bindings: {},
        },
      ],
      bindings: {},
    });

    importedChildren.push({
      id: `el-main-${Date.now() + 2}`,
      tag: 'main',
      name: 'Application Body',
      classes: 'w-full flex-1 p-6 min-h-[260px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-slate-400 text-sm space-y-2',
      styles: {},
      attributes: {},
      content: '',
      children: [
        {
          id: `el-p-${Date.now() + 3}`,
          tag: 'p',
          name: 'Body Placeholder',
          classes: 'text-sm text-slate-400 text-center',
          styles: {},
          attributes: {},
          content: 'Application Body Ready (Drag elements here or add logic & styling)',
          children: [],
          bindings: {},
        },
      ],
      bindings: {},
    });
  }

  // Ensure any empty <header> container has clean interactive layout styling
  const headerElement = importedChildren.find((c) => c.tag === 'header');
  if (headerElement && (!headerElement.classes || !headerElement.classes.trim())) {
    headerElement.classes = 'w-full py-4 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between';
    if (!headerElement.children || headerElement.children.length === 0) {
      headerElement.children = [
        {
          id: `el-h1-${Date.now()}`,
          tag: 'h1',
          name: 'Header Title',
          classes: 'text-base font-bold text-white tracking-tight',
          styles: {},
          attributes: {},
          content: extractedTitle || 'Application Header',
          children: [],
          bindings: {},
        },
      ];
    }
  }

  const bodyClasses = rawBodyClasses.trim() ? rawBodyClasses.trim() : 'min-h-full w-full p-6 text-slate-100';

  // Always wrap imported children inside a stable canvas root container ('sc-root')
  // This allows deleting, moving, and dragging any and all imported child elements safely!
  const rootElement: VisualElement = normalizeProjectTree({
    id: 'sc-root',
    tag: 'div',
    name: 'Canvas Root',
    classes: bodyClasses,
    styles: bodyStyles,
    attributes: {},
    content: '',
    children: importedChildren,
    bindings: {},
  });

  return {
    rootElement,
    extractedCSS,
    extractedScripts,
    externalScripts,
    extractedTitle,
  };
}

/**
 * Parse JavaScript code to identify ES module imports, functions, ES6 classes, and state variables
 */
export function parseJavaScriptCode(jsCode: string): {
  functions: ProjectFunction[];
  classes: ProjectClass[];
  variables: StateVariable[];
  workers: ProjectWorker[];
  imports: string[];
  unparsedCode: string;
} {
  const functions: ProjectFunction[] = [];
  const classes: ProjectClass[] = [];
  const variables: StateVariable[] = [];
  const workers: ProjectWorker[] = [];
  const imports: string[] = [];

  if (!jsCode || !jsCode.trim()) {
    return { functions, classes, variables, workers, imports, unparsedCode: '' };
  }

  // 0. Extract ES6 Module import statements:
  // e.g. import confetti from 'canvas-confetti';
  //      import { format, parse } from 'date-fns';
  //      import * as THREE from 'three';
  //      import './styles.css';
  const importRegex = /(?:^|\n)\s*(import\s+(?:(?:(?:\*\s+as\s+[a-zA-Z0-9_$]+|[a-zA-Z0-9_$]+|(?:\s*\{[\s\S]*?\}\s*))\s*,?\s*)*from\s+)?['"][^'"]+['"];?)/g;
  let importMatch;
  while ((importMatch = importRegex.exec(jsCode)) !== null) {
    const rawImport = importMatch[1].trim();
    if (rawImport && !imports.includes(rawImport)) {
      imports.push(rawImport);
    }
  }

  // Sanitize imports out of executable JS so they do not cause SyntaxError inside function blocks
  let cleanJs = jsCode;
  imports.forEach((imp) => {
    cleanJs = cleanJs.replace(imp, '');
  });

  // 1. Detect Class declarations: class MyClass { ... }
  const classRegex = /class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+[A-Za-z0-9_$]+)?\s*\{([\s\S]*?)\n\}/g;
  let classMatch;
  let sanitizedJs = cleanJs;

  while ((classMatch = classRegex.exec(cleanJs)) !== null) {
    const className = classMatch[1];
    const classBody = classMatch[2];
    const instanceName = className.charAt(0).toLowerCase() + className.slice(1);

    // Parse methods inside classBody
    const methods: ProjectClass['methods'] = [];
    const properties: ProjectClass['properties'] = [];
    let constructorParams: string[] = [];
    let constructorCode = '';

    // Search for constructor
    const ctorMatch = classBody.match(/constructor\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/);
    if (ctorMatch) {
      constructorParams = ctorMatch[1]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      constructorCode = ctorMatch[2].trim();
    }

    // Search for methods
    const methodRegex = /([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
    let methodMatch;
    while ((methodMatch = methodRegex.exec(classBody)) !== null) {
      const methodName = methodMatch[1];
      if (methodName !== 'constructor') {
        methods.push({
          id: `mth-${Date.now()}-${methodName}`,
          name: methodName,
          params: methodMatch[2]
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
          code: methodMatch[3].trim(),
          description: `Method ${methodName} on ${className}`,
        });
      }
    }

    classes.push({
      id: `cls-${Date.now()}-${className}`,
      name: className,
      instanceName,
      constructorParams,
      constructorCode,
      properties,
      methods,
      description: `Imported ES6 Class ${className}`,
    });
  }

  // 2. Detect standard functions: function funcName(params) { body }
  const funcRegex = /function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
  let funcMatch;
  while ((funcMatch = funcRegex.exec(cleanJs)) !== null) {
    const funcName = funcMatch[1];
    const params = funcMatch[2]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const code = funcMatch[3].trim();

    if (!functions.some((f) => f.name === funcName)) {
      functions.push({
        id: `fn-${Date.now()}-${funcName}`,
        name: funcName,
        params,
        code,
        description: `Imported JavaScript function ${funcName}`,
      });
    }
  }

  // 3. Detect arrow / const functions: const funcName = (params) => { body }
  const arrowRegex = /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:\(([^)]*)\)|([A-Za-z0-9_$]+))\s*=>\s*\{([\s\S]*?)\}/g;
  let arrowMatch;
  while ((arrowMatch = arrowRegex.exec(cleanJs)) !== null) {
    const funcName = arrowMatch[1];
    const rawParams = arrowMatch[2] || arrowMatch[3] || '';
    const params = rawParams
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const code = arrowMatch[4].trim();

    if (!functions.some((f) => f.name === funcName)) {
      functions.push({
        id: `fn-${Date.now()}-${funcName}`,
        name: funcName,
        params,
        code,
        description: `Imported Arrow function ${funcName}`,
      });
    }
  }

  // 4. Detect state variables: let/var/const variableName = primitive;
  const varRegex = /(?:let|var|const)\s+([a-zA-Z0-9_$]+)\s*=\s*([^;]+);/g;
  let varMatch;
  while ((varMatch = varRegex.exec(cleanJs)) !== null) {
    const name = varMatch[1];
    const rawVal = varMatch[2].trim();

    // Skip if it was already identified as a function or class
    if (functions.some((f) => f.name === name) || classes.some((c) => c.name === name || c.instanceName === name)) {
      continue;
    }

    let parsedVal: any = rawVal;
    let type: StateVariable['type'] = 'string';

    if (rawVal === 'true' || rawVal === 'false') {
      parsedVal = rawVal === 'true';
      type = 'boolean';
    } else if (!isNaN(Number(rawVal))) {
      parsedVal = Number(rawVal);
      type = 'number';
    } else if (rawVal.startsWith('{') && rawVal.endsWith('}')) {
      try {
        parsedVal = JSON.parse(rawVal);
        type = 'object';
      } catch {
        type = 'object';
      }
    } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      try {
        parsedVal = JSON.parse(rawVal);
        type = 'array';
      } catch {
        type = 'array';
      }
    } else if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
      parsedVal = rawVal.slice(1, -1);
      type = 'string';
    }

    if (!variables.some((v) => v.name === name)) {
      variables.push({
        id: `v-${Date.now()}-${name}`,
        name,
        type,
        value: parsedVal,
        defaultValue: parsedVal,
        description: `Imported state variable ${name}`,
      });
    }
  }

  // If no functions were extracted but there is executable JS, wrap into an initApp function
  const remainingCode = cleanJs.trim();
  if (functions.length === 0 && classes.length === 0 && remainingCode.length > 0) {
    functions.push({
      id: `fn-${Date.now()}-initImportedScript`,
      name: 'initImportedScript',
      params: [],
      code: remainingCode,
      description: 'Imported top-level JavaScript executable script',
    });
  }

  return {
    functions,
    classes,
    variables,
    workers,
    imports,
    unparsedCode: cleanJs,
  };
}

function connectSmartBindings(root: VisualElement, functions: ProjectFunction[], jsCode: string) {
  const explicitBindings = new Map<string, { event: string; func: string }>();
  const listenerRegex = /(?:document\.)?(?:getElementById\(['"]([^'"]+)['"]\)|querySelector\(['"]#([^'"]+)['"]\))\.(?:addEventListener\(['"]([a-z]+)['"],\s*([a-zA-Z0-9_$]+)|on([a-z]+)\s*=\s*([a-zA-Z0-9_$]+))/g;
  let match;
  while ((match = listenerRegex.exec(jsCode)) !== null) {
    const elId = match[1] || match[2];
    const event = match[3] || match[5];
    const func = match[4] || match[6];
    if (elId && event && func) {
      explicitBindings.set(elId, { event, func });
    }
  }

  function traverse(el: VisualElement) {
    if (el.id && explicitBindings.has(el.id)) {
      const { event, func } = explicitBindings.get(el.id)!;
      if (!el.bindings) el.bindings = {};
      if (!el.bindings.eventBindings) el.bindings.eventBindings = [];
      if (!el.bindings.eventBindings.some((b) => b.eventName === event && b.targetId === func)) {
        el.bindings.eventBindings.push({
          id: `eb-smart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          eventName: event as any,
          actionType: 'callFunction',
          targetId: func,
        });
      }
    }

    if (el.tag === 'button' && (!el.bindings?.eventBindings || el.bindings.eventBindings.length === 0)) {
      const cleanId = (el.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanName = (el.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanContent = (el.content || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const fn of functions) {
        const cleanFn = fn.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
          (cleanId && (cleanId.includes(cleanFn) || cleanFn.includes(cleanId))) ||
          (cleanContent && cleanContent.includes(cleanFn)) ||
          (cleanName && cleanName.includes(cleanFn))
        ) {
          if (!el.bindings) el.bindings = {};
          if (!el.bindings.eventBindings) el.bindings.eventBindings = [];
          el.bindings.eventBindings.push({
            id: `eb-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            eventName: 'click',
            actionType: 'callFunction',
            targetId: fn.name,
          });
          break;
        }
      }
    }

    if (el.children) {
      el.children.forEach(traverse);
    }
  }

  traverse(root);
}

/**
 * Import a full client-side project from separate HTML, CSS, and JS strings
 */
export function importProjectFromCode(
  projectName: string,
  html: string,
  css: string,
  js: string,
  workerJs = ''
): ProjectData {
  const initialFunctions: ProjectFunction[] = [];
  const effectiveHtml = html && html.trim()
    ? html.trim()
    : `<div class="max-w-4xl mx-auto p-6 space-y-4">
  <div class="border-b border-slate-800 pb-4">
    <h1 class="text-2xl font-bold text-white">${projectName || 'Imported Application'}</h1>
    <p class="text-xs text-slate-400 mt-1">Application workspace and interactive view</p>
  </div>
  <div id="app" class="p-6 bg-slate-900 border border-slate-800 rounded-xl min-h-[220px] flex items-center justify-center text-slate-400 text-sm">
    Ready for interaction
  </div>
</div>`;

  const htmlResult = parseHtmlDocument(effectiveHtml, initialFunctions);

  // Combine custom CSS from <style> and external CSS
  const combinedCSS = [css.trim(), htmlResult.extractedCSS.trim()]
    .filter(Boolean)
    .join('\n\n');

  // Combine JS from script files and embedded <script>
  const allJsCode = [js.trim(), ...htmlResult.extractedScripts].filter(Boolean).join('\n\n');
  const jsResult = parseJavaScriptCode(allJsCode);

  // Merge any functions collected during HTML event parsing
  initialFunctions.forEach((fn) => {
    if (!jsResult.functions.some((f) => f.name === fn.name)) {
      jsResult.functions.push(fn);
    }
  });

  // Connect explicit and smart event bindings to HTML elements
  connectSmartBindings(htmlResult.rootElement, jsResult.functions, allJsCode);

  // Handle worker thread if present
  const workers: ProjectWorker[] = [];
  if (workerJs && workerJs.trim()) {
    workers.push({
      id: `w-${Date.now()}`,
      name: 'BackgroundWorker',
      instanceName: 'backgroundWorker',
      scriptCode: workerJs.trim(),
      onMessageCode: `// Worker response handler\nconsole.log('Worker responded:', event.data);\nif (event.data.status) {\n  state.status = event.data.status;\n}`,
      description: 'Imported Web Worker background thread',
    });
  }

  // If no variables were found, create a starter status variable
  const variables = jsResult.variables.length > 0 ? jsResult.variables : [
    {
      id: `v-${Date.now()}-status`,
      name: 'status',
      type: 'string' as const,
      value: 'Ready',
      defaultValue: 'Ready',
      description: 'Application status',
    },
  ];

  return {
    id: `project-${Date.now()}`,
    name: projectName || 'Imported Client Project',
    description: 'Imported client-side HTML, CSS & JavaScript application',
    rootElement: htmlResult.rootElement,
    customCSS: combinedCSS,
    imports: jsResult.imports || [],
    externalScripts: htmlResult.externalScripts || [],
    variables,
    functions: jsResult.functions,
    classes: jsResult.classes,
    workers: [...jsResult.workers, ...workers],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Parse an uploaded ZIP archive containing HTML, CSS, JS, or project.json
 */
export async function importProjectFromZip(file: File | Blob): Promise<ProjectData> {
  const zip = await JSZip.loadAsync(file);

  // 1. Check for any exported project.json file (even in nested subdirectories)
  for (const [filename, entry] of Object.entries(zip.files)) {
    if (!entry.dir && filename.toLowerCase().endsWith('project.json')) {
      const text = await entry.async('text');
      try {
        const parsed = JSON.parse(text);
        if (parsed.rootElement) {
          return {
            ...parsed,
            rootElement: normalizeProjectTree(parsed.rootElement),
          } as ProjectData;
        }
      } catch (e) {
        // Continue searching
      }
    }
  }

  // 2. Locate HTML, CSS, JS files
  let htmlContent = '';
  let cssContent = '';
  let jsContent = '';
  let workerContent = '';
  let detectedName = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'Imported Project';

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    const lowerName = filename.toLowerCase();

    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
      // Prefer index.html if available
      if (!htmlContent || lowerName.includes('index')) {
        htmlContent = await zipEntry.async('text');
      }
    } else if (lowerName.endsWith('.css')) {
      const cssText = await zipEntry.async('text');
      cssContent += (cssContent ? '\n\n' : '') + cssText;
    } else if (lowerName.includes('worker') && lowerName.endsWith('.js')) {
      workerContent = await zipEntry.async('text');
    } else if (lowerName.endsWith('.js') && !lowerName.endsWith('.min.js')) {
      const jsText = await zipEntry.async('text');
      jsContent += (jsContent ? '\n\n' : '') + jsText;
    }
  }

  if (!htmlContent) {
    if (jsContent || cssContent) {
      // Synthesize clean host container for the uploaded JS & CSS logic
      htmlContent = `<div class="max-w-4xl mx-auto p-6 space-y-4">
  <div class="border-b border-slate-800 pb-4">
    <h1 class="text-2xl font-bold text-white">${detectedName}</h1>
    <p class="text-xs text-slate-400 mt-1">Imported application logic & styles</p>
  </div>
  <div id="app" class="p-6 bg-slate-900 border border-slate-800 rounded-xl min-h-[220px] flex items-center justify-center text-slate-400 text-sm">
    Application Container (#app)
  </div>
</div>`;
    } else {
      throw new Error('No HTML, JavaScript, or CSS files found in the ZIP archive.');
    }
  }

  return importProjectFromCode(detectedName, htmlContent, cssContent, jsContent, workerContent);
}

/**
 * Starter client-side import presets to test or start with
 */
export interface ImportPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  html: string;
  css: string;
  js: string;
  worker?: string;
}

export const CLIENT_IMPORT_PRESETS: ImportPreset[] = [
  {
    id: 'aio-html-app',
    name: 'All-In-One (AIO) HTML App',
    description: 'Complete formatted single-file HTML app with integrated <header>, <body>, <script>, and <style>',
    category: 'All-In-One (AIO)',
    html: `<!DOCTYPE html>
<html>
  <header class="w-full py-4 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30">AIO</div>
      <div>
        <h1 class="text-base font-bold text-white tracking-tight">All-In-One Application</h1>
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
</html>`,
    css: `/* All-In-One Custom CSS */
#counter-badge {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
#counter-badge:hover {
  transform: scale(1.05);
}
.custom-gradient {
  background: linear-gradient(135deg, #1e1e2e 0%, #11111b 100%);
}`,
    js: `let counter = 0;

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
}`,
  },
  {
    id: 'kanban-todo',
    name: 'Interactive Task & Kanban Board',
    description: 'Complete task manager with column status, filter badges, and local persistence',
    category: 'Application',
    html: `<div class="max-w-4xl mx-auto p-6 space-y-6">
  <div class="flex items-center justify-between border-b border-slate-700 pb-4">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-tight">Project Task Board</h1>
      <p class="text-xs text-slate-400 mt-1">Real-time task tracking with reactive state</p>
    </div>
    <span id="task-count-badge" class="px-3 py-1 bg-indigo-600/30 border border-indigo-500/50 rounded-full text-xs font-semibold text-indigo-300">
      Tasks: <span id="total-tasks">3</span>
    </span>
  </div>

  <div class="flex gap-3">
    <input id="new-task-input" type="text" placeholder="Enter a new task title..." onkeydown="if(event.key==='Enter') addTask()" class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
    <button id="btn-add-task" onclick="addTask()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer">
      + Add Task
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
      <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">To Do (1)</h3>
      <div id="todo-list" class="space-y-2">
        <div class="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
          Refactor UI component bindings
        </div>
      </div>
    </div>

    <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
      <h3 class="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">In Progress (1)</h3>
      <div id="progress-list" class="space-y-2">
        <div class="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
          Implement multi-threaded Web Worker
        </div>
      </div>
    </div>

    <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
      <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Done (1)</h3>
      <div id="done-list" class="space-y-2">
        <div class="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 line-through opacity-70">
          Initial project architecture
        </div>
      </div>
    </div>
  </div>
</div>`,
    css: `/* Custom task card styling */
.task-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}`,
    js: `let totalTasks = 3;
let taskTitle = "";

function addTask() {
  const input = document.getElementById('new-task-input');
  if (!input || !input.value.trim()) return;
  
  const text = input.value.trim();
  const todoContainer = document.getElementById('todo-list');
  if (todoContainer) {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 animate-fadeIn';
    item.textContent = text;
    todoContainer.prepend(item);
  }
  
  state.totalTasks = (Number(state.totalTasks) || 3) + 1;
  input.value = '';
  console.log('Added task:', text);
}

function clearCompleted() {
  const doneContainer = document.getElementById('done-list');
  if (doneContainer) {
    doneContainer.innerHTML = '';
  }
}`,
  },
  {
    id: 'worker-crypt',
    name: 'Multi-Threaded Hash & Prime Benchmarker',
    description: 'Offloads heavy cryptographic and mathematical calculations to a background Web Worker',
    category: 'High Performance',
    html: `<div class="max-w-2xl mx-auto p-6 space-y-6">
  <div class="text-center space-y-2">
    <h1 class="text-3xl font-extrabold text-white tracking-tight">Background Worker Sieve</h1>
    <p class="text-xs text-slate-400">Calculates millions of primes on a dedicated thread without freezing the UI</p>
  </div>

  <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4">
    <div class="flex items-center justify-between">
      <span class="text-xs text-slate-300 font-medium">Calculation Limit:</span>
      <span id="limit-badge" class="font-mono text-sm font-bold text-indigo-400">5,000,000</span>
    </div>

    <div class="flex gap-3">
      <button id="btn-start-worker" onclick="runWorker()" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-lg shadow-indigo-600/30">
        ⚡ Launch Worker Thread
      </button>
      <button id="btn-ping-ui" onclick="testUIFluidity()" class="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer">
        Ping UI (Test Fluidity)
      </button>
    </div>

    <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
      <div class="flex justify-between text-slate-400">
        <span>Worker Thread Status:</span>
        <span id="thread-status" class="text-emerald-400 font-bold">Idle</span>
      </div>
      <div class="flex justify-between text-slate-400">
        <span>Primes Discovered:</span>
        <span id="primes-count" class="text-white font-bold">0</span>
      </div>
      <div class="flex justify-between text-slate-400">
        <span>Execution Time:</span>
        <span id="elapsed-time" class="text-cyan-400 font-bold">0 ms</span>
      </div>
    </div>
  </div>
</div>`,
    css: `@keyframes pulseGlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`,
    js: `let status = "Idle";
let primesFound = 0;
let executionTime = 0;

function runWorker() {
  state.status = "Calculating in background thread...";
  if (workers.computeWorker) {
    workers.computeWorker.postMessage({ command: 'start', limit: 5000000 });
  }
}

function testUIFluidity() {
  console.log('UI thread is completely non-blocked!');
  alert('UI is 100% smooth and responsive during worker computation!');
}`,
    worker: `self.onmessage = function(e) {
  const { command, limit = 5000000 } = e.data;
  if (command === 'start') {
    const startTime = performance.now();
    
    // Sieve of Eratosthenes
    const sieve = new Uint8Array(limit);
    let count = 0;
    for (let i = 2; i < limit; i++) {
      if (!sieve[i]) {
        count++;
        for (let j = i * 2; j < limit; j += i) {
          sieve[j] = 1;
        }
      }
    }
    
    const elapsed = Math.round(performance.now() - startTime);
    self.postMessage({
      status: 'Completed',
      primes: count,
      durationMs: elapsed
    });
  }
};`,
  },
  {
    id: 'canvas-particles',
    name: 'Interactive Canvas Particle Matrix',
    description: 'HTML5 2D Canvas rendering animated interactive particles with cursor repulsion',
    category: 'Creative & Graphics',
    html: `<div class="w-full max-w-4xl mx-auto p-6 space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-white">Particle Physics Canvas</h1>
      <p class="text-xs text-slate-400">Move your mouse to interact with the particle nodes</p>
    </div>
    <button id="btn-reseed" onclick="initCanvas()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer">
      Reset Particles
    </button>
  </div>
  
  <div class="relative w-full h-[450px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
    <canvas id="particle-canvas" class="w-full h-full block"></canvas>
  </div>
</div>`,
    css: `canvas {
  touch-action: none;
}`,
    js: `class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 60;
    this.mouse = { x: -1000, y: -1000 };
    this.init();
  }

  init() {
    this.resize();
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 1.5
      });
    }
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 450;
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw links
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#818cf8';
      this.ctx.fill();
    }
    requestAnimationFrame(() => this.animate());
  }
}

function initCanvas() {
  const sys = new ParticleSystem('particle-canvas');
  console.log('Particle system initialized');
}`,
  },
];
