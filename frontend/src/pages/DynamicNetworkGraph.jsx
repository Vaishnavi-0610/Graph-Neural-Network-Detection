import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  TimerReset,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getDynamicNetwork } from "../services/api";

const WINDOW_OPTIONS = [1, 5, 10, 15];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function shortIp(ip) {
  if (!ip) return "Unknown";
  return ip.length > 18 ? `${ip.slice(0, 16)}…` : ip;
}

function layoutNodes(nodes, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.36;

  return nodes.map((node, index) => {
    const angle =
      (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const wobble = (node.degree % 5) * 4;

    return {
      ...node,
      x: cx + Math.cos(angle) * (radius + wobble),
      y: cy + Math.sin(angle) * (radius + wobble),
    };
  });
}

function DynamicTopology({
  snapshot,
  previousSnapshot,
  highlightedPath,
  pathMode,
  onNodeSelect,
}) {
  const width = 980;
  const height = 500;

  const nodes = useMemo(() => {
    if (!snapshot?.nodes) return [];
    return layoutNodes(snapshot.nodes, width, height);
  }, [snapshot]);

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [Number(node.id), node])),
    [nodes]
  );

  const previousEdges = useMemo(() => {
    const set = new Set();
    (previousSnapshot?.edges || []).forEach((edge) => {
      set.add(`${edge.source_id}->${edge.destination_id}`);
    });
    return set;
  }, [previousSnapshot]);

  const highlightedPairs = useMemo(() => {
    const set = new Set();
    if (!highlightedPath?.node_ids) return set;

    for (let index = 0; index < highlightedPath.node_ids.length - 1; index += 1) {
      set.add(
        `${highlightedPath.node_ids[index]}->${highlightedPath.node_ids[index + 1]}`
      );
    }
    return set;
  }, [highlightedPath]);

  const edges = useMemo(() => {
    return (snapshot?.edges || [])
      .map((edge) => {
        const source = nodeMap.get(Number(edge.source_id));
        const destination = nodeMap.get(Number(edge.destination_id));
        if (!source || !destination) return null;

        const key = `${edge.source_id}->${edge.destination_id}`;
        return {
          ...edge,
          source,
          destination,
          key,
          isNew: previousSnapshot ? !previousEdges.has(key) : false,
          isHighlighted: highlightedPairs.has(key),
        };
      })
      .filter(Boolean)
      .filter((edge) => !pathMode || edge.isSuspicious || edge.is_suspicious || edge.isHighlighted);
  }, [snapshot, nodeMap, previousSnapshot, previousEdges, highlightedPairs, pathMode]);

  const maxDegree = Math.max(
    1,
    ...nodes.map((node) => Number(node.degree || 0))
  );

  return (
    <div className="relative overflow-hidden border border-white/[0.06] bg-[#070b10]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06),transparent_42%)]" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative h-[500px] w-full"
      >
        <defs>
          <pattern
            id="dynamic-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(148,163,184,0.055)"
              strokeWidth="1"
            />
          </pattern>

          <filter id="dynamic-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <marker
            id="arrow-normal"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 z" fill="#64748b" />
          </marker>

          <marker
            id="arrow-new"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="#22d3ee" />
          </marker>

          <marker
            id="arrow-attack"
            markerWidth="9"
            markerHeight="9"
            refX="8"
            refY="4.5"
            orient="auto"
          >
            <path d="M0,0 L9,4.5 L0,9 z" fill="#ef4444" />
          </marker>
        </defs>

        <rect width={width} height={height} fill="url(#dynamic-grid)" />

        {edges.map((edge, index) => {
          const intensity = Math.min(
            1,
            Number(edge.flows || 1) / Math.max(1, snapshot?.event_count || 1)
          );
          const suspicious = Boolean(edge.isSuspicious || edge.is_suspicious);
          const highlighted = edge.isHighlighted;

          let stroke = "#475569";
          let marker = "url(#arrow-normal)";
          let widthValue = 1 + intensity * 1.5;
          let dash = undefined;

          if (suspicious) {
            stroke = highlighted ? "#f43f5e" : "#ef4444";
            marker = "url(#arrow-attack)";
            widthValue = highlighted ? 3.4 : 2.3;
            dash = "3 7";
          } else if (edge.isNew) {
            stroke = "#22d3ee";
            marker = "url(#arrow-new)";
            widthValue = 2.2;
            dash = "6 5";
          }

          return (
            <g key={`${edge.key}-${index}`}>
              <motion.line
                x1={edge.source.x}
                y1={edge.source.y}
                x2={edge.destination.x}
                y2={edge.destination.y}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{
                  opacity: highlighted ? 0.95 : suspicious ? 0.72 : 0.3 + intensity * 0.45,
                  pathLength: 1,
                }}
                transition={{ duration: 0.35 }}
                stroke={stroke}
                strokeWidth={widthValue}
                strokeDasharray={dash}
                markerEnd={marker}
                filter={suspicious || edge.isNew ? "url(#dynamic-glow)" : undefined}
              />

              {suspicious && (
                <motion.circle
                  r={highlighted ? 3.5 : 2.4}
                  fill={highlighted ? "#fb7185" : "#ef4444"}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    cx: [edge.source.x, edge.destination.x],
                    cy: [edge.source.y, edge.destination.y],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: (index % 5) * 0.12,
                  }}
                />
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const degree = Number(node.degree || 0);
          const radius = 5 + (degree / maxDegree) * 9;
          const suspiciousNode = Number(node.suspicious_flows || 0) > 0;
          const selectedPathNode = highlightedPath?.node_ids?.includes(Number(node.id));

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => onNodeSelect(node)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={radius + (suspiciousNode ? 11 : 7)}
                fill={
                  selectedPathNode
                    ? "rgba(244,63,94,0.16)"
                    : suspiciousNode
                    ? "rgba(239,68,68,0.09)"
                    : "rgba(34,211,238,0.04)"
                }
              />

              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill="#0b1620"
                stroke={
                  selectedPathNode || suspiciousNode
                    ? "#ef4444"
                    : "#22d3ee"
                }
                strokeWidth={selectedPathNode ? 2.4 : 1.5}
              />

              <circle
                cx={node.x}
                cy={node.y}
                r={Math.max(2.5, radius * 0.38)}
                fill={suspiciousNode ? "#ef4444" : "#22d3ee"}
              />

              <text
                x={node.x}
                y={node.y + radius + 14}
                textAnchor="middle"
                className={`text-[9px] ${
                  suspiciousNode ? "fill-red-300" : "fill-slate-400"
                }`}
              >
                {shortIp(node.ip)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-4 top-4 border border-white/[0.06] bg-[#05070a]/90 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-cyan-400 shadow-[0_0_9px_rgba(34,211,238,.8)]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            {pathMode ? "Suspicious path view" : "Snapshot topology"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[9px] uppercase tracking-wider text-slate-600">
          <span>→ direction</span>
          <span className="text-red-400">red = suspicious</span>
          <span className="text-cyan-400">cyan = new</span>
        </div>
      </div>
    </div>
  );
}

function NodePanel({ node, onClose }) {
  if (!node) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute right-4 top-4 z-20 w-[270px] overflow-hidden border border-cyan-400/10 bg-[#080d13]/95 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-cyan-400">
            Node details
          </p>
          <p className="mt-1 font-mono text-xs text-slate-200">{node.ip}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-600 hover:bg-white/[0.05] hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Degree</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatNumber(node.degree)}</p>
        </div>
        <div className="border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Flows</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatNumber(node.flows)}</p>
        </div>
        <div className="col-span-2 border border-red-400/10 bg-red-400/[0.03] p-3">
          <p className="text-[9px] uppercase tracking-wider text-red-400">Suspicious flows</p>
          <p className="mt-1 text-lg font-semibold text-red-300">
            {formatNumber(node.suspicious_flows)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, danger = false }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.018] p-3">
      <div className={`flex items-center gap-2 ${danger ? "text-red-400" : "text-slate-600"}`}>
        <Icon size={14} />
        <span className="text-[9px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className={`mt-2 text-lg font-semibold ${danger ? "text-red-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function SuspiciousPathList({ paths, selectedPath, onSelect }) {
  return (
    <div className="border border-white/[0.06] bg-[#070b10]">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-red-400" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-300">
            Suspicious communication paths
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-5 text-slate-600">
          Model-scored paths in the current chronological snapshot. These indicate suspicious communication, not confirmed lateral movement.
        </p>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {paths.length === 0 ? (
          <div className="p-5 text-xs text-slate-600">
            No suspicious communication path was scored in this snapshot.
          </div>
        ) : (
          paths.map((path) => {
            const active = selectedPath?.path_id === path.path_id;

            return (
              <button
                key={path.path_id}
                type="button"
                onClick={() => onSelect(active ? null : path)}
                className={`block w-full border-b border-white/[0.05] px-4 py-4 text-left transition ${
                  active
                    ? "bg-red-400/[0.06]"
                    : "hover:bg-white/[0.025]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    Path {String(path.path_id).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[9px] text-red-400">
                    {formatPercent(path.max_probability)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {path.nodes.map((ip, index) => (
                    <div key={`${ip}-${index}`} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span className="font-mono text-[10px] text-slate-300">
                        {ip}
                      </span>
                      {index < path.nodes.length - 1 && (
                        <span className="ml-1 text-[9px] text-red-500">↓</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-4 text-[9px] uppercase tracking-wider text-slate-600">
                  <span>{path.hops} hops</span>
                  <span>{formatNumber(path.suspicious_flows)} flows</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function PathAnalysis({ path, snapshot, onClose }) {
  if (!path) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-red-400/10 bg-red-400/[0.025] p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={15} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
              Path analysis
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">
            Suspicious communication path
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-600 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Hops</p>
          <p className="mt-1 text-sm font-semibold text-white">{path.hops}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Suspicious flows</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {formatNumber(path.suspicious_flows)}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Max probability</p>
          <p className="mt-1 text-sm font-semibold text-red-300">
            {formatPercent(path.max_probability)}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Snapshot</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {Number(snapshot?.snapshot_id ?? 0) + 1}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function DynamicNetworkGraph() {
  const [windowMinutes, setWindowMinutes] = useState(5);
  const [data, setData] = useState(null);
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [pathMode, setPathMode] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const loadSnapshots = async (minutes = windowMinutes) => {
    setLoading(true);
    setError("");
    setPlaying(false);
    setSelectedPath(null);
    setSelectedNode(null);

    try {
      const result = await getDynamicNetwork(minutes, 200, 60);
      setData(result);
      setSnapshotIndex(0);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load dynamic network snapshots."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots(5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing || !data?.snapshots?.length) return undefined;

    const timer = window.setInterval(() => {
      setSnapshotIndex((current) => {
        if (current >= data.snapshots.length - 1) {
          setPlaying(false);
          return current;
        }
        setSelectedPath(null);
        return current + 1;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [playing, data, speed]);

  const snapshots = data?.snapshots || [];
  const snapshot = snapshots[snapshotIndex];
  const previousSnapshot =
    snapshotIndex > 0 ? snapshots[snapshotIndex - 1] : null;

  useEffect(() => {
    setSelectedPath(null);
    setSelectedNode(null);
  }, [snapshotIndex]);

  const summary = useMemo(() => {
    if (!snapshot) {
      return {
        nodes: 0,
        edges: 0,
        events: 0,
        newEdges: 0,
        suspiciousEdges: 0,
        suspiciousFlows: 0,
      };
    }

    const previous = new Set(
      (previousSnapshot?.edges || []).map(
        (edge) => `${edge.source_id}->${edge.destination_id}`
      )
    );

    const newEdges = (snapshot.edges || []).filter(
      (edge) => !previous.has(`${edge.source_id}->${edge.destination_id}`)
    ).length;

    return {
      nodes: snapshot.node_count,
      edges: snapshot.edge_count,
      events: snapshot.event_count,
      newEdges,
      suspiciousEdges: snapshot.suspicious_edge_count || 0,
      suspiciousFlows: snapshot.suspicious_flow_count || 0,
    };
  }, [snapshot, previousSnapshot]);

  const paths = snapshot?.suspicious_paths || [];

  const progress = snapshots.length
    ? ((snapshotIndex + 1) / snapshots.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Layers3 size={17} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
              Dynamic Network Graph
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Chronological Network Evolution
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Convert chronological network events into sequential graph snapshots and inspect how communication topology evolves over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <TimerReset size={14} className="text-slate-600" />
            <span className="text-[10px] uppercase tracking-wider text-slate-600">
              Window
            </span>
            <select
              value={windowMinutes}
              onChange={(event) => {
                const value = Number(event.target.value);
                setWindowMinutes(value);
                loadSnapshots(value);
              }}
              className="bg-transparent text-xs font-medium text-slate-200 outline-none"
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#080d13]">
                  {option} min
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadSnapshots(windowMinutes)}
            disabled={loading}
            className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-400 transition hover:border-cyan-400/20 hover:text-cyan-300 disabled:opacity-50"
          >
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-400/10 bg-red-400/[0.04] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat icon={Clock3} label="Snapshots" value={formatNumber(data?.total_snapshots)} />
        <Stat icon={Activity} label="Events" value={formatNumber(data?.total_events)} />
        <Stat icon={Users} label="Current Nodes" value={formatNumber(summary.nodes)} />
        <Stat icon={GitBranch} label="Current Edges" value={formatNumber(summary.edges)} />
        <Stat
          icon={AlertTriangle}
          label="Suspicious Edges"
          value={formatNumber(summary.suspiciousEdges)}
          danger
        />
        <Stat
          icon={ShieldAlert}
          label="Suspicious Flows"
          value={formatNumber(summary.suspiciousFlows)}
          danger
        />
      </div>

      <div className="overflow-hidden border border-white/[0.06] bg-[#070b10]">
        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.06] px-5 py-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Snapshot {snapshots.length ? snapshotIndex + 1 : 0} / {snapshots.length}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Clock3 size={14} className="text-cyan-400" />
              <span className="font-mono text-xs text-slate-300">
                {snapshot?.start_time || "Waiting for data"}
              </span>
              <span className="text-slate-700">→</span>
              <span className="font-mono text-xs text-slate-500">
                {snapshot?.end_time || ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPathMode((value) => !value)}
              disabled={!snapshot}
              className={`flex items-center gap-2 border px-3 py-2 text-xs transition disabled:opacity-30 ${
                pathMode
                  ? "border-red-400/30 bg-red-400/[0.08] text-red-300"
                  : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-red-300"
              }`}
            >
              <ShieldAlert size={14} />
              {pathMode ? "Path View" : "Suspicious Paths"}
            </button>

            <button
              type="button"
              onClick={() => setSnapshotIndex((value) => Math.max(0, value - 1))}
              disabled={!snapshotIndex || loading}
              className="border border-white/[0.06] p-2 text-slate-500 hover:bg-white/[0.03] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              disabled={!snapshots.length || loading}
              className="flex items-center gap-2 border border-cyan-400/15 bg-cyan-400/[0.07] px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/[0.11] disabled:opacity-30"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? "Pause" : "Play"}
            </button>

            <button
              type="button"
              onClick={() =>
                setSnapshotIndex((value) =>
                  Math.min(snapshots.length - 1, value + 1)
                )
              }
              disabled={
                !snapshots.length || snapshotIndex >= snapshots.length - 1 || loading
              }
              className="border border-white/[0.06] p-2 text-slate-500 hover:bg-white/[0.03] hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>

            <div className="ml-2 flex items-center gap-1 border border-white/[0.06] p-1">
              {[500, 1000, 2000].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSpeed(value)}
                  className={`px-2 py-1 text-[9px] ${
                    speed === value
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-600 hover:text-slate-300"
                  }`}
                >
                  {value === 500 ? "2×" : value === 2000 ? "0.5×" : "1×"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex h-[500px] items-center justify-center text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Zap size={15} className="animate-pulse text-cyan-400" />
                Building chronological graph snapshots…
              </div>
            </div>
          ) : snapshot ? (
            <DynamicTopology
              snapshot={snapshot}
              previousSnapshot={previousSnapshot}
              highlightedPath={selectedPath}
              pathMode={pathMode}
              onNodeSelect={setSelectedNode}
            />
          ) : (
            <div className="flex h-[500px] items-center justify-center text-sm text-slate-600">
              No chronological graph events available.
            </div>
          )}

          <NodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>

        <div className="border-t border-white/[0.06] px-5 py-4">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-slate-600">
            <span>Timeline</span>
            <span>{snapshot?.start_time || "—"}</span>
            <span>{snapshot?.end_time || "—"}</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(0, snapshots.length - 1)}
            value={snapshotIndex}
            onChange={(event) => setSnapshotIndex(Number(event.target.value))}
            className="mt-3 w-full accent-cyan-400"
            disabled={!snapshots.length}
          />
          <div className="mt-2 h-1 overflow-hidden bg-white/[0.04]">
            <motion.div
              className="h-full bg-cyan-400"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <PathAnalysis
          path={selectedPath}
          snapshot={snapshot}
          onClose={() => setSelectedPath(null)}
        />

        <SuspiciousPathList
          paths={paths}
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Server size={15} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
              Current snapshot
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">
            {formatNumber(summary.nodes)}
          </p>
          <p className="mt-1 text-xs text-slate-600">active visible nodes</p>
        </div>

        <div className="border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-center gap-2 text-cyan-400">
            <GitBranch size={15} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
              Communication
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">
            {formatNumber(summary.edges)}
          </p>
          <p className="mt-1 text-xs text-slate-600">visible directed edges</p>
        </div>

        <div className="border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap size={15} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
              New links
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">
            {formatNumber(summary.newEdges)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            links first observed in this snapshot
          </p>
        </div>
      </div>

      <div className="border border-white/[0.06] bg-[#070b10] p-5">
        <div className="flex items-start gap-3">
          <div className="border border-cyan-400/10 bg-cyan-400/[0.05] p-2 text-cyan-400">
            <SlidersHorizontal size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Dynamic graph methodology
            </h2>
            <p className="mt-2 max-w-4xl text-xs leading-6 text-slate-600">
              Chronological training-context edge events are ordered by timestamp and grouped into fixed-length windows. Each window becomes an independent directed graph snapshot containing its active nodes and communication edges. The existing trained Edge-Aware GNN scores the saved context edges, and the UI highlights high-probability suspicious communication paths within each snapshot.
            </p>
            <p className="mt-2 text-[10px] leading-5 text-slate-700">
              Important: suspicious paths represent model-scored communication patterns and are not by themselves proof of lateral movement. The current GNN does not perform recurrent temporal message passing.
            </p>
            <p className="mt-2 text-[10px] leading-5 text-slate-700">
              Source: {data?.source || "CICIDS2017 training context"} · threshold {Number(data?.threshold || 0.67).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DynamicNetworkGraph;