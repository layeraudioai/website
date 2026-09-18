/**
 * All-In-One (AIO) HTML, CSS & JavaScript Code Formatter & Parser
 *
 * Supports formatting and bidirectional decomposition/composition of:
 * <html>
 *   <header></header>
 *   <body></body>
 *   <script></script>
 *   <style></style>
 * </html>
 */

// Void HTML elements that do not require a closing tag
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Cleanly formats HTML markup with consistent 2-space indentation
 */
export function formatHtml(html: string): string {
  if (!html || !html.trim()) return '';

  const clean = html.trim().replace(/\r\n/g, '\n');
  const tokens: string[] = [];
  const regex = /(<!--[\s\S]*?-->|<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>|[^<]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    const text = match[0].trim();
    if (text) {
      tokens.push(text);
    }
  }

  const lines: string[] = [];
  let indentLevel = 0;
  const indentStr = '  ';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Comments or doctype
    if (token.startsWith('<!--') || token.toLowerCase().startsWith('<!doctype')) {
      lines.push(`${indentStr.repeat(indentLevel)}${token}`);
      continue;
    }

    // Closing tag: </tag>
    if (token.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
      lines.push(`${indentStr.repeat(indentLevel)}${token}`);
      continue;
    }

    // Opening or self-closing tag: <tag ...>
    if (token.startsWith('<') && !token.startsWith('</')) {
      const tagMatch = token.match(/^<([a-zA-Z0-9_-]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isSelfClosing = token.endsWith('/>') || VOID_ELEMENTS.has(tagName);

      // Check if next token is text and token after is the matching closing tag
      const nextToken = tokens[i + 1];
      const afterNextToken = tokens[i + 2];
      const isInlineContent =
        nextToken &&
        !nextToken.startsWith('<') &&
        afterNextToken &&
        afterNextToken.toLowerCase() === `</${tagName}>`;

      if (isInlineContent) {
        lines.push(`${indentStr.repeat(indentLevel)}${token}${nextToken}${afterNextToken}`);
        i += 2;
        continue;
      }

      lines.push(`${indentStr.repeat(indentLevel)}${token}`);

      if (!isSelfClosing) {
        indentLevel++;
      }
      continue;
    }

    // Pure text content
    lines.push(`${indentStr.repeat(indentLevel)}${token}`);
  }

  return lines.join('\n');
}

/**
 * Cleanly formats CSS stylesheets with 2-space indentation
 */
export function formatCss(css: string): string {
  if (!css || !css.trim()) return '';

  let code = css
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => `\n${m}\n`)
    .trim();

  // Normalize spaces around braces, colons, and semicolons
  code = code
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/\s*;\s*/g, ';\n')
    .replace(/\s*,\s*/g, ', ');

  const rawLines = code.split('\n');
  const formattedLines: string[] = [];
  let indent = 0;
  const indentStr = '  ';

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('}')) {
      indent = Math.max(0, indent - 1);
    }

    if (line.startsWith('@import')) {
      formattedLines.push(line);
      continue;
    }

    if (line.includes(':') && !line.includes('{') && !line.startsWith('@')) {
      const parts = line.split(':');
      const prop = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      formattedLines.push(`${indentStr.repeat(indent)}${prop}: ${val}`);
    } else {
      formattedLines.push(`${indentStr.repeat(indent)}${line}`);
    }

    if (line.endsWith('{')) {
      indent++;
    }
  }

  return formattedLines.join('\n');
}

/**
 * Cleanly formats JavaScript code with 2-space indentation
 */
export function formatJs(js: string): string {
  if (!js || !js.trim()) return '';

  const clean = js
    .replace(/\r\n/g, '\n')
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*/g, ';\n')
    .trim();

  const rawLines = clean.split('\n');
  const formattedLines: string[] = [];
  let indent = 0;
  const indentStr = '  ';

  for (const raw of rawLines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('}') || line.startsWith(')')) {
      indent = Math.max(0, indent - 1);
    }

    formattedLines.push(`${indentStr.repeat(indent)}${line}`);

    if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
      indent++;
    }
  }

  return formattedLines.join('\n');
}

