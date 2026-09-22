import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  GitBranch,
  Loader2,
  Play,
  ShieldAlert,
  Target,
  Terminal,
  XCircle,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

/* =========================================================
   SIMULATION SCENARIOS
========================================================= */

const scenarios = [
  {
    id: "SC-01",
    path: ["10.42.1.1", "10.42.1.2", "10.42.1.3", "10.42.1.4"],
    hops: 3,
  },
  {
    id: "SC-02",
    path: ["10.42.2.1", "10.42.2.2", "10.42.2.3", "10.42.2.4"],
    hops: 3,
  },
  {
    id: "SC-03",
    path: ["10.42.3.1", "10.42.3.2", "10.42.3.3", "10.42.3.4"],
    hops: 3,
  },
  {
    id: "SC-04",
    path: ["10.42.4.1", "10.42.4.2", "10.42.4.3", "10.42.4.4"],
    hops: 3,
  },
  {
    id: "SC-05",
    path: ["10.42.5.1", "10.42.5.2", "10.42.5.3", "10.42.5.4"],
    hops: 3,
  },
  {
    id: "SC-06",
    path: ["10.42.6.1", "10.42.6.2", "10.42.6.3", "10.42.6.4"],
    hops: 3,
  },
  {
    id: "SC-07",
    path: ["10.42.7.1", "10.42.7.2", "10.42.7.3", "10.42.7.4"],
    hops: 3,
  },
  {
    id: "SC-08",
    path: ["10.42.8.1", "10.42.8.2", "10.42.8.3", "10.42.8.4"],
    hops: 3,
  },
  {
    id: "SC-09",
    path: ["10.42.9.1", "10.42.9.2", "10.42.9.3", "10.42.9.4"],
    hops: 3,
  },
  {
    id: "SC-10",
    path: ["10.42.10.1", "10.42.10.2", "10.42.10.3", "10.42.10.4"],
    hops: 3,
  },
  {
    id: "SC-11",
    path: ["10.42.11.1", "10.42.11.2", "10.42.11.3", "10.42.11.4"],
    hops: 3,
  },
  {
    id: "SC-12",
    path: ["10.42.12.1", "10.42.12.2", "10.42.12.3", "10.42.12.4"],
    hops: 3,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return Number(value).toLocaleString();
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return `${(number * 100).toFixed(2)}%`;
}

/*
 * Read a value from several possible backend field names.
 *
 * This protects the frontend if the backend returns:
 *
 * TP
 * tp
 * true_positive
 * true_positives
 *
 * etc.
 */
function readValue(object, keys) {
  if (!object) {
    return null;
  }

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== null &&
      object[key] !== undefined
    ) {
      return object[key];
    }
  }

  return null;
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({ number, children }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-[0.22em] text-red-500">
        {number}
      </span>

      <span className="h-px w-8 bg-red-600/60" />

      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {children}
      </span>
    </div>
  );
}

/* =========================================================
   METRIC BOX
========================================================= */

