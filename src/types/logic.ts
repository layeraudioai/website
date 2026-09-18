export interface StateVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  defaultValue: any;
  description: string;
}

export interface ProjectFunction {
  id: string;
  name: string;
  params: string[]; // e.g. ['delta'] or ['event', 'payload']
  code: string; // function body
  description: string;
}

export interface ClassMethod {
  id: string;
  name: string;
  params: string[];
  code: string;
  description: string;
}

export interface ClassProperty {
  id?: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  initialValue: any;
}

export interface ProjectClass {
  id: string;
  name: string; // e.g. "PerformanceTracker"
  instanceName: string; // e.g. "tracker"
  constructorParams: string[];
  constructorCode: string;
  properties: ClassProperty[];
  methods: ClassMethod[];
  description: string;
}

export interface ProjectWorker {
  id: string;
  name: string; // e.g. "primeComputeWorker"
  instanceName: string; // e.g. "computeWorker"
  scriptCode: string; // Web worker script inside the thread
  onMessageCode: string; // Handler in main thread when worker posts message back
  description: string;
  autoStart?: boolean;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  rootElement: import('./editor').VisualElement;
  variables: StateVariable[];
  functions: ProjectFunction[];
  classes: ProjectClass[];
  workers: ProjectWorker[];
  customCSS: string;
  imports?: string[];
  externalScripts?: string[];
  createdAt?: number;
  updatedAt?: number;
}
