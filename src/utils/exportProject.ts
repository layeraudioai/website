import JSZip from 'jszip';
import { ProjectData } from '../types/logic';
import {
  generateHtmlFile,
  generateCssFile,
  generateWorkerFile,
  generateAppJsFile,
  generateStandaloneHtmlFile,
  generateAioHtmlFile,
} from './codeGenerator';

export async function downloadProjectZip(project: ProjectData): Promise<void> {
  const zip = new JSZip();

  const html = generateHtmlFile(project);
  const css = generateCssFile(project);
  const appJs = generateAppJsFile(project, false);
  const workerJs = generateWorkerFile(project);
  const standaloneHtml = generateStandaloneHtmlFile(project);

  // Readme file
  const readme = `# ${project.name}

${project.description || 'Exported standalone web application.'}

## Project Structure
- \`index.html\` - The structured HTML markup and layout
- \`style.css\` - Custom styling rules
- \`app.js\` - Reactive state, DOM bindings, classes, and logic controllers
- \`worker.js\` - Dedicated Web Worker background thread
- \`standalone.html\` - Complete all-in-one single file that runs in any browser offline without a web server

## How to Run
1. Open \`standalone.html\` directly in any modern web browser (Chrome, Firefox, Safari, Edge).
2. Or serve the folder using any static server (e.g. \`npx serve\` or Python \`python -m http.server\`) to open \`index.html\`.
`;

  zip.file('index.html', html);
  zip.file('style.css', css);
  zip.file('app.js', appJs);
  if (project.workers && project.workers.length > 0) {
    zip.file('worker.js', workerJs);
  }
  zip.file('standalone.html', standaloneHtml);
  zip.file('README.md', readme);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'project';
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadStandaloneHtml(project: ProjectData): void {
  const html = generateStandaloneHtmlFile(project);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'project';
  a.download = `${safeName}.standalone.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAioHtml(project: ProjectData): void {
  const html = generateAioHtmlFile(project);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'project';
  a.download = `${safeName}.aio.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openPreviewInNewWindow(project: ProjectData): void {
  const html = generateStandaloneHtmlFile(project);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
