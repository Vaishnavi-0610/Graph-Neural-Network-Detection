import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, BarChart3, BrainCircuit, CheckCircle2,
  Clock3, Crosshair, Database, Network, ShieldAlert, Target, TrendingUp, Zap
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const OVERALL = {
  accuracy: 99.68, precision: 99.89, recall: 99.32,
  f1: 99.60, rocAuc: 99.76, prAuc: 99.74,
};

const CONFUSION = {
  tn: 413968, fp: 307, fn: 1969, tp: 286954,
};

const CATEGORIES = [
  { name: "DDoS", flows: 128027, detected: 128024, missed: 3, recall: 99.9977, status: "DETECTED" },
  { name: "PortScan", flows: 158930, detected: 158930, missed: 0, recall: 100, status: "DETECTED" },
  { name: "Bot", flows: 1966, detected: 0, missed: 1966, recall: 0, status: "LIMITATION" },
];

const TRAINING_CATEGORIES = [
  { name: "FTP-Patator", flows: 7938 },
  { name: "SSH-Patator", flows: 5897 },
];

const TEST_DISTRIBUTION = [
  { name: "BENIGN", value: 414275 },
  { name: "DDoS", value: 128027 },
  { name: "PortScan", value: 158930 },
  { name: "Bot", value: 1966 },
];

const fmt = (v) => Number(v || 0).toLocaleString("en-US");
const pct = (v, d = 2) => `${Number(v || 0).toFixed(d)}%`;

function SectionHeader({ index, title, subtitle }) {
  return (
    <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-3">
      <div>
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.3em] text-red-400/80">{index}</div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-white">{title}</h2>
      </div>
      <div className="hidden text-right text-[9px] uppercase tracking-[0.16em] text-white/30 md:block">{subtitle}</div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, detail, delay = 0 }) {
  return (
    <motion.div
      className="cyber-panel relative overflow-hidden p-5"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="absolute left-0 top-0 h-px w-14 bg-red-500/80" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="cyber-kicker mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-red-500" />{label}
          </div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-white">
            {value}<span className="ml-1 text-lg text-white/45">%</span>
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/40">{detail}</div>
        </div>
        <div className="border border-white/10 p-2 text-white/45"><Icon size={17} strokeWidth={1.5} /></div>
      </div>
    </motion.div>
  );
}

