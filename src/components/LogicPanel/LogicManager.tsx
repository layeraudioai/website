import React from 'react';
import { Database, Zap, Box, Cpu } from 'lucide-react';
import { ProjectData } from '../../types/logic';
import { VariableEditor } from './VariableEditor';
import { FunctionEditor } from './FunctionEditor';
import { ClassEditor } from './ClassEditor';
import { WorkerEditor } from './WorkerEditor';

interface LogicManagerProps {
  project: ProjectData;
  onUpdateProject: (updated: Partial<ProjectData>) => void;
}

export const LogicManager: React.FC<LogicManagerProps> = ({
  project,
  onUpdateProject,
}) => {
  const [activeTab, setActiveTab] = React.useState<'variables' | 'functions' | 'classes' | 'workers'>('variables');

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-slate-800 px-4 bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('variables')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'variables'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Value Variables</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {project.variables.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('functions')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'functions'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Functions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {project.functions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'classes'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Classes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {project.classes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'workers'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Threads & Workers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {project.workers.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          All logic entities can be pointed to UI fields & objects
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'variables' && (
          <VariableEditor
            variables={project.variables}
            onUpdateVariables={(vars) => onUpdateProject({ variables: vars })}
          />
        )}

        {activeTab === 'functions' && (
          <FunctionEditor
            functions={project.functions}
            onUpdateFunctions={(funcs) => onUpdateProject({ functions: funcs })}
          />
        )}

        {activeTab === 'classes' && (
          <ClassEditor
            classes={project.classes}
            onUpdateClasses={(cls) => onUpdateProject({ classes: cls })}
          />
        )}

        {activeTab === 'workers' && (
          <WorkerEditor
            workers={project.workers}
            onUpdateWorkers={(wrks) => onUpdateProject({ workers: wrks })}
          />
        )}
      </div>
    </div>
  );
};
