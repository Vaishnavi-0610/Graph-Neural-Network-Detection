import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

function ThreatCard({ type, count, severity, description, delay = 0 }) {
  const isCritical = severity === "Critical";
  const isWarning = severity === "Warning";

  const Icon = isCritical
    ? ShieldAlert
    : isWarning
      ? AlertTriangle
      : CheckCircle;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/[0.06] bg-[#090d12] p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.06]">
            <Icon className="h-5 w-5 text-cyan-400" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-200">
              {type}
            </p>

            <p className="mt-1 text-[11px] text-gray-600">
              {description}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {count}
          </p>

          <p className="mt-1 text-[9px] uppercase tracking-wider text-gray-600">
            {severity}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default ThreatCard;