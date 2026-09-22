import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  CircleHelp,
  Cpu,
  Database,
  Globe,
  Lock,
  Network,
  RefreshCw,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

import { checkHealth, getModelInfo } from "../services/api";

function Settings() {
  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const loadSystemStatus = async () => {
    setLoading(true);

    try {
      const [healthData, modelData] = await Promise.all([
        checkHealth(),
        getModelInfo(),
      ]);

      setHealth(healthData);
      setModelInfo(modelData);
    } catch {
      setHealth(null);
      setModelInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const apiOnline = Boolean(health?.status === "healthy");

  return (
    <div className="min-h-full bg-[#05070a] p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
              System Configuration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Configure the monitoring interface and inspect the current GNN
              inference system.
            </p>
          </div>

          <button
            onClick={loadSystemStatus}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-[#090d12] px-4 py-2.5 text-xs font-medium text-gray-400 transition hover:border-cyan-400/15 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Status
          </button>
        </div>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12]"
        >
          <div className="border-b border-white/[0.05] px-6 py-5">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" />

              <h2 className="text-sm font-semibold text-gray-200">
                Backend Connection
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-gray-600">
              FastAPI inference service connectivity
            </p>
          </div>

          <div className="p-6">
            <div
              className={`rounded-2xl border p-5 ${
                apiOnline
                  ? "border-emerald-400/10 bg-emerald-400/[0.025]"
                  : "border-red-400/10 bg-red-400/[0.025]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      apiOnline
                        ? "bg-emerald-400/[0.06]"
                        : "bg-red-400/[0.06]"
                    }`}
                  >
                    {apiOnline ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <CircleHelp className="h-5 w-5 text-red-400" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-300">
                      {apiOnline ? "API Connected" : "API Unavailable"}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      {apiOnline
                        ? "Inference service is responding normally"
                        : "Unable to reach the inference service"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      apiOnline
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                        : "bg-red-400"
                    }`}
                  />

                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider ${
                      apiOnline ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {apiOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-600">
                <Globe className="h-3 w-3" />
                API Endpoint
              </label>

              <div className="flex items-center rounded-xl border border-white/[0.05] bg-[#05080c] px-4 py-3">
                <span className="font-mono text-xs text-gray-400">
                  http://127.0.0.1:8000
                </span>

                <span className="ml-auto rounded-md border border-cyan-400/10 bg-cyan-400/[0.03] px-2 py-1 text-[8px] text-cyan-400">
                  LOCAL
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoBox
                label="Service"
                value="FastAPI"
                icon={Server}
              />

              <InfoBox
                label="Inference"
                value="CPU"
                icon={Cpu}
              />
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12]"
        >
          <div className="border-b border-white/[0.05] px-6 py-5">
            <div className="flex items-center gap-2">
              <BrainIcon />

              <h2 className="text-sm font-semibold text-gray-200">
                Model Configuration
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-gray-600">
              Active GNN inference configuration
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox
                label="Architecture"
                value={modelInfo?.model || "TemporalEdgeGNN"}
                icon={Network}
              />

              <InfoBox
                label="Framework"
                value={modelInfo?.framework || "PyTorch"}
                icon={Cpu}
              />

              <InfoBox
                label="Nodes"
                value={
                  modelInfo?.node_count?.toLocaleString() || "19,129"
                }
                icon={Network}
              />

              <InfoBox
                label="Context Edges"
                value={
                  modelInfo?.context_edges?.toLocaleString() || "62,538"
                }
                icon={GitBranchIcon}
              />
            </div>

            <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-gray-700">
                    Detection Threshold
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-200">
                    {modelInfo?.threshold?.toFixed(2) || "0.67"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
                  <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(modelInfo?.threshold || 0.67) * 100}%`,
                  }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-cyan-400"
                />
              </div>

              <p className="mt-3 text-[9px] leading-relaxed text-gray-700">
                Flows at or above this probability are classified as
                ATTACK by the deployed inference engine.
              </p>
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28 }}
        className="mt-6 rounded-2xl border border-white/[0.06] bg-[#090d12]"
      >
        <div className="border-b border-white/[0.05] px-6 py-5">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-cyan-400" />

            <h2 className="text-sm font-semibold text-gray-200">
              Interface Preferences
            </h2>
          </div>

          <p className="mt-1 text-[11px] text-gray-600">
            Customize monitoring dashboard behavior
          </p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          <SettingRow
            icon={Activity}
            title="Automatic Status Refresh"
            description="Keep system connectivity information updated automatically."
            enabled={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
          />

          <SettingRow
            icon={Zap}
            title="Compact Interface"
            description="Use a denser layout for monitoring larger amounts of information."
            enabled={compactMode}
            onChange={() => setCompactMode(!compactMode)}
          />

          <SettingRow
            icon={ShieldCheck}
            title="Threat Notifications"
            description="Show visual alerts when suspicious activity is detected."
            enabled={notifications}
            onChange={() => setNotifications(!notifications)}
          />
        </div>
      </motion.section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
              <Database className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-700">
                Dataset
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-300">
                CICIDS2017
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.42 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
              <Lock className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-700">
                Security
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-300">
                Local Inference
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.49 }}
          className="rounded-2xl border border-white/[0.06] bg-[#090d12] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-700">
                Status
              </p>

              <p className="mt-1 text-sm font-semibold text-emerald-400">
                {apiOnline ? "Operational" : "Disconnected"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 rounded-xl border border-white/[0.04] bg-[#070a0f] px-5 py-4">
        <div className="flex items-center gap-3">
          <CircleHelp className="h-4 w-4 text-gray-700" />

          <p className="text-[9px] leading-relaxed text-gray-700">
            Interface preferences are stored for the current session.
            Model configuration is read from the active backend service.
          </p>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}

function InfoBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#05080c] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-cyan-400/70" />

        <p className="text-[8px] uppercase tracking-wider text-gray-700">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-xs font-medium text-gray-300">
        {value}
      </p>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.025]">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-300">
            {title}
          </p>

          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-gray-700">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onChange}
        aria-label={`Toggle ${title}`}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-300 ${
          enabled
            ? "border-cyan-400/20 bg-cyan-400/20"
            : "border-white/[0.08] bg-white/[0.04]"
        }`}
      >
        <motion.div
          animate={{
            x: enabled ? 20 : 2,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full ${
            enabled
              ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
              : "bg-gray-600"
          }`}
        />
      </button>
    </div>
  );
}

function BrainIcon() {
  return (
    <div className="flex h-4 w-4 items-center justify-center">
      <BrainCircuitIcon />
    </div>
  );
}

function BrainCircuitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4 text-cyan-400"
    >
      <path d="M12 4a3 3 0 0 0-5.7 1.3A3.5 3.5 0 0 0 5 12a3.5 3.5 0 0 0 1.3 6.7A3 3 0 0 0 12 20" />
      <path d="M12 4a3 3 0 0 1 5.7 1.3A3.5 3.5 0 0 1 19 12a3.5 3.5 0 0 1-1.3 6.7A3 3 0 0 1 12 20" />
      <path d="M12 4v16M8 8h4M12 12h4M8 16h4" />
    </svg>
  );
}

function GitBranchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3.5 w-3.5 text-cyan-400/70"
    >
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 5h7M8 5a7 7 0 0 0 7 7h1M16 5v12" />
    </svg>
  );
}

export default Settings;