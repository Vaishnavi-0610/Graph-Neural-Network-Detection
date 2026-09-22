import { Component, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  XCircle,
  Zap,
} from "lucide-react";
import { evaluateEnterprise } from "../services/api";

function formatNumber(value, fallback = "0") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number.toLocaleString();
}

function formatPercent(value, digits = 2) {
  if (value === null || value === undefined || value === "") {
    return "0.00%";
  }

  let number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00%";
  }

  if (Math.abs(number) <= 1) {
    number *= 100;
  }

  return `${number.toFixed(digits)}%`;
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") {
    return "0.0000";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.0000";
  }

  return number.toFixed(4);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function normalizeResult(raw) {
  const data = safeObject(raw);

  const summary = safeObject(
    data.summary ||
      data.statistics ||
      data.network_summary ||
      data.stats
  );

  const metrics = safeObject(
    data.metrics ||
      data.evaluation_metrics ||
      data.ground_truth_metrics
  );

  const rawConfusion = safeObject(
    data.confusion_matrix ||
      data.confusion ||
      data.confusion_counts
  );

  const rawMetrics = safeObject(
    data.metrics ||
      data.evaluation_metrics ||
      data.ground_truth_metrics
  );

  const confusion = {
    true_negative:
      rawConfusion.true_negative ??
      rawConfusion.tn ??
      rawMetrics.true_negative ??
      rawMetrics.tn ??
      0,
    false_positive:
      rawConfusion.false_positive ??
      rawConfusion.fp ??
      rawMetrics.false_positive ??
      rawMetrics.fp ??
      0,
    false_negative:
      rawConfusion.false_negative ??
      rawConfusion.fn ??
      rawMetrics.false_negative ??
      rawMetrics.fn ??
      0,
    true_positive:
      rawConfusion.true_positive ??
      rawConfusion.tp ??
      rawMetrics.true_positive ??
      rawMetrics.tp ??
      0,
  };

  const model = safeObject(
    data.model ||
      data.model_info
  );

  return {
    ...data,

    summary: {
      total_flows:
        summary.total_flows ??
        data.total_flows ??
        data.flow_count ??
        0,

      total_nodes:
        summary.total_nodes ??
        data.total_nodes ??
        data.node_count ??
        0,

      total_edges:
        summary.total_edges ??
        data.total_edges ??
        data.edge_count ??
        0,

      detected_attacks:
        summary.detected_attacks ??
        data.detected_attacks ??
        data.attack_count ??
        data.predicted_attacks ??
        0,

      benign_flows:
        summary.benign_flows ??
        data.benign_flows ??
        data.predicted_benign ??
        0,

      attack_rate:
        summary.attack_rate ??
        data.attack_rate ??
        0,

      processing_time_ms:
        summary.processing_time_ms ??
        data.processing_time_ms ??
        data.processing_time ??
        0,
    },

    metrics: {
      accuracy:
        metrics.accuracy ??
        data.accuracy ??
        null,

      precision:
        metrics.precision ??
        data.precision ??
        null,

      recall:
        metrics.recall ??
        data.recall ??
        null,

      f1:
        metrics.f1 ??
        metrics.f1_score ??
        data.f1 ??
        data.f1_score ??
        null,
    },

    confusion: {
      true_negative:
        confusion.true_negative ??
        confusion.tn ??
        0,

      false_positive:
        confusion.false_positive ??
        confusion.fp ??
        0,

      false_negative:
        confusion.false_negative ??
        confusion.fn ??
        0,

      true_positive:
        confusion.true_positive ??
        confusion.tp ??
        0,
    },

    categories: safeArray(
      data.categories ||
        data.category_analysis ||
        data.attack_categories
    ),

    high_risk_nodes: safeArray(
      data.high_risk_nodes ||
        data.high_risk ||
        data.risky_nodes
    ),

    attack_networks: safeArray(
      data.predicted_attack_networks ||
        data.attack_networks ||
        data.attack_paths
    ),

    topology: safeObject(
      data.topology ||
        data.graph ||
        {}
    ),

    flows: safeArray(
      data.flows ||
        data.flow_results ||
        data.results
    ),

    warnings: safeArray(data.warnings),

    model: {
      name:
        model.name ||
        model.model ||
        data.model_name ||
        "TemporalEdgeGNN",

      threshold:
        model.threshold ??
        data.threshold ??
        0.67,
    },
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  danger = false,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        danger
          ? "border-red-400/10 bg-red-400/[0.025]"
          : "border-white/[0.07] bg-[#090d12]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? "bg-red-400/[0.07]"
              : "bg-cyan-400/[0.06]"
          }`}
        >
          <Icon
            size={19}
            className={
              danger
                ? "text-red-400"
                : "text-cyan-400"
            }
          />
        </div>

        <Activity
          size={14}
          className="text-slate-700"
        />
      </div>

      <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-slate-600">
        {description}
      </p>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
        {title}
      </p>

      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function NodeBadge({ critical }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-wider ${
        critical
          ? "border-red-400/20 bg-red-400/[0.06] text-red-400"
          : "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-400"
      }`}
    >
      {critical ? "High Risk" : "Normal"}
    </span>
  );
}



class EnterpriseTopologyBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("EnterpriseTopology render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-300">
          Network topology could not be rendered. The evaluation results are still available below.
        </div>
      );
    }

    return this.props.children;
  }
}


function EnterpriseTopology({ topology, flows = [], attackNetworks = [], onNodeSelect }) {
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);

  const nodes = useMemo(() => {
    const raw = Array.isArray(topology?.nodes) ? topology.nodes : [];
    const result = [];
    const seen = new Set();

    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const ip = item.ip_address ?? item.ip ?? item.id;
      if (!ip || seen.has(String(ip))) continue;

      const total = Number(item.total_flows ?? item.flows ?? 0);
      const attacks = Number(item.attack_flows ?? item.attacks ?? 0);

      result.push({
        ...item,
        id: String(ip),
        ip: String(ip),
        flows: Number.isFinite(total) ? total : 0,
        attacks: Number.isFinite(attacks) ? attacks : 0,
      });
      seen.add(String(ip));
    }

    return result;
  }, [topology]);

  const edges = useMemo(() => {
    const raw = Array.isArray(topology?.edges) ? topology.edges : [];
    const result = [];
    const seen = new Set();

    const addEdge = (item) => {
      if (!item || typeof item !== "object") return;

      const source = item.source_ip ?? item.source ?? item.src ?? item.from;
      const destination =
        item.destination_ip ?? item.destination ?? item.dst ?? item.to;

      if (!source || !destination) return;

      const sourceKey = String(source);
      const destinationKey = String(destination);
      const key = `${sourceKey}\u2192${destinationKey}`;
      const total = Number(item.total_flows ?? item.flows ?? 1);
      const attacks = Number(item.attack_flows ?? item.attacks ?? 0);
      const probability = Number(
        item.max_probability ?? item.probability ?? item.attack_probability ?? 0
      );

      if (seen.has(key)) {
        const existing = result.find(
          (edge) => edge.source === sourceKey && edge.destination === destinationKey
        );
        if (existing) {
          existing.flows += Number.isFinite(total) ? total : 1;
          existing.attacks += Number.isFinite(attacks) ? attacks : 0;
          existing.probability = Math.max(
            existing.probability,
            Number.isFinite(probability) ? probability : 0
          );
        }
        return;
      }

      seen.add(key);
      result.push({
        ...item,
        source: sourceKey,
        destination: destinationKey,
        flows: Number.isFinite(total) ? total : 1,
        attacks: Number.isFinite(attacks) ? attacks : 0,
        probability: Number.isFinite(probability) ? probability : 0,
      });
    };

    raw.forEach(addEdge);

    // Always include model-detected attack paths even when the backend's
    // compact topology node selection omitted their endpoints.
    (Array.isArray(attackNetworks) ? attackNetworks : []).forEach((item) => {
      addEdge({
        ...item,
        attack_flows: item.attack_flows ?? item.detected_attacks ?? 1,
        total_flows: item.total_flows ?? item.flows ?? item.attack_flows ?? 1,
        max_probability: item.max_probability ?? item.probability ?? 0,
        status: "ATTACK",
      });
    });

    // Flow results are a final fallback for compact/sampled responses.
    (Array.isArray(flows) ? flows : []).forEach((item) => {
      if (String(item.prediction ?? item.status ?? "").toUpperCase() === "ATTACK") {
        addEdge({
          source: item.source_ip ?? item.source,
          destination: item.destination_ip ?? item.destination,
          total_flows: 1,
          attack_flows: 1,
          max_probability: item.attack_probability ?? item.probability ?? 0,
          status: "ATTACK",
        });
      }
    });

    return result;
  }, [topology, flows, attackNetworks]);

  // If the backend supplies edges but its node list is compacted differently,
  // always add their endpoints so the links can still be rendered.
  const graphNodes = useMemo(() => {
    const map = new Map(nodes.map((node) => [node.ip, node]));

    for (const edge of edges) {
      if (!map.has(edge.source)) {
        map.set(edge.source, {
          id: edge.source,
          ip: edge.source,
          flows: 0,
          attacks: 0,
        });
      }
      if (!map.has(edge.destination)) {
        map.set(edge.destination, {
          id: edge.destination,
          ip: edge.destination,
          flows: 0,
          attacks: 0,
        });
      }
    }

    const all = Array.from(map.values());

    // Prioritize attack nodes, then nodes participating in attack links,
    // then highest-traffic nodes. This keeps the graph readable.
    const attackIds = new Set();
    for (const edge of edges) {
      if (edge.attacks > 0) {
        attackIds.add(edge.source);
        attackIds.add(edge.destination);
      }
    }

    const degree = new Map();
    for (const edge of edges) {
      degree.set(edge.source, (degree.get(edge.source) || 0) + edge.flows);
      degree.set(
        edge.destination,
        (degree.get(edge.destination) || 0) + edge.flows
      );
    }

    all.sort((a, b) => {
      const aAttack = a.attacks > 0 || attackIds.has(a.ip) ? 1 : 0;
      const bAttack = b.attacks > 0 || attackIds.has(b.ip) ? 1 : 0;

      if (aAttack !== bAttack) return bAttack - aAttack;

      return (
        (degree.get(b.ip) || b.flows || 0) -
        (degree.get(a.ip) || a.flows || 0)
      );
    });

    return all.slice(0, 60);
  }, [nodes, edges]);

  const visibleIds = useMemo(
    () => new Set(graphNodes.map((node) => node.ip)),
    [graphNodes]
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          visibleIds.has(edge.source) && visibleIds.has(edge.destination)
      ),
    [edges, visibleIds]
  );

  const positions = useMemo(() => {
    const result = new Map();
    const cx = 430;
    const cy = 250;
    const rx = 355;
    const ry = 195;

    graphNodes.forEach((node, index) => {
      const angle =
        -Math.PI / 2 +
        (index / Math.max(graphNodes.length, 1)) * Math.PI * 2;

      result.set(node.ip, {
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
      });
    });

    return result;
  }, [graphNodes]);

  const attackEdges = visibleEdges.filter((edge) => edge.attacks > 0);
  const normalEdges = visibleEdges.filter((edge) => edge.attacks <= 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-white">
            Live Enterprise Topology
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {graphNodes.length} nodes · {visibleEdges.length} visible links ·{" "}
            {attackEdges.length} threat links
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Normal
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            High Risk
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
            className="rounded-lg border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
            className="rounded-lg border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800"
          >
            −
          </button>
        </div>
      </div>

      <div className="relative h-[540px] overflow-hidden">
        {graphNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No topology data available.
          </div>
        ) : (
          <svg
            viewBox="0 0 860 500"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              transform={`translate(430 250) scale(${zoom}) translate(-430 -250)`}
            >
              {/* Draw normal links first so threat links remain visually dominant. */}
              {normalEdges.map((edge, index) => {
                const source = positions.get(edge.source);
                const destination = positions.get(edge.destination);
                if (!source || !destination) return null;

                return (
                  <line
                    key={`normal-${edge.source}-${edge.destination}-${index}`}
                    x1={source.x}
                    y1={source.y}
                    x2={destination.x}
                    y2={destination.y}
                    stroke="#334155"
                    strokeWidth="1.2"
                    strokeOpacity="0.65"
                  />
                );
              })}

              {attackEdges.map((edge, index) => {
                const source = positions.get(edge.source);
                const destination = positions.get(edge.destination);
                if (!source || !destination) return null;

                return (
                  <g key={`attack-${edge.source}-${edge.destination}-${index}`}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={destination.x}
                      y2={destination.y}
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeOpacity="0.12"
                    />
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={destination.x}
                      y2={destination.y}
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeOpacity="0.95"
                      strokeDasharray="7 5"
                    />
                  </g>
                );
              })}

              {graphNodes.map((node) => {
                const point = positions.get(node.ip);
                if (!point) return null;

                const risky = node.attacks > 0;
                const isHovered = hovered === node.ip;

                return (
                  <g
                    key={node.ip}
                    transform={`translate(${point.x} ${point.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(node.ip)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() =>
                      typeof onNodeSelect === "function"
                        ? onNodeSelect(node)
                        : undefined
                    }
                  >
                    {risky && (
                      <circle
                        r="18"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeOpacity="0.25"
                      />
                    )}

                    <circle
                      r={isHovered ? 12 : risky ? 9 : 7}
                      fill={risky ? "#ef4444" : "#38bdf8"}
                      stroke={risky ? "#fecaca" : "#bae6fd"}
                      strokeWidth={isHovered ? 2.5 : 1}
                    />

                    <text
                      y="23"
                      textAnchor="middle"
                      fill={risky ? "#fecaca" : "#94a3b8"}
                      fontSize="8.5"
                    >
                      {node.ip}
                    </text>

                    {isHovered && (
                      <g transform="translate(13 -55)">
                        <rect
                          width="175"
                          height="62"
                          rx="8"
                          fill="#020617"
                          stroke="#334155"
                        />
                        <text
                          x="10"
                          y="18"
                          fill="#fff"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {node.ip}
                        </text>
                        <text x="10" y="35" fill="#94a3b8" fontSize="9">
                          Flows: {Number(node.flows || 0).toLocaleString()}
                        </text>
                        <text
                          x="10"
                          y="51"
                          fill={risky ? "#f87171" : "#94a3b8"}
                          fontSize="9"
                        >
                          Attacks: {Number(node.attacks || 0).toLocaleString()}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-[10px] text-slate-500">
          Click a node for details · Hover for traffic summary
        </div>
      </div>
    </div>
  );
}


function EnterpriseEvaluation() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [flowSearch, setFlowSearch] =
    useState("");

  const [categorySearch, setCategorySearch] =
    useState("");

  const normalizedResult =
    useMemo(
      () =>
        result
          ? normalizeResult(result)
          : null,
      [result]
    );

  const summary =
    normalizedResult?.summary || {};

  const metrics =
    normalizedResult?.metrics || {};

  const confusion =
    normalizedResult?.confusion || {};

  const categories =
    normalizedResult?.categories || [];

  const highRiskNodes =
    normalizedResult?.high_risk_nodes || [];

  const flows =
    normalizedResult?.flows || [];

  const attackNetworks =
    normalizedResult?.attack_networks || [];

  const warnings =
    normalizedResult?.warnings || [];

  const topology =
    normalizedResult?.topology || {};

  const handleFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please select a CSV file."
      );
      return;
    }

    setError("");
    setResult(null);
    setFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const droppedFile =
      event.dataTransfer?.files?.[0];

    handleFile(droppedFile);
  };

  const handleEvaluate = async () => {
    if (!file || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await evaluateEnterprise(file);

      setResult(response);
    } catch (err) {
      console.error(
        "Enterprise evaluation error:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Enterprise evaluation failed.";

      setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  const filteredFlows =
    useMemo(() => {
      const query =
        flowSearch.trim().toLowerCase();

      if (!query) {
        return flows.slice(0, 500);
      }

      return flows
        .filter((flow) => {
          const source = String(
            flow.source_ip ??
              flow.source ??
              ""
          ).toLowerCase();

          const destination =
            String(
              flow.destination_ip ??
                flow.destination ??
                ""
            ).toLowerCase();

          const prediction =
            String(
              flow.prediction ??
                flow.result ??
                flow.label ??
                ""
            ).toLowerCase();

          return (
            source.includes(query) ||
            destination.includes(query) ||
            prediction.includes(query)
          );
        })
        .slice(0, 500);
    }, [flows, flowSearch]);

  const filteredCategories =
    useMemo(() => {
      const query =
        categorySearch.trim().toLowerCase();

      if (!query) {
        return categories;
      }

      return categories.filter(
        (category) =>
          String(
            category.category ??
              category.name ??
              ""
          )
            .toLowerCase()
            .includes(query)
      );
    }, [categories, categorySearch]);

  const hasMetrics =
    metrics.accuracy !== null ||
    metrics.precision !== null ||
    metrics.recall !== null ||
    metrics.f1 !== null;

  return (
    <div className="min-h-full bg-[#05070a] p-8 text-white">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* HEADER */}
        <motion.section
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
        >
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
                  GNN Security Engine
                </span>

                <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                  Enterprise
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight">
                Enterprise Evaluation
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                Upload enterprise network traffic
                and evaluate it using the trained
                edge-aware TemporalEdgeGNN without
                retraining the model.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-4 py-3">
              <ShieldCheck
                size={16}
                className="text-emerald-400"
              />

              <div>
                <p className="text-[8px] uppercase tracking-[0.2em] text-slate-600">
                  Inference Engine
                </p>

                <p className="mt-0.5 text-xs font-medium text-emerald-400">
                  Ready
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* UPLOAD */}
        {!result && (
          <motion.section
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.05,
            }}
            className="rounded-2xl border border-white/[0.07] bg-[#090d12]"
          >
            <div className="border-b border-white/[0.05] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
                  <UploadCloud
                    size={18}
                    className="text-cyan-400"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-200">
                    Upload Enterprise Traffic
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-600">
                    CSV network flow dataset
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() =>
                  setDragging(false)
                }
                onDrop={handleDrop}
                className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition ${
                  dragging
                    ? "border-cyan-400/50 bg-cyan-400/[0.05]"
                    : "border-white/[0.09] bg-black/10 hover:border-cyan-400/25 hover:bg-cyan-400/[0.02]"
                }`}
              >
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) =>
                    handleFile(
                      event.target.files?.[0]
                    )
                  }
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05]">
                  <FileSpreadsheet
                    size={25}
                    className="text-cyan-400"
                  />
                </div>

                <p className="mt-5 text-sm font-medium text-gray-300">
                  {file
                    ? file.name
                    : "Drop your CSV file here"}
                </p>

                <p className="mt-2 text-[10px] text-slate-600">
                  or click to browse from your computer
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <span className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[8px] uppercase tracking-wider text-slate-600">
                    CSV
                  </span>

                  <span className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[8px] uppercase tracking-wider text-slate-600">
                    Network Flows
                  </span>

                  <span className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[8px] uppercase tracking-wider text-slate-600">
                    GNN Evaluation
                  </span>
                </div>
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet
                      size={17}
                      className="text-cyan-400"
                    />

                    <div>
                      <p className="text-xs font-medium text-gray-300">
                        {file.name}
                      </p>

                      <p className="mt-0.5 text-[9px] text-slate-600">
                        {formatNumber(
                          file.size
                        )}{" "}
                        bytes
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFile(null);
                      setError("");
                    }}
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-white/[0.04] hover:text-red-400"
                  >
                    <XCircle size={15} />
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/10 bg-red-400/[0.04] p-4">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <div>
                    <p className="text-xs font-medium text-red-400">
                      Evaluation Error
                    </p>

                    <p className="mt-1 text-[10px] leading-relaxed text-red-300/60">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[9px] text-slate-600">
                  <Zap
                    size={13}
                    className="text-cyan-400"
                  />
                  Existing trained model
                </div>

                <button
                  onClick={handleEvaluate}
                  disabled={!file || loading}
                  className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-semibold text-[#031015] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#031015]/30 border-t-[#031015]" />
                      Evaluating Network...
                    </>
                  ) : (
                    <>
                      <Activity size={14} />
                      Evaluate Network
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* RESULTS */}
        {normalizedResult && (
          <>
            {/* RESULT HEADER */}
            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025] p-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/[0.08]">
                  <CheckCircle2
                    size={21}
                    className="text-emerald-400"
                  />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-400/70">
                    Evaluation Complete
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    Enterprise network successfully evaluated
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setError("");
                  setFlowSearch("");
                  setCategorySearch("");
                }}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                Evaluate Another CSV
              </button>
            </section>

            {/* SUMMARY */}
            <section>
              <div className="mb-4">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                  Network Overview
                </p>

                <h2 className="mt-1 text-lg font-medium text-white">
                  Evaluation Summary
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard
                  title="Total Flows"
                  value={formatNumber(
                    summary.total_flows
                  )}
                  description="Uploaded network flows"
                  icon={Activity}
                />

                <StatCard
                  title="Network Nodes"
                  value={formatNumber(
                    summary.total_nodes
                  )}
                  description="Unique IP addresses"
                  icon={Network}
                />

                <StatCard
                  title="Graph Edges"
                  value={formatNumber(
                    summary.total_edges
                  )}
                  description="Communication edges"
                  icon={Zap}
                />

                <StatCard
                  title="Detected Attacks"
                  value={formatNumber(
                    summary.detected_attacks
                  )}
                  description="Flows classified as attack"
                  icon={ShieldAlert}
                  danger={
                    Number(
                      summary.detected_attacks
                    ) > 0
                  }
                />

                <StatCard
                  title="Benign Flows"
                  value={formatNumber(
                    summary.benign_flows
                  )}
                  description="Flows classified as benign"
                  icon={ShieldCheck}
                />

                <StatCard
                  title="Processing Time"
                  value={`${formatNumber(
                    summary.processing_time_ms
                  )} ms`}
                  description="End-to-end evaluation"
                  icon={Zap}
                />
              </div>
            </section>

            {/* METRICS */}
            {hasMetrics && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-6">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                      Ground Truth Available
                    </p>

                    <h2 className="mt-1 text-lg font-medium text-white">
                      Detection Performance
                    </h2>
                  </div>

                  <div className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] px-3 py-2 text-[9px] text-cyan-400">
                    Metrics calculated from uploaded labels
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <MetricCard
                    title="Accuracy"
                    value={formatPercent(
                      metrics.accuracy
                    )}
                  />

                  <MetricCard
                    title="Precision"
                    value={formatPercent(
                      metrics.precision
                    )}
                  />

                  <MetricCard
                    title="Recall"
                    value={formatPercent(
                      metrics.recall
                    )}
                  />

                  <MetricCard
                    title="F1 Score"
                    value={formatPercent(
                      metrics.f1
                    )}
                  />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <MetricCard
                    title="True Negatives"
                    value={formatNumber(
                      confusion.true_negative
                    )}
                  />

                  <MetricCard
                    title="False Positives"
                    value={formatNumber(
                      confusion.false_positive
                    )}
                  />

                  <MetricCard
                    title="False Negatives"
                    value={formatNumber(
                      confusion.false_negative
                    )}
                  />

                  <MetricCard
                    title="True Positives"
                    value={formatNumber(
                      confusion.true_positive
                    )}
                  />
                </div>
              </section>
            )}

            {/* ATTACK RATE */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                  Threat Exposure
                </p>

                <h2 className="mt-1 text-lg font-medium text-white">
                  Attack Rate
                </h2>

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-4xl font-semibold text-red-400">
                    {formatPercent(
                      summary.attack_rate
                    )}
                  </span>

                  <span className="mb-1 text-[10px] text-slate-600">
                    of uploaded traffic
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            summary.attack_rate
                          ) <= 1
                            ? Number(
                                summary.attack_rate
                              ) * 100
                            : Number(
                                summary.attack_rate
                              )
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                  Model Configuration
                </p>

                <h2 className="mt-1 text-lg font-medium text-white">
                  Inference Configuration
                </h2>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between border-b border-white/[0.05] pb-3">
                    <span className="text-xs text-slate-500">
                      Model
                    </span>

                    <span className="font-mono text-xs text-slate-200">
                      {normalizedResult.model.name}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-white/[0.05] pb-3">
                    <span className="text-xs text-slate-500">
                      Decision Threshold
                    </span>

                    <span className="font-mono text-xs text-cyan-400">
                      {Number(
                        normalizedResult.model.threshold
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">
                      Processing
                    </span>

                    <span className="text-xs text-emerald-400">
                      No Retraining
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* WARNINGS */}
            {warnings.length > 0 && (
              <section className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={15}
                    className="text-amber-400"
                  />

                  <p className="text-xs font-medium text-amber-300">
                    Evaluation Warnings
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {warnings.map(
                    (warning, index) => (
                      <p
                        key={index}
                        className="text-[10px] leading-relaxed text-amber-200/50"
                      >
                        •{" "}
                        {typeof warning ===
                        "string"
                          ? warning
                          : JSON.stringify(
                              warning
                            )}
                      </p>
                    )
                  )}
                </div>
              </section>
            )}

            {/* TOPOLOGY */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                    Enterprise Graph
                  </p>

                  <h2 className="mt-1 text-lg font-medium text-white">
                    Network Topology
                  </h2>
                </div>

                <div className="flex items-center gap-4 text-[9px] text-slate-600">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Normal
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    High Risk
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <EnterpriseTopologyBoundary><EnterpriseTopology
                  topology={topology}
                  flows={flows}
                  attackNetworks={attackNetworks}
                  highRiskNodes={highRiskNodes}
                 /></EnterpriseTopologyBoundary>
              </div>
            </section>

            {/* HIGH RISK NODES */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#090d12]">
              <div className="flex flex-col justify-between gap-3 border-b border-white/[0.05] px-6 py-5 md:flex-row md:items-center">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                    Threat Intelligence
                  </p>

                  <h2 className="mt-1 text-lg font-medium text-white">
                    High-Risk Nodes
                  </h2>
                </div>

                <span className="rounded-full border border-red-400/10 bg-red-400/[0.04] px-3 py-1.5 text-[9px] text-red-400">
                  {formatNumber(
                    highRiskNodes.length
                  )}{" "}
                  nodes
                </span>
              </div>

              {highRiskNodes.length === 0 ? (
                <div className="p-8 text-center">
                  <ShieldCheck
                    size={26}
                    className="mx-auto text-emerald-400"
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    No high-risk nodes detected
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Node
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Risk
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Attacks
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Flows
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {highRiskNodes
                        .slice(0, 100)
                        .map(
                          (node, index) => (
                            <tr
                              key={index}
                              className="border-b border-white/[0.03] last:border-0"
                            >
                              <td className="px-6 py-3">
                                <span className="font-mono text-[10px] text-slate-300">
                                  {String(
                                    node.ip ??
                                      node.address ??
                                      node.node ??
                                      node.id ??
                                      "Unknown"
                                  )}
                                </span>
                              </td>

                              <td className="px-6 py-3">
                                <NodeBadge
                                  critical={
                                    true
                                  }
                                />
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-red-400">
                                {formatNumber(
                                  node.attack_flow_count ??
                                    node.attacks ??
                                    node.attack_count ??
                                    0
                                )}
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-slate-500">
                                {formatNumber(
                                  node.total_flows ??
                                    node.flows ??
                                    node.flow_count ??
                                    0
                                )}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#090d12]">
                <div className="flex flex-col justify-between gap-3 border-b border-white/[0.05] px-6 py-5 md:flex-row md:items-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                      Attack Classification
                    </p>

                    <h2 className="mt-1 text-lg font-medium text-white">
                      Category Analysis
                    </h2>
                  </div>

                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      value={categorySearch}
                      onChange={(event) =>
                        setCategorySearch(
                          event.target.value
                        )
                      }
                      placeholder="Search category..."
                      className="w-48 rounded-lg border border-white/[0.06] bg-black/20 py-2 pl-8 pr-3 text-[10px] text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/20"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Category
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Total
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Detected
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Missed
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Recall
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCategories.map(
                        (category, index) => {
                          const total =
                            category.total ??
                            category.count ??
                            category.attack_count ??
                            0;

                          const detected =
                            category.detected ??
                            category.detected_count ??
                            0;

                          const missed =
                            category.missed ??
                            category.missed_count ??
                            Math.max(
                              0,
                              Number(total) -
                                Number(
                                  detected
                                )
                            );

                          const recall =
                            category.recall ??
                            (Number(total) > 0
                              ? Number(
                                  detected
                                ) /
                                Number(
                                  total
                                )
                              : 0);

                          return (
                            <tr
                              key={index}
                              className="border-b border-white/[0.03] last:border-0"
                            >
                              <td className="px-6 py-3 text-xs font-medium text-slate-300">
                                {String(
                                  category.category ??
                                    category.name ??
                                    "Unknown"
                                )}
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-slate-500">
                                {formatNumber(
                                  total
                                )}
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-emerald-400">
                                {formatNumber(
                                  detected
                                )}
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-red-400">
                                {formatNumber(
                                  missed
                                )}
                              </td>

                              <td className="px-6 py-3">
                                <span
                                  className={`font-mono text-[10px] ${
                                    Number(
                                      recall
                                    ) >=
                                    0.9
                                      ? "text-emerald-400"
                                      : "text-amber-400"
                                  }`}
                                >
                                  {formatPercent(
                                    recall
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* FLOW RESULTS */}
            {flows.length > 0 && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#090d12]">
                <div className="flex flex-col justify-between gap-3 border-b border-white/[0.05] px-6 py-5 md:flex-row md:items-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                      
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Detected Attack Networks</h3>
              <p className="mt-1 text-xs text-slate-500">
                Communication paths containing at least one model-detected attack flow.
              </p>
            </div>
          </div>
          {Array.isArray(flows) && flows.filter(
            (flow) => String(flow.prediction || "").toUpperCase() === "ATTACK"
          ).length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-500">
              No model-detected attack links in the evaluated traffic.
            </div>
          ) : (
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {Array.from(
                new Map(
                  (Array.isArray(flows) ? flows : [])
                    .filter(
                      (flow) =>
                        String(flow.prediction || "").toUpperCase() === "ATTACK"
                    )
                    .map((flow) => {
                      const source = flow.source_ip || flow.source || flow.src;
                      const destination =
                        flow.destination_ip || flow.destination || flow.dst;
                      return [
                        `${source}->${destination}`,
                        { source, destination },
                      ];
                    })
                ).values()
              )
                .slice(0, 12)
                .map((link) => (
                  <div
                    key={`${link.source}->${link.destination}`}
                    className="rounded-xl border border-red-500/20 bg-slate-950/60 px-4 py-3"
                  >
                    <div className="text-xs font-medium text-red-300">
                      {link.source}
                    </div>
                    <div className="my-1 text-[10px] text-slate-600">↓</div>
                    <div className="text-xs font-medium text-red-300">
                      {link.destination}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

Flow-Level Results
                    </p>

                    <h2 className="mt-1 text-lg font-medium text-white">
                      Network Traffic Detection
                    </h2>
                  </div>

                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      value={flowSearch}
                      onChange={(event) =>
                        setFlowSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search IP or result..."
                      className="w-56 rounded-lg border border-white/[0.06] bg-black/20 py-2 pl-8 pr-3 text-[10px] text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/20"
                    />
                  </div>
                </div>

                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="sticky top-0 bg-[#090d12]">
                      <tr className="border-b border-white/[0.05]">
                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          #
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Source
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Destination
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Prediction
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Score
                        </th>

                        <th className="px-6 py-3 text-[8px] uppercase tracking-wider text-slate-600">
                          Label
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredFlows.map(
                        (flow, index) => {
                          const prediction =
                            String(
                              flow.prediction ??
                                flow.result ??
                                ""
                            );

                          const attack =
                            prediction
                              .toLowerCase()
                              .includes(
                                "attack"
                              ) ||
                            prediction
                              .toLowerCase()
                              .includes(
                                "malicious"
                              );

                          return (
                            <tr
                              key={index}
                              className="border-b border-white/[0.03] last:border-0"
                            >
                              <td className="px-6 py-3 font-mono text-[9px] text-slate-700">
                                {index + 1}
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-slate-400">
                                {String(
                                  flow.source_ip ??
                                    flow.source ??
                                    "—"
                                )}
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-slate-400">
                                {String(
                                  flow.destination_ip ??
                                    flow.destination ??
                                    "—"
                                )}
                              </td>

                              <td className="px-6 py-3">
                                <span
                                  className={`rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-wider ${
                                    attack
                                      ? "border-red-400/15 bg-red-400/[0.05] text-red-400"
                                      : "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-400"
                                  }`}
                                >
                                  {prediction ||
                                    "BENIGN"}
                                </span>
                              </td>

                              <td className="px-6 py-3 font-mono text-[10px] text-cyan-400">
                                {formatScore(
                                  flow.attack_probability ??
                                    flow.probability ??
                                    flow.score
                                )}
                              </td>

                              <td className="px-6 py-3 text-[10px] text-slate-500">
                                {String(
                                  flow.label ??
                                    flow.ground_truth ??
                                    "—"
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-white/[0.05] px-6 py-3">
                  <p className="text-[9px] text-slate-700">
                    Showing{" "}
                    {formatNumber(
                      filteredFlows.length
                    )}{" "}
                    flow results
                  </p>
                </div>
              </section>
            )}

            {/* FOOTER NOTE */}
            <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.02] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-cyan-400"
                />

                <div>
                  <p className="text-xs font-medium text-cyan-300">
                    Enterprise Evaluation Method
                  </p>

                  <p className="mt-2 max-w-4xl text-[10px] leading-relaxed text-slate-600">
                    The uploaded network traffic is
                    converted into a communication graph,
                    transformed into the same feature
                    representation used during training,
                    normalized using the saved training
                    statistics, and evaluated using the
                    existing TemporalEdgeGNN and saved
                    decision threshold. The model is not
                    retrained on the uploaded enterprise
                    data.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default EnterpriseEvaluation;