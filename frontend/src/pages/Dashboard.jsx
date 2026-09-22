import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Crosshair,
  Gauge,
  Network,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import NetworkGraph from "../components/NetworkGraph";

const trafficData = [
  { time: "00:00", flows: 42 },
  { time: "04:00", flows: 58 },
  { time: "08:00", flows: 91 },
  { time: "12:00", flows: 74 },
  { time: "16:00", flows: 112 },
  { time: "20:00", flows: 86 },
  { time: "23:59", flows: 101 },
];

const metrics = [
  {
    title: "Test Accuracy",
    value: "99.68%",
    description: "Overall classification accuracy",
    icon: Target,
    positive: true,
  },
  {
    title: "Precision",
    value: "99.89%",
    description: "Attack prediction precision",
    icon: Crosshair,
    positive: true,
  },
  {
    title: "Recall",
    value: "99.32%",
    description: "Attack detection recall",
    icon: Activity,
    positive: true,
  },
  {
    title: "F1 Score",
    value: "99.60%",
    description: "Balanced detection score",
    icon: Gauge,
    positive: true,
  },
];

const unseenCategories = [
  {
    name: "PortScan",
    recall: "100.00%",
    detected: "158,930",
    missed: "0",
    status: "Excellent",
  },
  {
    name: "DDoS",
    recall: "99.9977%",
    detected: "128,024",
    missed: "3",
    status: "Excellent",
  },
  {
    name: "Bot",
    recall: "0.00%",
    detected: "0",
    missed: "1,966",
    status: "Missed",
  },
];

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="group cyber-summary-card group">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06]">
          <Icon size={19} className="text-cyan-400" />
        </div>

        <ArrowUpRight
          size={16}
          className="text-slate-700 transition group-hover:text-cyan-400"
        />
      </div>

      <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-400">
        {item.title}
      </p>

      <p
        className="mt-1 text-3xl font-semibold tracking-tight text-white"
        aria-label={`${item.title}: ${item.value}`}
      >
        {item.value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {item.description}
      </p>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-400">
              GNN Security Engine
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Security Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Edge-aware graph neural network for CICIDS2017 network intrusion
            detection and unseen attack-category evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3">
          <CheckCircle2 size={17} className="text-emerald-400" />

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              System Status
            </p>
            <p className="mt-0.5 text-sm font-medium text-emerald-400">
              Operational
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </section>

      {/* ACTUAL CICIDS2017 NETWORK TOPOLOGY */}
      <section className="mt-1">
        <NetworkGraph />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="cyber-summary-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Network Activity
              </p>
              <h2 className="mt-1 text-lg font-medium text-white">
                Flow Processing Overview
              </h2>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-2">
              <Activity size={14} className="text-cyan-400" />
              <span className="text-[10px] uppercase tracking-wider text-cyan-400">
                Live Engine
              </span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient
                    id="flowGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#22d3ee"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#22d3ee"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#080c11",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="flows"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#flowGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cyber-summary-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
              <BrainCircuit size={20} className="text-cyan-400" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Model
              </p>
              <h2 className="text-lg font-medium text-white">
                TemporalEdgeGNN
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              ["Graph Nodes", "19,129"],
              ["Context Edges", "62,538"],
              ["Node Features", "12"],
              ["Edge Features", "15"],
              ["Parameters", "35,137"],
              ["Decision Threshold", "0.67"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-white/[0.05] py-2.5 last:border-0"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <span className="font-mono text-xs text-slate-200">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-3">
            <Network size={15} className="text-cyan-400" />
            <span className="text-xs text-slate-400">
              Edge-aware message passing enabled
            </span>
          </div>
        </div>
      </section>

      <section className="cyber-summary-card p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Generalization
            </p>
            <h2 className="mt-1 text-lg font-medium text-white">
              Unseen Attack Categories
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle size={14} className="text-amber-400" />
            Evaluated on categories absent from training
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {unseenCategories.map((category) => (
            <div
              key={category.name}
              className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {category.name}
                </span>

                <span
                  className={`text-[9px] uppercase tracking-wider ${
                    category.status === "Missed"
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {category.status}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Recall
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {category.recall}
                  </p>
                </div>

                <div className="text-right text-[10px] text-slate-500">
                  <p>Detected {category.detected}</p>
                  <p className="mt-1">Missed {category.missed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                Test Set
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                703,198
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-5">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-cyan-400" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                Inference
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                CPU Ready
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#090d12] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-400" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                Research Finding
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                Bot Recall 0%
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;