export interface DecomposedAioResult {
  headerHtml: string;
  bodyHtml: string;
  combinedHtml: string;
  css: string;
  js: string;
  externalScripts: string[];
  externalStyles: string[];
  title: string;
}

/**
 * Decomposes an All-In-One (AIO) HTML string into individual clean components
 */
export function decomposeAioHtml(aioString: string): DecomposedAioResult {
  let cleanInput = aioString.trim();

  // Extract external CSS links
  const externalStyles: string[] = [];
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(cleanInput)) !== null) {
    const href = linkMatch[1];
    if (href && !href.includes('tailwindcss')) {
      externalStyles.push(href);
    }
  }

  // Extract external <script src="...">
  const externalScripts: string[] = [];
  const scriptSrcRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
  let scriptSrcMatch;
  while ((scriptSrcMatch = scriptSrcRegex.exec(cleanInput)) !== null) {
    const src = scriptSrcMatch[1];
    if (src && !src.includes('tailwindcss')) {
      externalScripts.push(src);
    }
  }

  // Extract all <style> contents
  const cssBlocks: string[] = [];
  const styleRegex = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(cleanInput)) !== null) {
    if (styleMatch[1].trim()) {
      cssBlocks.push(styleMatch[1].trim());
    }
  }

  // Extract all <script> inline contents
  const jsBlocks: string[] = [];
  const scriptRegex = /<script(?:\s+(?!src)[^>]*)?>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(cleanInput)) !== null) {
    const content = scriptMatch[1].trim();
    if (content && !content.startsWith('{') /* skip importmap */) {
      jsBlocks.push(content);
    }
  }

  // Extract <title>
  let title = 'Imported Project';
  const titleMatch = cleanInput.match(/<title(?:\s+[^>]*)?>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    title = titleMatch[1].trim();
  }

  // Extract <header>
  let headerHtml = '';
  const headerMatch = cleanInput.match(/<header(?:\s+[^>]*)?>([\s\S]*?)<\/header>/i);
  if (headerMatch) {
    headerHtml = headerMatch[0].trim();
  }

  // Extract <body>
  let bodyHtml = '';
  const bodyMatch = cleanInput.match(/<body(?:\s+[^>]*)?>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyHtml = bodyMatch[1].trim();
    // Remove inline scripts and styles that were already extracted
    bodyHtml = bodyHtml.replace(/<style[\s\S]*?<\/style>/gi, '');
    bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
  } else {
    // If no explicit body, strip style and script tags from the markup
    let stripped = cleanInput
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<!doctype[^>]*>/gi, '')
      .trim();
    bodyHtml = stripped;
  }

  // If header was included inside bodyHtml, don't duplicate it in combinedHtml
  let combinedHtml = '';
  if (headerHtml && !bodyHtml.includes('<header')) {
    combinedHtml = `${formatHtml(headerHtml)}\n${formatHtml(bodyHtml)}`.trim();
  } else {
    combinedHtml = formatHtml(bodyHtml || headerHtml);
  }

  const formattedCss = formatCss(
    [...externalStyles.map((s) => `@import url('${s}');`), ...cssBlocks].join('\n\n')
  );
  const formattedJs = formatJs(jsBlocks.join('\n\n'));

  return {
    headerHtml: formatHtml(headerHtml),
    bodyHtml: formatHtml(bodyHtml),
    combinedHtml,
    css: formattedCss,
    js: formattedJs,
    externalScripts,
    externalStyles,
    title,
  };
}

/**
 * Composes HTML, CSS, and JS into the canonical AIO HTML structure:
 * <html>
 *   <header>
 *     ...
 *   </header>
 *   <body>
 *     ...
 *   </body>
 *   <script>
 *     ...
 *   </script>
 *   <style>
 *     ...
 *   </style>
 * </html>
 */
