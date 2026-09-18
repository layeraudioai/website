import { ProjectData } from '../types/logic';
import { generateStandaloneHtmlFile } from './codeGenerator';

export interface ConsoleLogMessage {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'worker-in' | 'worker-out';
  message: string;
  timestamp: string;
  workerName?: string;
  data?: any;
}

export function buildSandboxedHtmlWithTelemetry(
  project: ProjectData,
  instanceSessionId: string
): string {
  const baseHtml = generateStandaloneHtmlFile(project);

  // Inject console interception and Worker telemetry proxy
  const telemetryScript = `
<script>
(function() {
  const sessionId = "${instanceSessionId}";
  function sendLog(type, msg, extra = {}) {
    window.parent.postMessage({
      type: 'EDITOR_SANDBOX_LOG',
      sessionId: sessionId,
      payload: {
        id: Math.random().toString(36).substr(2, 9),
        type: type,
        message: typeof msg === 'object' ? JSON.stringify(msg) : String(msg),
        timestamp: new Date().toLocaleTimeString(),
        ...extra
      }
    }, '*');
  }

  // Intercept console
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;

  console.log = function(...args) {
    origLog.apply(console, args);
    sendLog('log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };
  console.warn = function(...args) {
    origWarn.apply(console, args);
    sendLog('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };
  console.error = function(...args) {
    origError.apply(console, args);
    sendLog('error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };
  console.info = function(...args) {
    origInfo.apply(console, args);
    sendLog('info', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };

  // Intercept Worker to track background thread communication
  const OriginalWorker = window.Worker;
  window.Worker = function(scriptUrl, options) {
    const workerInstance = new OriginalWorker(scriptUrl, options);
    const origPostMessage = workerInstance.postMessage;

    workerInstance.postMessage = function(data, transfer) {
      sendLog('worker-in', 'Main Thread -> Web Worker postMessage()', {
        data: data
      });
      return origPostMessage.apply(workerInstance, arguments);
    };

    workerInstance.addEventListener('message', function(event) {
      sendLog('worker-out', 'Web Worker -> Main Thread onmessage()', {
        data: event.data
      });
    });

    return workerInstance;
  };

  // Helper function to create new UI objects dynamically in realtime via JS
  window.createUIObject = function(tag, options = {}, parentSelector = '#sc-root') {
    const el = document.createElement(tag);
    if (options.id) el.id = options.id;
    if (options.className) el.className = options.className;
    if (options.textContent) el.textContent = options.textContent;
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.style) Object.assign(el.style, options.style);
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([k, v]) => el.setAttribute(k, v));
    }
    const target = (typeof parentSelector === 'string' ? document.querySelector(parentSelector) : parentSelector) || document.getElementById('sc-root') || document.body;
    target.appendChild(el);
    return el;
  };

  // Observe real-time DOM mutations to track objects added via JS
  function initMutationObserver() {
    const root = document.getElementById('sc-root') || document.body;
    if (!root) return;

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          m.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              const tag = node.tagName.toLowerCase();
              const id = node.id ? '#' + node.id : '';
              const parentDesc = node.parentElement ? (node.parentElement.id ? '#' + node.parentElement.id : node.parentElement.tagName.toLowerCase()) : 'body';
              sendLog('info', '[Realtime DOM] Created <' + tag + id + '> in ' + parentDesc);
              window.parent.postMessage({
                type: 'EDITOR_DOM_MUTATION',
                sessionId: sessionId,
                mutation: {
                  action: 'added',
                  tag: tag,
                  id: node.id || '',
                  summary: (node.textContent || '').trim().slice(0, 50),
                  parentId: parentDesc
                }
              }, '*');
            }
          });
        }
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMutationObserver);
  } else {
    initMutationObserver();
  }

  // Handle messages from parent: execute JS or export current live DOM
  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'EXECUTE_JS' && (e.data.sessionId === sessionId || !e.data.sessionId)) {
      try {
        const result = (function() {
          return eval(e.data.code);
        })();
        if (result !== undefined) {
          console.log('[Return]:', result);
        }
      } catch (err) {
        console.error('[Error]:', err.message || String(err));
      }
    } else if (e.data.type === 'REQUEST_DOM_EXPORT' && e.data.sessionId === sessionId) {
      const root = document.getElementById('sc-root') || document.body;
      window.parent.postMessage({
        type: 'EDITOR_DOM_EXPORT_RESPONSE',
        sessionId: sessionId,
        html: root.outerHTML || document.body.innerHTML
      }, '*');
    }
  });
})();
</script>
`;

  return baseHtml.replace('<head>', `<head>\n${telemetryScript}`);
}
