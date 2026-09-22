import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Eye, ShieldCheck, Target, TestTube2, Play, RefreshCw, Route } from "lucide-react";

const trainingCategories = [
  { name: "FTP-Patator", flows: 7938 },
  { name: "SSH-Patator", flows: 5897 },
];

const unseenCategories = [
  { name: "DDoS", flows: 128027, detected: 128024, missed: 3, recall: 99.9977 },
  { name: "PortScan", flows: 158930, detected: 158930, missed: 0, recall: 100 },
  { name: "Bot", flows: 1966, detected: 0, missed: 1966, recall: 0 },
];

const overallMetrics = [
  ["Accuracy", "99.68%"],
  ["Precision", "99.89%"],
  ["Recall", "99.32%"],
  ["F1 Score", "99.60%"],
  ["ROC-AUC", "99.76%"],
  ["PR-AUC", "99.74%"],
];

function Metric({ label, value }) {
  return (
    <div className="border border-white/10 bg-black/45 p-4">
      <p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-white text-2xl">{value}</p>
    </div>
  );
}

export default function ResearchResults() {
  const [lateral, setLateral] = useState(null);
  const [loadingLateral, setLoadingLateral] = useState(false);
  const [lateralError, setLateralError] = useState("");

  async function runLateralEvaluation() {
    setLoadingLateral(true);
    setLateralError("");
    try {
      const response = await fetch("http://127.0.0.1:8000/lateral-movement-evaluation");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setLateral(data);
    } catch (error) {
      setLateralError(error.message || "Unable to run lateral-movement evaluation.");
    } finally {
      setLoadingLateral(false);
    }
  }

  const lateralMetrics = lateral?.metrics || {};
  const lateralSimulation = lateral?.simulation || {};
  const movementCategory = (lateral?.categories || []).find(
    (item) => item.name === "Simulated-Lateral-Movement"
  );

  return (
    <div className="relative z-10 space-y-6">
      <section className="border border-white/10 bg-black/55 p-6 lg:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-cyan-400">
              <TestTube2 size={15} /> Research Evaluation / CICIDS2017
            </div>
            <h1>Unseen Attack-Category Evaluation</h1>
            <p className="mt-5 max-w-4xl text-[11px] leading-6 text-slate-500">
              Evaluate whether the trained Edge-Aware GNN generalizes to malicious categories that were absent from its training attack set. This is reported as unseen attack-category generalization / zero-day-style evaluation.
            </p>
          </div>
          <div className="border border-cyan-400/20 bg-cyan-400/[0.035] px-5 py-4">
            <p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Decision threshold</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-400">0.67</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {overallMetrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
      </section>

      <section className="border border-red-400/15 bg-black/55 p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <Target className="text-red-400" size={20} />
          <div>
            <h2 className="text-lg text-white">Original Research Objectives</h2>
            <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-600">Objective coverage / final implementation</p>
          </div>
        </div>
        <div className="mt-6 grid gap-px border border-white/[0.06] bg-white/[0.06] md:grid-cols-2">
          {[
            ["01", "Model enterprise activity as a graph", "COMPLETE", "Hosts/IPs are represented as nodes and communication flows as directed edges."],
            ["02", "Simulate lateral-movement activity", "COMPLETE", "A deterministic, non-executing benchmark creates directed multi-hop internal movement sequences."],
            ["03", "Train a Graph Neural Network", "COMPLETE", "The trained Edge-Aware GNN performs edge-level benign/attack classification."],
            ["04", "Evaluate unseen lateral-movement activity", "COMPLETE", "The existing trained detector is evaluated on the separate simulated movement category without retraining."],
          ].map(([number, title, status, description]) => (
            <div key={number} className="bg-black/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] text-red-400">{number}</span>
                <span className="border border-emerald-400/20 px-2 py-1 text-[7px] uppercase tracking-[0.16em] text-emerald-400">{status}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[9px] leading-5 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-l-2 border-cyan-400/50 pl-4 text-[9px] leading-5 text-slate-500">
          Research wording: <span className="text-slate-300">synthetic lateral-movement benchmark and zero-day-style evaluation</span>. This does not claim that the synthetic benchmark represents real-world lateral-movement traffic.
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="border border-white/10 bg-black/55 p-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-cyan-400" size={20} />
            <div>
              <h2 className="text-lg text-white">Training attack categories</h2>
              <p className="mt-1 text-[9px] text-slate-600">Attack labels available during model training</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {trainingCategories.map((item) => (
              <div key={item.name} className="flex items-center justify-between border border-white/[0.07] bg-white/[0.015] px-4 py-4">
                <div className="flex items-center gap-3"><CheckCircle2 size={15} className="text-emerald-400" /><span className="text-[11px] text-slate-300">{item.name}</span></div>
                <span className="text-[10px] text-slate-500">{item.flows.toLocaleString()} flows</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-l-2 border-cyan-400/60 bg-cyan-400/[0.025] p-4 text-[9px] leading-5 text-slate-500">
            Test-only categories below were not part of this training attack set.
          </div>
        </div>

        <div className="border border-white/10 bg-black/55 p-6">
          <div className="flex items-center gap-3">
            <Eye className="text-red-400" size={20} />
            <div>
              <h2 className="text-lg text-white">Test-only attack categories</h2>
              <p className="mt-1 text-[9px] text-slate-600">Previously unseen attack-category evaluation</p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {unseenCategories.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <div><p className="text-[11px] font-semibold text-white">{item.name}</p><p className="mt-1 text-[8px] text-slate-600">{item.flows.toLocaleString()} test attack flows</p></div>
                  <p className={`text-xl font-semibold ${item.recall === 0 ? "text-red-400" : "text-cyan-400"}`}>{item.recall.toFixed(4)}%</p>
                </div>
                <div className="h-2 overflow-hidden bg-white/[0.05]"><motion.div initial={{ width: 0 }} animate={{ width: `${item.recall}%` }} transition={{ duration: 0.8 }} className={`h-full ${item.recall === 0 ? "bg-red-500" : "bg-cyan-400"}`} /></div>
                <div className="mt-2 flex justify-between text-[8px] text-slate-600"><span>Detected {item.detected.toLocaleString()}</span><span>Missed {item.missed.toLocaleString()}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border border-white/10 bg-black/55 p-6">
        <div className="flex items-center gap-3"><Target className="text-cyan-400" size={20} /><h2 className="text-lg text-white">Category-level generalization</h2></div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead><tr className="border-b border-white/10 text-left"><th className="py-3">Category</th><th>Seen in training?</th><th>Test flows</th><th>Detected</th><th>Missed</th><th>Recall</th></tr></thead>
            <tbody>{unseenCategories.map((item) => <tr key={item.name} className="border-b border-white/[0.055]"><td className="py-4 text-white">{item.name}</td><td className="text-red-400">NO</td><td>{item.flows.toLocaleString()}</td><td>{item.detected.toLocaleString()}</td><td>{item.missed.toLocaleString()}</td><td className={item.recall === 0 ? "text-red-400" : "text-cyan-400"}>{item.recall.toFixed(4)}%</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="border border-emerald-400/20 bg-emerald-400/[0.025] p-6">
          <div className="flex items-center gap-3 text-emerald-400"><ShieldCheck size={20} /><h2 className="text-lg">Key research finding</h2></div>
          <p className="mt-4 text-[10px] leading-6 text-slate-400">The model generalized strongly to unseen DDoS and PortScan traffic. DDoS recall reached 99.9977% and PortScan recall reached 100%, despite those attack categories not being present in the training attack set.</p>
        </div>
        <div className="border border-red-400/20 bg-red-400/[0.025] p-6">
          <div className="flex items-center gap-3 text-red-400"><AlertTriangle size={20} /><h2 className="text-lg">Observed limitation</h2></div>
          <p className="mt-4 text-[10px] leading-6 text-slate-400">Bot remains a challenging unseen category: 1,966 Bot attack flows were evaluated and none crossed the selected detection threshold. This limitation is retained as part of the research result.</p>
        </div>
      </section>

      <section className="border border-white/10 bg-black/55 p-6">
        <div className="flex items-center gap-3"><Activity className="text-cyan-400" size={20} /><h2 className="text-lg text-white">Evaluation interpretation</h2></div>
        <p className="mt-4 max-w-5xl text-[10px] leading-6 text-slate-500">This experiment demonstrates generalization to attack categories excluded from the training attack set. It is therefore presented as <span className="text-white">unseen attack-category generalization / zero-day-style evaluation</span>, rather than claiming formal detection of arbitrary real-world zero-day vulnerabilities.</p>
      </section>
      <section className="border border-red-400/15 bg-black/55 p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-red-400">
              <Route size={15} /> Objective 2 / Objective 4
            </div>
            <h2 className="text-xl text-white">Synthetic Lateral-Movement Evaluation</h2>
            <p className="mt-3 max-w-4xl text-[10px] leading-6 text-slate-500">
              A controlled benchmark generates labelled internal host-to-host communication sequences and evaluates the existing trained GNN without retraining. The simulator does not execute attacks or generate live traffic.
            </p>
          </div>
          <button
            type="button"
            onClick={runLateralEvaluation}
            disabled={loadingLateral}
            className="inline-flex shrink-0 items-center justify-center gap-2 border border-red-400/30 bg-red-400/[0.05] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-400/[0.1] disabled:cursor-wait disabled:opacity-60"
          >
            {loadingLateral ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {loadingLateral ? "Running benchmark" : "Run evaluation"}
          </button>
        </div>

        {lateralError && (
          <div className="mt-5 border border-red-400/20 bg-red-400/[0.04] p-4 text-[9px] leading-5 text-red-300">
            {lateralError}
          </div>
        )}

        {lateral && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Scenarios" value={Number(lateralSimulation.scenarios || 0).toLocaleString()} />
              <Metric label="Benchmark flows" value={Number(lateralSimulation.flows || 0).toLocaleString()} />
              <Metric label="Movement flows" value={Number(lateralSimulation.lateral_movement_flows || 0).toLocaleString()} />
              <Metric label="Nodes" value={Number(lateralSimulation.nodes || 0).toLocaleString()} />
              <Metric label="Detection recall" value={`${((Number(lateralMetrics.recall || 0)) * 100).toFixed(2)}%`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="border border-white/[0.07] bg-white/[0.012] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Synthetic movement result</p>
                    <p className="mt-2 text-sm font-semibold text-white">Simulated-Lateral-Movement</p>
                  </div>
                  <span className="border border-red-400/20 px-3 py-1 text-[8px] uppercase tracking-[0.16em] text-red-300">Unseen category</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric label="TP" value={Number(lateralMetrics.true_positive || 0).toLocaleString()} />
                  <Metric label="FN" value={Number(lateralMetrics.false_negative || 0).toLocaleString()} />
                  <Metric label="Precision" value={`${((Number(lateralMetrics.precision || 0)) * 100).toFixed(2)}%`} />
                  <Metric label="F1" value={`${((Number(lateralMetrics.f1 || 0)) * 100).toFixed(2)}%`} />
                </div>
                {movementCategory && (
                  <p className="mt-4 text-[9px] text-slate-600">
                    Detected {Number(movementCategory.detected || 0).toLocaleString()} of {Number(movementCategory.total || 0).toLocaleString()} labelled movement flows.
                  </p>
                )}
              </div>

              <div className="border border-cyan-400/10 bg-cyan-400/[0.018] p-5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-400">Research interpretation</p>
                <p className="mt-3 text-[10px] leading-6 text-slate-400">
                  The benchmark tests whether the existing detector responds to a new movement category and directed internal communication pattern. Results are reported as an experimental zero-day-style evaluation, not as evidence of real-world zero-day detection.
                </p>
                <div className="mt-4 border-l-2 border-cyan-400/50 pl-3 text-[9px] leading-5 text-slate-600">
                  Feature profiles are derived from the saved CICIDS2017 training-context feature space and lightly perturbed.
                </div>
              </div>
            </div>

            <div className="border border-white/[0.06] bg-white/[0.012] p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Simulated communication paths</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {(lateralSimulation.scenario_paths || []).slice(0, 6).map((scenario) => (
                  <div key={scenario.scenario_id} className="border border-white/[0.06] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-[0.16em] text-slate-600">Scenario {scenario.scenario_id}</span>
                      <span className="text-[8px] text-red-400">{scenario.hops} hops</span>
                    </div>
                    <p className="mt-2 font-mono text-[9px] text-slate-400">{scenario.path.join(" → ")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
