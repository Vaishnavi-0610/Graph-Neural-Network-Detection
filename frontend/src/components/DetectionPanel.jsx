import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  FileCheck2,
  Globe,
  LockKeyhole,
  Network,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";

import ProbabilityGauge from "../components/ProbabilityGauge";
import useDetection from "../hooks/useDetection";
import { getVerifiedFlow } from "../services/api";

const featureNames = [
  "Flow Duration",
  "Total Fwd Packets",
  "Total Backward Packets",
  "Total Length Fwd",
  "Total Length Bwd",
  "Fwd Packet Mean",
  "Bwd Packet Mean",
  "Flow Bytes/s",
  "Flow Packets/s",
  "Flow IAT Mean",
  "Packet Length Mean",
  "Packet Length Std",
  "SYN Flag Count",
  "ACK Flag Count",
  "Average Packet Size",
];

function Detection() {
  const [sourceIP, setSourceIP] = useState("192.168.10.12");
  const [destinationIP, setDestinationIP] = useState("192.168.10.50");
  const [features, setFeatures] = useState(Array(15).fill(""));
  const [verifiedLoading, setVerifiedLoading] = useState(false);
  const [verifiedLoaded, setVerifiedLoaded] = useState(false);
  const [verifiedError, setVerifiedError] = useState("");

  const { result, loading, error, detect, reset } = useDetection();

  const probability = result?.attack_probability ?? 0;
  const prediction = result?.prediction;
  const success = result?.status === "SUCCESS";

  const handleFeatureChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleLoadVerifiedFlow = async () => {
    if (verifiedLoading || loading) return;

    setVerifiedLoading(true);
    setVerifiedError("");

    try {
      const flow = await getVerifiedFlow();

      if (flow?.status !== "available") {
        throw new Error(
          flow?.message || "Verified CICIDS2017 flow is unavailable."
        );
      }

      const loadedFeatures =
        flow.flow_features ??
        flow.features ??
        flow.edge_features ??
        [];

      if (!Array.isArray(loadedFeatures) || loadedFeatures.length !== 15) {
        throw new Error(
          "Verified flow does not contain exactly 15 model features."
        );
      }

      setSourceIP(flow.source_ip || "172.16.0.1");
      setDestinationIP(flow.destination_ip || "192.168.10.50");

      setFeatures(
        loadedFeatures.map((value) =>
          Number.isFinite(Number(value)) ? String(value) : "0"
        )
      );

      setVerifiedLoaded(true);
      reset();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to load the verified CICIDS2017 flow.";

      setVerifiedError(message);
      setVerifiedLoaded(false);
    } finally {
      setVerifiedLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!sourceIP || !destinationIP || loading) return;

    const numericFeatures = features.map((value) => {
      if (value === "" || value === null) return 0;

      const number = Number(value);

      return Number.isFinite(number) ? number : 0;
    });

    await detect({
      source_ip: sourceIP,
      destination_ip: destinationIP,
      flow_features: numericFeatures,
    });
  };

  const handleReset = () => {
    setSourceIP("192.168.10.12");
    setDestinationIP("192.168.10.50");
    setFeatures(Array(15).fill(""));
    setVerifiedLoaded(false);
    setVerifiedError("");
    reset();
  };

  return (
    <div className="min-h-full bg-[#05070a] p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
                GNN Security Engine
              </p>

              <span className="rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-2 py-0.5 text-[8px] font-medium uppercase tracking-wider text-emerald-400">
                Operational
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Flow Detection
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Analyze an individual network flow using the trained
              edge-aware Graph Neural Network.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#090d12] px-4 py-2.5">
              <Network className="h-4 w-4 text-cyan-400" />

              <div>
                <p className="text-[8px] uppercase tracking-wider text-gray-700">
                  Graph Nodes
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                  19,129
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#090d12] px-4 py-2.5">
              <Zap className="h-4 w-4 text-cyan-400" />

              <div>
                <p className="text-[8px] uppercase tracking-wider text-gray-700">
                  Threshold
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                  0.67
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12]"
        >
          <div className="border-b border-white/[0.05] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-cyan-400" />

                  <h2 className="text-sm font-semibold text-gray-200">
                    Network Flow Input
                  </h2>
                </div>

                <p className="mt-1 text-[11px] text-gray-600">
                  Provide source, destination and edge-level traffic features
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleLoadVerifiedFlow}
                  disabled={verifiedLoading || loading}
                  className="group flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.04] px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-cyan-400 transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifiedLoading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-cyan-400/30 border-t-cyan-400" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Load Verified Flow
                    </>
                  )}
                </button>

                <div className="hidden items-center gap-2 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] px-3 py-1.5 sm:flex">
                  <Radio className="h-3 w-3 text-cyan-400" />

                  <span className="text-[9px] uppercase tracking-wider text-cyan-400">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {verifiedLoaded && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.07]">
                  <FileCheck2 className="h-4 w-4 text-cyan-400" />
                </div>

                <div>
                  <p className="text-xs font-medium text-cyan-300">
                    Verified CICIDS2017 flow loaded
                  </p>

                  <p className="mt-1 text-[9px] leading-relaxed text-gray-600">
                    A real test-set flow has been loaded into the 15-dimensional
                    edge feature vector. Click Analyze Flow to run GNN inference.
                  </p>
                </div>
              </motion.div>
            )}

            {verifiedError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/10 bg-red-400/[0.04] p-4"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                <div>
                  <p className="text-xs font-medium text-red-400">
                    Verified Flow Error
                  </p>

                  <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
                    {verifiedError}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-600">
                  <Globe className="h-3 w-3" />
                  Source IP
                </label>

                <input
                  value={sourceIP}
                  onChange={(e) => {
                    setSourceIP(e.target.value);
                    setVerifiedLoaded(false);
                  }}
                  placeholder="192.168.10.12"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#05080c] px-4 py-3 text-sm font-mono text-gray-300 outline-none transition placeholder:text-gray-800 focus:border-cyan-400/30 focus:ring-1 focus:ring-cyan-400/10"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-600">
                  <Globe className="h-3 w-3" />
                  Destination IP
                </label>

                <input
                  value={destinationIP}
                  onChange={(e) => {
                    setDestinationIP(e.target.value);
                    setVerifiedLoaded(false);
                  }}
                  placeholder="192.168.10.50"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#05080c] px-4 py-3 text-sm font-mono text-gray-300 outline-none transition placeholder:text-gray-800 focus:border-cyan-400/30 focus:ring-1 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.04]" />

              <div className="flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-3 py-1.5">
                <ArrowRight className="h-3 w-3 text-cyan-400" />

                <span className="font-mono text-[9px] text-gray-600">
                  FLOW
                </span>
              </div>

              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-[#05080c] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-3.5 w-3.5 text-gray-600" />

                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-600">
                    Edge Feature Vector
                  </span>
                </div>

                <span className="rounded-md border border-cyan-400/10 bg-cyan-400/[0.03] px-2 py-1 text-[8px] font-medium tracking-wider text-cyan-400">
                  15 FEATURES
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {featureNames.map((name, index) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: 0.15 + index * 0.025,
                    }}
                    className="group rounded-xl border border-white/[0.04] bg-[#090d12] p-3 transition-all duration-200 hover:border-cyan-400/10"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-semibold tracking-wider text-cyan-400/50">
                        F{String(index + 1).padStart(2, "0")}
                      </p>

                      <div className="h-1 w-1 rounded-full bg-gray-700 transition group-focus-within:bg-cyan-400" />
                    </div>

                    <p
                      className="mt-2 truncate text-[9px] text-gray-600"
                      title={name}
                    >
                      {name}
                    </p>

                    <input
                      type="number"
                      step="any"
                      value={features[index]}
                      onChange={(e) =>
                        handleFeatureChange(index, e.target.value)
                      }
                      placeholder="0"
                      className="mt-2 w-full border-b border-white/[0.05] bg-transparent pb-1 text-xs font-mono text-gray-300 outline-none transition placeholder:text-gray-800 focus:border-cyan-400/30"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/10 bg-red-400/[0.04] p-4"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                <div>
                  <p className="text-xs font-medium text-red-400">
                    Detection API Error
                  </p>

                  <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
                    {error}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={loading || verifiedLoading}
                className="group flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-semibold text-[#031015] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#031015]/30 border-t-[#031015]" />
                    Analyzing Flow...
                  </>
                ) : (
                  <>
                    <Activity className="h-3.5 w-3.5" />
                    Analyze Flow
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loading || verifiedLoading}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 text-xs font-medium text-gray-500 transition-all hover:bg-white/[0.05] hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>

              <div className="ml-auto hidden items-center gap-2 md:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />

                <span className="text-[9px] text-gray-700">
                  CPU inference engine
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12]"
        >
          <div className="border-b border-white/[0.05] px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />

              <h2 className="text-sm font-semibold text-gray-200">
                GNN Assessment
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-gray-600">
              Model prediction and confidence
            </p>
          </div>

          <div className="flex min-h-[590px] flex-col items-center justify-center px-6 py-8">
            {loading ? (
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/10 border-t-cyan-400 bg-cyan-400/[0.03]"
                >
                  <Activity className="h-7 w-7 text-cyan-400" />
                </motion.div>

                <p className="mt-6 text-xs font-medium text-gray-400">
                  Running GNN inference
                </p>

                <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-gray-700">
                  Processing flow
                </p>

                <div className="mt-5 flex gap-1">
                  {[0, 1, 2, 3].map((item) => (
                    <motion.div
                      key={item}
                      animate={{
                        opacity: [0.2, 1, 0.2],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: item * 0.15,
                      }}
                      className="h-1 w-5 rounded-full bg-cyan-400"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <ProbabilityGauge probability={probability} />

                {!success && (
                  <div className="mt-8 max-w-[260px] text-center">
                    <p className="text-xs font-medium text-gray-500">
                      Awaiting flow analysis
                    </p>

                    <p className="mt-2 text-[10px] leading-relaxed text-gray-700">
                      Load a verified CICIDS2017 flow or enter your own
                      network-flow features, then submit the flow for
                      GNN-based intrusion assessment.
                    </p>
                  </div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-7 w-full"
                  >
                    <div
                      className={`rounded-2xl border p-5 ${
                        prediction === "ATTACK"
                          ? "border-red-400/15 bg-red-400/[0.04]"
                          : "border-emerald-400/15 bg-emerald-400/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              prediction === "ATTACK"
                                ? "bg-red-400/[0.08]"
                                : "bg-emerald-400/[0.08]"
                            }`}
                          >
                            {prediction === "ATTACK" ? (
                              <ShieldAlert className="h-5 w-5 text-red-400" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            )}
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-600">
                              Classification
                            </p>

                            <p
                              className={`mt-1 text-lg font-bold ${
                                prediction === "ATTACK"
                                  ? "text-red-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {prediction}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-wider text-gray-700">
                            Confidence
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-300">
                            {(result.confidence * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[0.04] bg-[#05080c] p-3">
                        <div className="flex items-center gap-2">
                          <Timer className="h-3.5 w-3.5 text-cyan-400" />

                          <span className="text-[8px] uppercase tracking-wider text-gray-700">
                            Inference
                          </span>
                        </div>

                        <p className="mt-2 font-mono text-xs text-gray-400">
                          {result.inference_time_ms} ms
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.04] bg-[#05080c] p-3">
                        <div className="flex items-center gap-2">
                          <Crosshair className="h-3.5 w-3.5 text-cyan-400" />

                          <span className="text-[8px] uppercase tracking-wider text-gray-700">
                            Threshold
                          </span>
                        </div>

                        <p className="mt-2 font-mono text-xs text-gray-400">
                          {result.threshold.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/[0.04] bg-[#05080c] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-wider text-gray-700">
                          Source
                        </span>

                        <span className="font-mono text-[9px] text-gray-500">
                          {result.source_ip}
                        </span>
                      </div>

                      <div className="my-2 h-px bg-white/[0.04]" />

                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-wider text-gray-700">
                          Destination
                        </span>

                        <span className="font-mono text-[9px] text-gray-500">
                          {result.destination_ip}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div className="rounded-xl border border-white/[0.05] bg-[#090d12] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/[0.05]">
              <Network className="h-4 w-4 text-cyan-400" />
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-700">
                Architecture
              </p>

              <p className="mt-1 text-xs font-medium text-gray-400">
                Edge-Aware GNN
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.05] bg-[#090d12] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/[0.05]">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-700">
                Edge Features
              </p>

              <p className="mt-1 text-xs font-medium text-gray-400">
                15-dimensional vector
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.05] bg-[#090d12] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/[0.05]">
              <TargetIcon />
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-700">
                Test Accuracy
              </p>

              <p className="mt-1 text-xs font-medium text-gray-400">
                99.68%
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TargetIcon() {
  return (
    <div className="relative h-4 w-4">
      <div className="absolute inset-0 rounded-full border border-cyan-400" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400" />
    </div>
  );
}

export default Detection;