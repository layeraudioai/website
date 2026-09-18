export type ElementTag =
  | 'div'
  | 'section'
  | 'header'
  | 'main'
  | 'footer'
  | 'button'
  | 'input'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'badge'
  | 'card'
  | 'img'
  | 'form'
  | 'table'
  | 'thead'
  | 'tbody'
  | 'tfoot'
  | 'tr'
  | 'th'
  | 'td'
  | 'ul'
  | 'ol'
  | 'li'
  | 'label'
  | 'textarea'
  | 'progress'
  | 'canvas'
  | 'a'
  | 'nav'
  | 'article'
  | 'aside'
  | 'select'
  | 'option'
  | 'code'
  | 'pre'
  | 'blockquote'
  | 'hr'
  | 'br'
  | 'svg'
  | 'path'
  | (string & {});

export type LogicSourceType =
  | 'variable'
  | 'function'
  | 'classProperty'
  | 'classMethod'
  | 'workerOutput'
  | 'workerStatus';

export interface TextBinding {
  sourceType: LogicSourceType;
  targetId: string; // variable name, classInstance.prop, or func()
  format?: 'raw' | 'json' | 'uppercase' | 'currency' | 'number';
}

export interface AttributeBinding {
  id: string;
  attributeName: string; // e.g. 'value', 'disabled', 'src', 'checked', 'placeholder', 'style.backgroundColor', 'style.width'
  sourceType: LogicSourceType;
  targetId: string;
}

export type EventActionType =
  | 'setVariable'
  | 'callFunction'
  | 'invokeClassMethod'
  | 'postWorkerMessage'
  | 'toggleVariable'
  | 'incrementVariable';

export interface EventBinding {
  id: string;
  eventName: 'click' | 'input' | 'change' | 'submit' | 'mouseenter' | 'mouseleave' | 'keydown' | 'keyup';
  actionType: EventActionType;
  targetId: string; // function name, variable name, class method, or worker name
  payloadExpr?: string; // e.g. "$event.target.value", "1", "'active'", or custom argument
}

export interface VisualElement {
  id: string;
  tag: ElementTag;
  name: string;
  classes: string;
  styles: Record<string, string>;
  attributes: Record<string, string>;
  content: string;
  children: VisualElement[];
  bindings: {
    textBinding?: TextBinding;
    attributeBindings?: AttributeBinding[];
    eventBindings?: EventBinding[];
  };
}

export type EditorMode = 'canvas' | 'dataflow' | 'preview' | 'code';
export type ViewportSize = 'desktop' | 'tablet' | 'mobile';