export function composeAioHtml(options: {
  headerHtml?: string;
  bodyHtml?: string;
  html?: string;
  css?: string;
  js?: string;
  title?: string;
  externalScripts?: string[];
}): string {
  const title = options.title || 'All-In-One Application';
  let headerContent = (options.headerHtml || '').trim();
  let bodyContent = (options.bodyHtml || options.html || '').trim();
  const cssContent = (options.css || '').trim();
  const jsContent = (options.js || '').trim();

  // If body already has <header>, extract it out
  if (!headerContent && bodyContent.includes('<header')) {
    const headerMatch = bodyContent.match(/<header(?:\s+[^>]*)?>([\s\S]*?)<\/header>/i);
    if (headerMatch) {
      headerContent = headerMatch[0].trim();
      bodyContent = bodyContent.replace(headerMatch[0], '').trim();
    }
  }

  // Default header if empty
  if (!headerContent) {
    headerContent = `<header class="w-full py-4 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
  <div class="flex items-center space-x-3">
    <h1 class="text-lg font-bold text-white tracking-tight">${title}</h1>
  </div>
  <nav class="flex items-center space-x-4 text-xs font-medium text-slate-400">
    <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">AIO Ready</span>
  </nav>
</header>`;
  }

  // Default body if empty
  if (!bodyContent) {
    bodyContent = `<main class="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
  <div class="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
    <h2 class="text-xl font-bold text-white">Application Workspace</h2>
    <p class="text-xs text-slate-400 max-w-md mx-auto">
      Ready for interactive components, reactive state variables, and visual design.
    </p>
    <button id="btn-action" onclick="appAction()" class="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer">
      Interactive Action
    </button>
  </div>
</main>`;
  }

  // Indent content for the canonical AIO layout
  const formattedHeader = formatHtml(headerContent)
    .split('\n')
    .map((l) => (l.trim() ? `    ${l}` : ''))
    .join('\n');

  const formattedBody = formatHtml(bodyContent)
    .split('\n')
    .map((l) => (l.trim() ? `    ${l}` : ''))
    .join('\n');

  const formattedJs = formatJs(jsContent || '// All-in-One Client-side Application Logic\nfunction appAction() {\n  console.log("AIO Application Action triggered!");\n}')
    .split('\n')
    .map((l) => (l.trim() ? `    ${l}` : ''))
    .join('\n');

  const formattedCss = formatCss(cssContent || '/* All-in-One Custom Stylesheet */\nbody {\n  margin: 0;\n  font-family: system-ui, -apple-system, sans-serif;\n}')
    .split('\n')
    .map((l) => (l.trim() ? `    ${l}` : ''))
    .join('\n');

  const externalScriptsTags = (options.externalScripts || [])
    .map((src) => `    <script src="${src}"></script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
  <header>
${formattedHeader}
  </header>
  <body>
${formattedBody}
  </body>
  <script>
${externalScriptsTags ? externalScriptsTags + '\n' : ''}${formattedJs}
  </script>
  <style>
${formattedCss}
  </style>
</html>`;
}

/**
 * Formats any All-In-One (AIO) HTML string into the canonical:
 * <html>
 *   <header></header>
 *   <body></body>
 *   <script></script>
 *   <style></style>
 * </html>
 * format.
 */
export function formatAioHtml(rawInput: string): string {
  if (!rawInput || !rawInput.trim()) {
    return composeAioHtml({});
  }

  const decomposed = decomposeAioHtml(rawInput);
  return composeAioHtml({
    headerHtml: decomposed.headerHtml,
    bodyHtml: decomposed.bodyHtml,
    css: decomposed.css,
    js: decomposed.js,
    title: decomposed.title,
    externalScripts: decomposed.externalScripts,
  });
}