function Bar({ value, max, label, count, muted = false }) {
  const width = Math.max(1, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
        <span className="text-white/65">{label}</span><span className="text-white/40">{fmt(count)}</span>
      </div>
      <div className="h-1 bg-white/5">
        <motion.div
          className={`h-full ${muted ? "bg-white/20" : "bg-cyan-400"}`}
          initial={{ width: 0 }} animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [apiState, setApiState] = useState("CHECKING");
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((data) => { if (active) { setHealth(data); setApiState("CONNECTED"); } })
      .catch(() => { if (active) setApiState("OFFLINE"); });
    return () => { active = false; };
  }, []);

  const totalTest = useMemo(() => TEST_DISTRIBUTION.reduce((s, x) => s + x.value, 0), []);
  const attackTotal = totalTest - TEST_DISTRIBUTION[0].value;
  const attackRate = (attackTotal / totalTest) * 100;
  const errorTotal = CONFUSION.fp + CONFUSION.fn;

  return (
    <div className="relative z-10 min-h-full px-4 pb-12 pt-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <motion.div className="mb-8 border-b border-white/10 pb-6"
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-red-400">SEC-ANALYTICS / 07</span>
              <span className="h-px w-10 bg-red-500/60" />
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">Research evaluation</span>
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2">
              <span className={`h-1.5 w-1.5 ${apiState === "CONNECTED" ? "bg-emerald-400" : apiState === "CHECKING" ? "bg-amber-400" : "bg-red-500"}`} />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">API {apiState}</span>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-mono text-2xl font-semibold uppercase tracking-[0.08em] text-white md:text-4xl">Detection Analytics</h1>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/40">
                Quantitative evaluation of the Edge-Aware GNN on the chronological CICIDS2017 test split, including unseen attack-category behavior.
              </p>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
              THRESHOLD <span className="text-white/70">0.67</span>
              <span className="mx-2 text-white/15">/</span>
              TEST FLOWS <span className="text-white/70">{fmt(totalTest)}</span>
            </div>
          </div>
        </motion.div>

        <section className="mb-10">
          <SectionHeader index="01" title="Performance summary" subtitle="FINAL TEST / THRESHOLD 0.67" />
          <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Accuracy" value={OVERALL.accuracy.toFixed(2)} icon={Target} detail="overall correctness" delay={0.05} />
            <MetricCard label="Precision" value={OVERALL.precision.toFixed(2)} icon={Crosshair} detail="attack predictions" delay={0.1} />
            <MetricCard label="Recall" value={OVERALL.recall.toFixed(2)} icon={TrendingUp} detail="attacks recovered" delay={0.15} />
            <MetricCard label="F1" value={OVERALL.f1.toFixed(2)} icon={Activity} detail="precision / recall" delay={0.2} />
            <MetricCard label="ROC-AUC" value={OVERALL.rocAuc.toFixed(2)} icon={BarChart3} detail="ranking quality" delay={0.25} />
            <MetricCard label="PR-AUC" value={OVERALL.prAuc.toFixed(2)} icon={Zap} detail="imbalanced setting" delay={0.3} />
          </div>
        </section>

        <section className="mb-10 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader index="02" title="Confusion matrix" subtitle="BENIGN / ATTACK" />
            <div className="grid grid-cols-[90px_1fr_1fr] gap-px bg-white/10 font-mono text-[9px]">
              <div className="bg-[#050505]" /><div className="bg-[#050505] p-3 text-center text-white/30">PRED BENIGN</div><div className="bg-[#050505] p-3 text-center text-red-300/60">PRED ATTACK</div>
              <div className="bg-[#050505] p-3 text-right text-white/30">ACT BENIGN</div>
              <div className="bg-[#050505] p-6 text-center"><div className="font-mono text-2xl text-white">{fmt(CONFUSION.tn)}</div><div className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/30">TN</div></div>
              <div className="bg-[#050505] p-6 text-center"><div className="font-mono text-2xl text-red-400">{fmt(CONFUSION.fp)}</div><div className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/30">FP</div></div>
              <div className="bg-[#050505] p-3 text-right text-red-300/50">ACT ATTACK</div>
              <div className="bg-[#050505] p-6 text-center"><div className="font-mono text-2xl text-red-400">{fmt(CONFUSION.fn)}</div><div className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/30">FN</div></div>
              <div className="bg-[#050505] p-6 text-center"><div className="font-mono text-2xl text-cyan-300">{fmt(CONFUSION.tp)}</div><div className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/30">TP</div></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="border border-white/5 p-3"><div className="text-[8px] uppercase tracking-[0.14em] text-white/30">Total errors</div><div className="mt-1 font-mono text-lg text-red-400">{fmt(errorTotal)}</div></div>
              <div className="border border-white/5 p-3"><div className="text-[8px] uppercase tracking-[0.14em] text-white/30">False positives</div><div className="mt-1 font-mono text-lg text-white">{fmt(CONFUSION.fp)}</div></div>
              <div className="border border-white/5 p-3"><div className="text-[8px] uppercase tracking-[0.14em] text-white/30">False negatives</div><div className="mt-1 font-mono text-lg text-red-400">{fmt(CONFUSION.fn)}</div></div>
            </div>
          </div>

          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader index="03" title="Test distribution" subtitle="703,198 FLOWS" />
            {TEST_DISTRIBUTION.map((item, i) => <Bar key={item.name} label={item.name} value={item.value} max={TEST_DISTRIBUTION[0].value} count={item.value} muted={i === 0} />)}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-white/5 p-4"><div className="text-[8px] uppercase tracking-[0.14em] text-white/30">Attack flows</div><div className="mt-1 font-mono text-xl text-red-400">{fmt(attackTotal)}</div></div>
              <div className="border border-white/5 p-4"><div className="text-[8px] uppercase tracking-[0.14em] text-white/30">Attack rate</div><div className="mt-1 font-mono text-xl text-white">{pct(attackRate)}</div></div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader index="04" title="Unseen attack-category evaluation" subtitle="TEST-ONLY CATEGORIES" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse font-mono text-[10px]">
                <thead><tr className="border-b border-white/10 text-left uppercase tracking-[0.14em] text-white/30">
                  <th className="px-3 py-3">Attack category</th><th className="px-3 py-3 text-right">Flows</th><th className="px-3 py-3 text-right">Detected</th><th className="px-3 py-3 text-right">Missed</th><th className="px-3 py-3 text-right">Recall</th><th className="px-3 py-3 text-right">Status</th>
                </tr></thead>
                <tbody>{CATEGORIES.map((row) => (
                  <tr key={row.name} className="border-b border-white/5 hover:bg-white/[0.025]">
                    <td className="px-3 py-4 text-white/75">{row.name}</td><td className="px-3 py-4 text-right text-white/55">{fmt(row.flows)}</td><td className="px-3 py-4 text-right text-cyan-300">{fmt(row.detected)}</td><td className="px-3 py-4 text-right text-red-400">{fmt(row.missed)}</td><td className="px-3 py-4 text-right text-white">{pct(row.recall, 4)}</td>
                    <td className="px-3 py-4 text-right"><span className={`border px-2 py-1 text-[8px] tracking-[0.14em] ${row.status === "LIMITATION" ? "border-red-500/30 text-red-400" : "border-cyan-400/20 text-cyan-300"}`}>{row.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
              <div className="border-l border-cyan-400/40 pl-4"><div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-cyan-300"><CheckCircle2 size={13} />Generalization evidence</div><p className="text-[11px] leading-5 text-white/40">DDoS and PortScan do not occur in the training attack categories, yet the trained model detects them in the held-out test split.</p></div>
              <div className="border-l border-red-500/50 pl-4"><div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-red-400"><AlertTriangle size={13} />Documented limitation</div><p className="text-[11px] leading-5 text-white/40">Bot is also unseen during training but receives zero detected flows. This is an important limitation rather than a result to hide.</p></div>
            </div>
          </div>
        </section>

        <section className="mb-10 grid gap-5 lg:grid-cols-2">
          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader index="05" title="Training attack exposure" subtitle="TRAINING SPLIT" />
            <div className="grid gap-3 sm:grid-cols-2">{TRAINING_CATEGORIES.map((item) => (
              <div key={item.name} className="border border-white/5 p-5"><div className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/35">ATTACK CATEGORY</div><div className="font-mono text-sm text-white/80">{item.name}</div><div className="mt-4 font-mono text-2xl text-cyan-300">{fmt(item.flows)}</div><div className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/25">training flows</div></div>
            ))}</div>
          </div>

          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader index="06" title="Evaluation context" subtitle="MODEL / DATASET" />
            <div className="grid grid-cols-2 gap-px bg-white/10">
              {[
                ["Dataset", "CICIDS2017", Database], ["Architecture", "Edge-Aware GNN", BrainCircuit],
                ["Test flows", fmt(totalTest), Activity], ["Threshold", "0.67", Crosshair],
                ["Test windows", "98", Clock3], ["Unique IPs", "19,129", Network],
              ].map(([label, value, Icon]) => (
                <div key={label} className="bg-[#050505] p-4"><div className="mb-2 flex items-center gap-2 text-white/30"><Icon size={13} /><span className="font-mono text-[8px] uppercase tracking-[0.14em]">{label}</span></div><div className="font-mono text-sm text-white/75">{value}</div></div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="cyber-panel border-red-500/20 p-5 md:p-6">
            <SectionHeader index="07" title="Research interpretation" subtitle="FACTUAL SUMMARY" />
            <div className="grid gap-6 md:grid-cols-3">
              <div><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-cyan-300"><ShieldAlert size={13} />Generalization</div><p className="text-[11px] leading-5 text-white/45">The final test split contains attack categories absent from the training attack categories. DDoS and PortScan are detected at very high recall, while Bot is not detected.</p></div>
              <div><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/55"><Network size={13} />Graph context</div><p className="text-[11px] leading-5 text-white/45">The model represents communication as directed source-to-destination edges with node context and edge-level flow features.</p></div>
              <div><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-red-400"><AlertTriangle size={13} />Limitation</div><p className="text-[11px] leading-5 text-white/45">The current implementation is edge-aware with chronological graph snapshots; it should not be described as a fully temporal GNN because edge timestamps are not used directly in message passing.</p></div>
            </div>
          </div>
        </section>

        {health && <div className="mt-5 text-right font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">ENGINE {health.model || "GNN"} / DEVICE {health.device || "UNKNOWN"} / INFERENCE {health.inference_ready ? "READY" : "NOT READY"}</div>}
      </div>
    </div>
  );
}