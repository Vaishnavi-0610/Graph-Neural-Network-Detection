import { motion } from "framer-motion";

function StatCard({ title, value, subtitle, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group rounded-2xl border border-white/[0.06] bg-[#090d12] p-5 transition-all duration-300 hover:border-cyan-400/20 hover:bg-[#0b1016]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-600">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h2>

          <p className="mt-2 text-xs text-gray-600">
            {subtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06]">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;