function MetricBox({
  label,
  value,
  sublabel,
  danger = false,
}) {
  return (
    <div className="relative overflow-hidden border border-white/10 bg-black/60 px-5 py-5">
      <div className="absolute left-0 top-0 h-px w-8 bg-red-600" />

      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>

      <div
        className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${
          danger ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </div>

      {sublabel && (
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
          {sublabel}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SCENARIO CARD
========================================================= */

function ScenarioCard({ scenario, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.025,
      }}
      className="group relative border border-white/10 bg-black/50 p-4 transition-colors hover:border-red-600/50"
    >
      <div className="absolute left-0 top-0 h-full w-px bg-red-600/50 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={13} className="text-red-500" />

          <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-white">
            {scenario.id}
          </span>
        </div>

        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
          {scenario.hops} HOPS
        </span>
      </div>

      <div className="space-y-2">
        {scenario.path.map((ip, index) => (
          <div
            key={ip}
            className="flex items-center gap-2"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                index === 0
                  ? "bg-cyan-400"
                  : index === scenario.path.length - 1
                    ? "bg-red-500"
                    : "bg-zinc-600"
              }`}
            />

            <span className="font-mono text-[11px] text-zinc-300">
              {ip}
            </span>

            {index < scenario.path.length - 1 && (
              <ArrowRight
                size={11}
                className="ml-auto text-zinc-700"
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* =========================================================
   RESULT BADGE
========================================================= */

function ResultBadge({ detected }) {
  return (
    <div
      className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${
        detected
          ? "border-red-500/30 bg-red-500/5 text-red-400"
          : "border-zinc-700 bg-zinc-900/50 text-zinc-500"
      }`}
    >
      {detected ? (
        <CheckCircle2 size={11} />
      ) : (
        <AlertTriangle size={11} />
      )}

      {detected ? "DETECTION OBSERVED" : "NO DETECTION"}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function LateralMovement() {
  const [evaluation, setEvaluation] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  /* =======================================================
     RUN EVALUATION
  ======================================================= */

  const runLateralEvaluation = async () => {
    setRunning(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/lateral-movement-evaluation`
      );

      if (!response.ok) {
        throw new Error(
          `Evaluation failed with HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "LATERAL MOVEMENT API RESPONSE:",
        data
      );

      if (
        data.status &&
        String(data.status).toUpperCase() !== "SUCCESS"
      ) {
        throw new Error(
          data.message ||
            "Lateral movement evaluation failed."
        );
      }

      setEvaluation(data);
      setApiStatus("connected");
    } catch (err) {
      console.error(
        "Lateral movement evaluation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to run lateral movement evaluation."
      );

      setApiStatus("disconnected");
    } finally {
      setRunning(false);
    }
  };

  /* =======================================================
     CHECK API + AUTOMATICALLY LOAD EVALUATION
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadEvaluation = async () => {
      try {
        const healthResponse = await fetch(
          `${API_BASE}/health`
        );

        if (!healthResponse.ok) {
          throw new Error("Backend unavailable.");
        }

        if (mounted) {
          setApiStatus("connected");
        }

        /*
         * Automatically run the evaluation when the page opens.
         *
         * This is the important fix:
         * The user no longer needs to click the button
         * before TP/FN/Recall/etc. are populated.
         */
        await runLateralEvaluation();
      } catch (err) {
        if (mounted) {
          console.error(err);
          setApiStatus("disconnected");
        }
      }
    };

    loadEvaluation();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     EXTRACT API DATA
  ======================================================= */

  const metrics = evaluation?.metrics || {};

  /*
   * Some versions of the evaluator can expose the confusion
   * matrix separately, so check both locations.
   */
  const confusion =
    evaluation?.confusion_matrix ||
    evaluation?.confusionMatrix ||
    {};

  const tpRaw = readValue(metrics, [
    "TP",
    "tp",
    "True Positive",
    "true_positive",
    "true_positives",
  ]);

  const fnRaw = readValue(metrics, [
    "FN",
    "fn",
    "False Negative",
    "false_negative",
    "false_negatives",
  ]);

  const tnRaw =
    readValue(metrics, [
      "TN",
      "tn",
      "True Negative",
      "true_negative",
      "true_negatives",
    ]) ??
    readValue(confusion, [
      "TN",
      "tn",
      "True Negative",
      "true_negative",
    ]);

  const fpRaw =
    readValue(metrics, [
      "FP",
      "fp",
      "False Positive",
      "false_positive",
      "false_positives",
    ]) ??
    readValue(confusion, [
      "FP",
      "fp",
      "False Positive",
      "false_positive",
    ]);

  const precisionRaw = readValue(metrics, [
    "precision",
    "Precision",
  ]);

  const recallRaw = readValue(metrics, [
    "recall",
    "Recall",
    "sensitivity",
  ]);

  const f1Raw = readValue(metrics, [
    "f1",
    "F1",
    "f1_score",
    "F1 Score",
  ]);

  /*
   * If TP/FN are available but recall isn't, calculate it.
   */
  const calculatedRecall =
    recallRaw !== null
      ? Number(recallRaw)
      : tpRaw !== null &&
          fnRaw !== null &&
          Number(tpRaw) + Number(fnRaw) > 0
        ? Number(tpRaw) /
          (Number(tpRaw) + Number(fnRaw))
        : null;

  /*
   * If TP/FP are available but precision isn't, calculate it.
   */
  const calculatedPrecision =
    precisionRaw !== null
      ? Number(precisionRaw)
      : tpRaw !== null &&
          fpRaw !== null &&
          Number(tpRaw) + Number(fpRaw) > 0
        ? Number(tpRaw) /
          (Number(tpRaw) + Number(fpRaw))
        : null;

  /*
   * Calculate F1 if backend doesn't explicitly provide it.
   */
  const calculatedF1 =
    f1Raw !== null
      ? Number(f1Raw)
      : calculatedPrecision !== null &&
          calculatedRecall !== null &&
          calculatedPrecision + calculatedRecall > 0
        ? (2 *
            calculatedPrecision *
            calculatedRecall) /
          (calculatedPrecision + calculatedRecall)
        : null;

  const tp =
    tpRaw !== null ? Number(tpRaw) : null;

  const fn =
    fnRaw !== null ? Number(fnRaw) : null;

  const tn =
    tnRaw !== null ? Number(tnRaw) : null;

  const fp =
    fpRaw !== null ? Number(fpRaw) : null;

  const precision = calculatedPrecision;
  const recall = calculatedRecall;
  const f1 = calculatedF1;

  /* =======================================================
     BENCHMARK VALUES
  ======================================================= */

  const benchmarkFlows =
    evaluation?.total_flows ??
    evaluation?.original_flows ??
    240;

  const benchmarkNodes =
    evaluation?.total_nodes ??
    60;

  const movementFlows =
    tp !== null && fn !== null
      ? tp + fn
      : evaluation?.movement_flows ??
        evaluation?.attack_flows ??
        120;

  const detectedMovementFlows =
    tp !== null ? tp : null;

  const predictedAttackRate =
    evaluation?.attack_rate !== undefined &&
    evaluation?.attack_rate !== null
      ? Number(evaluation.attack_rate)
      : null;

  const groundTruthMovementRate =
    benchmarkFlows > 0
      ? movementFlows / benchmarkFlows
      : null;

  const detectedSomething =
    tp !== null && tp > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <motion.header
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          className="border-b border-white/10 pb-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-3">

                <div className="h-2 w-2 bg-red-500 shadow-[0_0_12px_rgba(220,38,38,0.7)]" />

                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-red-500">
                  RESEARCH OBJECTIVE / 02
                </span>

              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                Lateral Movement
              </h1>

              <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-zinc-500">
                Controlled synthetic enterprise movement
                benchmark. The simulator creates labelled
                graph-flow records only; it does not execute
                attacks or generate live network traffic.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">

              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em]">

                <span
                  className={`h-1.5 w-1.5 ${
                    apiStatus === "connected"
                      ? "bg-emerald-400"
                      : apiStatus === "disconnected"
                        ? "bg-red-500"
                        : "bg-yellow-400"
                  }`}
                />

                <span className="text-zinc-500">
                  API{" "}
                  {apiStatus === "connected"
                    ? "CONNECTED"
                    : apiStatus === "disconnected"
                      ? "DISCONNECTED"
                      : "CHECKING"}
                </span>

              </div>

              <button
                type="button"
                onClick={runLateralEvaluation}
                disabled={running}
                className="group inline-flex items-center gap-3 border border-red-600/70 bg-red-600/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-red-400 transition-all hover:border-red-500 hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {running ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Play size={14} />
                )}

                {running
                  ? "RUNNING..."
                  : "RUN LATERAL EVALUATION"}

              </button>

            </div>

          </div>
        </motion.header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-6 border border-red-500/30 bg-red-500/5 px-5 py-4"
          >

            <div className="flex items-start gap-3">

              <XCircle
                size={16}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div>

                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-400">
                  Evaluation Error
                </div>

                <div className="mt-1 font-mono text-[11px] leading-5 text-zinc-500">
                  {error}
                </div>

              </div>

            </div>

          </motion.div>
        )}

        {/* =================================================
            OBJECTIVE 02
        ================================================= */}

        <section className="mt-10">

          <SectionLabel number="OBJECTIVE 02">
            Simulate lateral-movement activity
          </SectionLabel>

          <div className="mb-6 max-w-4xl">

            <p className="font-mono text-[11px] leading-6 text-zinc-500">
              Twelve deterministic scenarios create directed
              internal host-to-host sequences across private
              10.42.x.x hosts. Each scenario contains benign
              background traffic and labelled movement flows,
              providing a reproducible graph benchmark for the
              existing detector.
            </p>

          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">

            <MetricBox
              label="Scenarios"
              value={scenarios.length}
              sublabel="deterministic paths"
            />

            <MetricBox
              label="Benchmark flows"
              value={formatNumber(benchmarkFlows)}
              sublabel="synthetic records"
            />

            <MetricBox
              label="Movement flows"
              value={formatNumber(movementFlows)}
              sublabel="labelled movement"
            />

            <MetricBox
              label="Nodes"
              value={formatNumber(benchmarkNodes)}
              sublabel="private hosts"
            />

          </div>

        </section>

        {/* =================================================
            EVALUATION
        ================================================= */}

        <section className="mt-12">

          <SectionLabel number="EVALUATION">
            Synthetic lateral-movement result
          </SectionLabel>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">

            {/* LEFT */}
            <div className="border border-white/10 bg-black/60 p-6">

              <div className="flex items-start justify-between gap-5">

                <div>

                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                    Evaluation category
                  </div>

                  <div className="mt-2 font-mono text-sm tracking-[0.04em] text-white">
                    Simulated-Lateral-Movement
                  </div>

                  <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-red-500">
                    Unseen category
                  </div>

                </div>

                {evaluation && (
                  <ResultBadge
                    detected={detectedSomething}
                  />
                )}

              </div>

              <div className="mt-7 grid grid-cols-2 gap-px bg-white/10">

                <MetricBox
                  label="TP"
                  value={
                    tp !== null
                      ? formatNumber(tp)
                      : "—"
                  }
                  sublabel="true positives"
                  danger={tp !== null && tp > 0}
                />

                <MetricBox
                  label="FN"
                  value={
                    fn !== null
                      ? formatNumber(fn)
                      : "—"
                  }
                  sublabel="missed movement"
                />

                <MetricBox
                  label="Precision"
                  value={formatPercent(precision)}
                  sublabel="attack predictions"
                />

                <MetricBox
                  label="Recall"
                  value={formatPercent(recall)}
                  sublabel="movement detected"
                  danger={
                    recall !== null &&
                    recall < 0.5
                  }
                />

                <MetricBox
                  label="F1"
                  value={formatPercent(f1)}
                  sublabel="harmonic mean"
                />

                <MetricBox
                  label="Predicted attack rate"
                  value={formatPercent(
                    predictedAttackRate
                  )}
                  sublabel="model output"
                />

              </div>

            </div>

            {/* RIGHT */}
            <div className="border border-white/10 bg-black/60 p-6">

              <div className="flex items-center gap-3">

                <Target
                  size={16}
                  className="text-red-500"
                />

                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Detection summary
                </span>

              </div>

              <div className="mt-7">

                <div className="flex items-end justify-between">

                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    Movement detection
                  </span>

                  <span className="font-mono text-2xl text-white">
                    {formatPercent(recall)}
                  </span>

                </div>

                <div className="mt-3 h-1 bg-white/10">

                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(recall || 0) *
                            100
                        )
                      )}%`,
                    }}
                    transition={{
                      duration: 0.8,
                    }}
                    className="h-full bg-red-600"
                  />

                </div>

              </div>

              <div className="mt-8 border-l border-red-600/50 pl-4">

                <p className="font-mono text-[11px] leading-6 text-zinc-500">

                  Detected{" "}

                  <span className="text-white">
                    {detectedMovementFlows !== null
                      ? formatNumber(
                          detectedMovementFlows
                        )
                      : "—"}
                  </span>

                  {" "}of{" "}

                  <span className="text-white">
                    {formatNumber(movementFlows)}
                  </span>

                  {" "}labelled movement flows.

                </p>

              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">

                <div className="border border-white/10 p-4">

                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
                    Ground-truth movement rate
                  </div>

                  <div className="mt-2 font-mono text-lg text-zinc-300">
                    {formatPercent(
                      groundTruthMovementRate
                    )}
                  </div>

                </div>

                <div className="border border-white/10 p-4">

                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
                    Processing time
                  </div>

                  <div className="mt-2 font-mono text-lg text-zinc-300">
                    {evaluation?.processing_time_ms !==
                    undefined
                      ? `${Number(
                          evaluation.processing_time_ms
                        ).toFixed(2)} ms`
                      : "—"}
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            INTERPRETATION
        ================================================= */}

        <section className="mt-12">

          <SectionLabel number="INTERPRETATION">
            Research interpretation
          </SectionLabel>

          <div className="border border-white/10 bg-black/60 p-6">

            <div className="flex gap-4">

              <ShieldAlert
                size={18}
                className="mt-1 shrink-0 text-red-500"
              />

              <div>

                <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-white">
                  Unseen-category generalization
                </h3>

                <p className="mt-3 max-w-5xl font-mono text-[11px] leading-7 text-zinc-500">
                  The benchmark tests whether the existing
                  detector responds to a new movement category
                  and directed internal communication pattern.
                  Results are reported as an experimental
                  zero-day-style evaluation, not as evidence
                  of real-world zero-day detection.
                </p>

                <p className="mt-4 max-w-5xl font-mono text-[11px] leading-7 text-zinc-600">
                  Feature profiles are derived from the saved
                  CICIDS2017 training-context feature space and
                  lightly perturbed.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            SIMULATION TOPOLOGY
        ================================================= */}

        <section className="mt-12">

          <SectionLabel number="SIMULATION TOPOLOGY">
            Directed movement scenarios
          </SectionLabel>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

            {scenarios.map(
              (scenario, index) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  index={index}
                />
              )
            )}

          </div>

        </section>

        {/* =================================================
            OBJECTIVE 04
        ================================================= */}

        <section className="mt-12">

          <SectionLabel number="OBJECTIVE 04">
            Unseen movement evaluation
          </SectionLabel>

          <div className="border border-white/10 bg-black/60">

            <div className="grid gap-px bg-white/10 md:grid-cols-5">

              <MetricBox
                label="TP"
                value={
                  tp !== null
                    ? formatNumber(tp)
                    : "—"
                }
                sublabel="true positives"
                danger={tp !== null && tp > 0}
              />

              <MetricBox
                label="FN"
                value={
                  fn !== null
                    ? formatNumber(fn)
                    : "—"
                }
                sublabel="missed"
              />

              <MetricBox
                label="Precision"
                value={formatPercent(precision)}
                sublabel="attack precision"
              />

              <MetricBox
                label="Recall"
                value={formatPercent(recall)}
                sublabel="movement recall"
              />

              <MetricBox
                label="F1"
                value={formatPercent(f1)}
                sublabel="overall balance"
              />

            </div>

            <div className="border-t border-white/10 p-6">

              <div className="flex flex-wrap items-center gap-4">

                <div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/5 px-3 py-2">

                  <CircleDot
                    size={12}
                    className="text-red-500"
                  />

                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-red-400">
                    SIMULATED-LATERAL-MOVEMENT
                  </span>

                </div>

                <span className="font-mono text-[11px] text-zinc-500">

                  Detected{" "}

                  <span className="text-white">
                    {detectedMovementFlows !== null
                      ? formatNumber(
                          detectedMovementFlows
                        )
                      : "—"}
                  </span>

                  {" "}/{" "}

                  <span className="text-white">
                    {formatNumber(movementFlows)}
                  </span>

                </span>

                <span className="font-mono text-[11px] text-zinc-500">
                  {formatPercent(recall)}
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            CONFUSION MATRIX
        ================================================= */}

        {evaluation && (
          <section className="mt-12">

            <SectionLabel number="CLASSIFICATION">
              Confusion matrix
            </SectionLabel>

            <div className="grid gap-px bg-white/10 md:grid-cols-4">

              <MetricBox
                label="True Negative"
                value={
                  tn !== null
                    ? formatNumber(tn)
                    : "—"
                }
                sublabel="benign correctly classified"
              />

              <MetricBox
                label="False Positive"
                value={
                  fp !== null
                    ? formatNumber(fp)
                    : "—"
                }
                sublabel="benign flagged"
                danger={
                  fp !== null && fp > 0
                }
              />

              <MetricBox
                label="False Negative"
                value={
                  fn !== null
                    ? formatNumber(fn)
                    : "—"
                }
                sublabel="movement missed"
                danger={
                  fn !== null && fn > 0
                }
              />

              <MetricBox
                label="True Positive"
                value={
                  tp !== null
                    ? formatNumber(tp)
                    : "—"
                }
                sublabel="movement detected"
                danger={
                  tp !== null && tp > 0
                }
              />

            </div>

          </section>
        )}

        {/* =================================================
            RESEARCH LIMITATION
        ================================================= */}

        <section className="mt-12 pb-12">

          <SectionLabel number="RESEARCH LIMITATION">
            Experimental scope
          </SectionLabel>

          <div className="relative border border-red-500/20 bg-red-500/[0.025] p-6">

            <div className="absolute left-0 top-0 h-full w-px bg-red-600" />

            <div className="flex gap-4">

              <AlertTriangle
                size={17}
                className="mt-1 shrink-0 text-red-500"
              />

              <div>

                <p className="font-mono text-[11px] leading-7 text-zinc-400">

                  The current trained detector identifies{" "}

                  <span className="text-white">
                    {detectedMovementFlows !== null
                      ? formatNumber(
                          detectedMovementFlows
                        )
                      : "—"}
                  </span>

                  {" "}of{" "}

                  <span className="text-white">
                    {formatNumber(movementFlows)}
                  </span>

                  {" "}simulated movement flows.

                </p>

                <p className="mt-3 font-mono text-[11px] leading-7 text-zinc-600">
                  This is reported as an unseen-category
                  generalization result, not as proof of
                  real-world lateral-movement or zero-day
                  detection. The benchmark is synthetic and
                  non-executing.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-white/10 pt-5">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-3">

              <Terminal
                size={13}
                className="text-zinc-700"
              />

              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700">
                EDGE-AWARE GNN / CHRONOLOGICAL GRAPH EVALUATION
              </span>

            </div>

            <div className="flex items-center gap-4">

              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                CICIDS2017
              </span>

              <span className="h-1 w-1 bg-zinc-700" />

              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                SYNTHETIC BENCHMARK
              </span>

              <span className="h-1 w-1 bg-zinc-700" />

              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                NO LIVE TRAFFIC
              </span>

            </div>

          </div>

        </footer>

      </div>
    </div>
  );
}