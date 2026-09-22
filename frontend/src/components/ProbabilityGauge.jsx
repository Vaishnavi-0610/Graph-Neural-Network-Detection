import { motion } from "framer-motion";

function ProbabilityGauge({ probability = 0.67 }) {
  const percentage = Math.round(probability * 100);
  const isThreat = probability >= 0.67;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-52 w-52">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-white/[0.05]"
          />

          <motion.circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className={
              isThreat
                ? "text-red-400"
                : "text-emerald-400"
            }
            strokeDasharray={515}
            initial={{ strokeDashoffset: 515 }}
            animate={{
              strokeDashoffset: 515 - 515 * probability,
            }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={percentage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-bold text-white"
          >
            {percentage}%
          </motion.span>

          <span className="mt-1 text-[9px] uppercase tracking-[0.2em] text-gray-600">
            Attack Probability
          </span>
        </div>
      </div>

      <div
        className={`mt-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
          isThreat
            ? "border-red-400/20 bg-red-400/[0.06] text-red-400"
            : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-400"
        }`}
      >
        {isThreat ? "Threat Detected" : "Traffic Normal"}
      </div>
    </div>
  );
}

export default ProbabilityGauge;