import React from 'react';
import {
  GitFork,
  Database,
  Zap,
  Box,
  Cpu,
  Link,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ProjectData } from '../../types/logic';
import { VisualElement } from '../../types/editor';

interface DataFlowViewProps {
  project: ProjectData;
  onSelectElement: (id: string) => void;
  onOpenLogic: (tab: 'variables' | 'functions' | 'classes' | 'workers') => void;
}

interface Connection {
  sourceElementId: string;
  sourceElementName: string;
  sourceTag: string;
  field: string; // 'Text Content', 'attribute: value', 'event: click'
  targetCategory: 'variable' | 'function' | 'class' | 'worker';
  targetName: string;
  color: string;
}

export const DataFlowView: React.FC<DataFlowViewProps> = ({
  project,
  onSelectElement,
  onOpenLogic,
}) => {
  // Collect all bindings across all elements
  const connections: Connection[] = React.useMemo(() => {
    const list: Connection[] = [];

    function traverse(el: VisualElement) {
      // Text binding
      if (el.bindings?.textBinding) {
        list.push({
          sourceElementId: el.id,
          sourceElementName: el.name,
          sourceTag: el.tag,
          field: 'Text Content',
          targetCategory: 'variable',
          targetName: `state.${el.bindings.textBinding.targetId}`,
          color: 'emerald',
        });
      }

      // Attribute bindings
      if (el.bindings?.attributeBindings) {
        el.bindings.attributeBindings.forEach((ab) => {
          list.push({
            sourceElementId: el.id,
            sourceElementName: el.name,
            sourceTag: el.tag,
            field: `Attribute [${ab.attributeName}]`,
            targetCategory: 'variable',
            targetName: `state.${ab.targetId}`,
            color: 'cyan',
          });
        });
      }

      // Event bindings
      if (el.bindings?.eventBindings) {
        el.bindings.eventBindings.forEach((eb) => {
          let cat: Connection['targetCategory'] = 'function';
          let color = 'amber';
          let name = eb.targetId;

          if (eb.actionType === 'postWorkerMessage') {
            cat = 'worker';
            color = 'cyan';
            name = `workers.${eb.targetId}.postMessage()`;
          } else if (eb.actionType === 'invokeClassMethod') {
            cat = 'class';
            color = 'purple';
            name = `classes.${eb.targetId}()`;
          } else if (eb.actionType === 'setVariable' || eb.actionType === 'incrementVariable' || eb.actionType === 'toggleVariable') {
            cat = 'variable';
            color = 'emerald';
            name = `state.${eb.targetId}`;
          } else {
            name = `${eb.targetId}()`;
          }

          list.push({
            sourceElementId: el.id,
            sourceElementName: el.name,
            sourceTag: el.tag,
            field: `on${eb.eventName}`,
            targetCategory: cat,
            targetName: name,
            color,
          });
        });
      }

      el.children.forEach(traverse);
    }

    traverse(project.rootElement);
    return list;
  }, [project]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none p-6">
      {/* Header Info */}
      <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-400" />
            <span>Logic Wiring & Data Flow Map</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual connections between UI objects/fields and Value Variables, Functions, Classes, and Web Worker threads.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
            {project.variables.length} Variables
          </span>
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
            {project.functions.length} Functions
          </span>
          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-medium">
            {project.classes.length} Classes
          </span>
          <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-medium">
            {project.workers.length} Worker Threads
          </span>
        </div>
      </div>

      {/* Schematic Container */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Active UI Pointing Wires ({connections.length} total)
        </div>

        {connections.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 max-w-lg mx-auto">
            <GitFork className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h3 className="text-white font-semibold text-sm mb-1">No Active Wires</h3>
            <p className="text-xs">
              Go to the Visual Canvas, select any element, and use the "Logic Pointing" inspector tab to point fields to variables, functions, or workers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl">
            {connections.map((conn, idx) => (
              <div
                key={idx}
                onClick={() => onSelectElement(conn.sourceElementId)}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-3.5 transition group cursor-pointer shadow-sm flex items-center justify-between"
              >
                {/* Source UI Object */}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 uppercase">
                      &lt;{conn.sourceTag}&gt;
                    </span>
                    <span className="font-semibold text-white text-xs truncate">
                      {conn.sourceElementName}
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-400 font-mono flex items-center space-x-1">
                    <span>Field: {conn.field}</span>
                  </div>
                </div>

                {/* Wire Arrow */}
                <div className="flex items-center space-x-1 px-2 text-slate-600 group-hover:text-indigo-400 transition">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Target Logic Entity */}
                <div className="flex-1 min-w-0 pl-3 text-right">
                  <div className="flex items-center justify-end space-x-1 mb-1">
                    {conn.targetCategory === 'variable' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-medium flex items-center space-x-1">
                        <Database className="w-3 h-3 mr-1" />
                        Variable
                      </span>
                    )}
                    {conn.targetCategory === 'function' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-medium flex items-center space-x-1">
                        <Zap className="w-3 h-3 mr-1" />
                        Function
                      </span>
                    )}
                    {conn.targetCategory === 'class' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-medium flex items-center space-x-1">
                        <Box className="w-3 h-3 mr-1" />
                        Class Method
                      </span>
                    )}
                    {conn.targetCategory === 'worker' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-medium flex items-center space-x-1">
                        <Cpu className="w-3 h-3 mr-1" />
                        Web Worker Thread
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono text-xs font-semibold truncate ${
                      conn.color === 'emerald'
                        ? 'text-emerald-400'
                        : conn.color === 'amber'
                        ? 'text-amber-400'
                        : conn.color === 'purple'
                        ? 'text-purple-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {conn.targetName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
