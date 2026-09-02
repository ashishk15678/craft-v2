"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import type { TopicContent } from "@/app/api/ai/generate-topic/route";

// ─── Node type definitions ────────────────────────────────────────────────────

type ConceptNode = TopicContent["conceptMap"]["nodes"][number];

const TYPE_STYLE: Record<ConceptNode["type"], { bg: string; border: string; text: string; badge: string }> = {
  core:       { bg: "bg-indigo-950",   border: "border-indigo-500",   text: "text-indigo-100",   badge: "bg-indigo-500 text-white" },
  supporting: { bg: "bg-zinc-900",     border: "border-zinc-600",     text: "text-zinc-100",     badge: "bg-zinc-600 text-white" },
  example:    { bg: "bg-emerald-950",  border: "border-emerald-600",  text: "text-emerald-100",  badge: "bg-emerald-600 text-white" },
  pitfall:    { bg: "bg-red-950",      border: "border-red-600",      text: "text-red-100",      badge: "bg-red-600 text-white" },
};

const TYPE_LABEL: Record<ConceptNode["type"], string> = {
  core: "core",
  supporting: "supports",
  example: "example",
  pitfall: "⚠ pitfall",
};

function ConceptNodeComponent({
  data,
}: {
  data: { label: string; description: string; type: ConceptNode["type"] };
}) {
  const style = TYPE_STYLE[data.type] ?? TYPE_STYLE.supporting;
  return (
    <div
      className={`
        rounded-xl border-2 px-4 py-3 min-w-[140px] max-w-[200px] shadow-lg
        ${style.bg} ${style.border}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-500 !border-zinc-400" />
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold leading-tight ${style.text}`}>{data.label}</p>
          <p className="text-[10px] text-zinc-400 mt-1 leading-snug line-clamp-2">{data.description}</p>
        </div>
      </div>
      <span className={`mt-2 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.badge}`}>
        {TYPE_LABEL[data.type]}
      </span>
      <Handle type="source" position={Position.Right} className="!bg-zinc-500 !border-zinc-400" />
    </div>
  );
}

const nodeTypes: NodeTypes = { concept: ConceptNodeComponent };

// ─── Layout: simple force-free hierarchical layout ────────────────────────────

function layoutNodes(
  rawNodes: ConceptNode[],
  edges: TopicContent["conceptMap"]["edges"],
): { nodes: Node[]; layoutEdges: Edge[] } {
  // Separate core nodes from the rest
  const cores = rawNodes.filter((n) => n.type === "core");
  const others = rawNodes.filter((n) => n.type !== "core");

  const COLS = 3;
  const H_GAP = 260;
  const V_GAP = 160;

  const positioned: Node[] = [];

  // Cores form the center column
  cores.forEach((n, i) => {
    positioned.push({
      id: n.id,
      type: "concept",
      position: { x: Math.floor(others.length / 2) * H_GAP, y: i * V_GAP },
      data: { label: n.label, description: n.description, type: n.type },
    });
  });

  // Others arranged in a grid around the cores
  others.forEach((n, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const xOffset = col < Math.floor(others.length / 2) ? 0 : H_GAP * 2;
    positioned.push({
      id: n.id,
      type: "concept",
      position: { x: col * H_GAP, y: row * V_GAP },
      data: { label: n.label, description: n.description, type: n.type },
    });
  });

  const layoutEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: "smoothstep",
    animated: false,
    style: { stroke: "#6366f1", strokeWidth: 1.5 },
    labelStyle: { fill: "#a1a1aa", fontSize: 9, fontFamily: "monospace" },
    labelBgStyle: { fill: "#18181b", fillOpacity: 0.8 },
  }));

  return { nodes: positioned, layoutEdges };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConceptMapViewer({
  nodes: rawNodes,
  edges: rawEdges,
}: {
  nodes: ConceptNode[];
  edges: TopicContent["conceptMap"]["edges"];
}) {
  const { nodes: initialNodes, layoutEdges } = useMemo(
    () => layoutNodes(rawNodes, rawEdges),
    [rawNodes, rawEdges],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges);

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ height: 520 }}>
      {/* Legend */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <span className="text-xs font-bold text-muted-foreground">Legend:</span>
        {Object.entries(TYPE_LABEL).map(([type, label]) => {
          const s = TYPE_STYLE[type as ConceptNode["type"]];
          return (
            <span key={type} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badge}`}>
              {label}
            </span>
          );
        })}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        className="bg-zinc-950"
        aria-label="Concept map"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <Controls className="!bg-zinc-900 !border-zinc-700 !rounded-lg overflow-hidden" />
        <MiniMap
          nodeColor={(n) => {
            const t = (n.data as { type: ConceptNode["type"] }).type;
            return { core: "#6366f1", supporting: "#52525b", example: "#10b981", pitfall: "#ef4444" }[t] ?? "#52525b";
          }}
          maskColor="rgba(9,9,11,0.7)"
          className="!bg-zinc-900 !border-zinc-700 !rounded-lg overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}
