import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  Network,
  ShieldAlert,
} from "lucide-react";

const flows = [
  {
    id: "TEST-2126187",
    source: "192.168.10.12",
    destination: "192.168.10.50",
    protocol: "TCP",
    probability: 0.533124,
    status: "BENIGN",
    time: "2017-07-07 01:00:00",
  },
];

function FlowTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.5,
      }}
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#090d12]"
    >
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-400" />

            <h2 className="text-sm font-semibold text-gray-200">
              Detection Activity
            </h2>
          </div>

          <p className="mt-1 text-[11px] text-gray-600">
            Verified CICIDS2017 test flow evaluated by the deployed GNN engine
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] px-2.5 py-1.5">
          <Clock3 className="h-3 w-3 text-cyan-400" />

          <span className="text-[9px] uppercase tracking-wider text-cyan-400">
            Test Flow
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-5 py-3 text-left text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Flow
              </th>

              <th className="px-5 py-3 text-left text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Source
              </th>

              <th className="px-5 py-3 text-left text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Destination
              </th>

              <th className="px-5 py-3 text-left text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Protocol
              </th>

              <th className="px-5 py-3 text-left text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Probability
              </th>

              <th className="px-5 py-3 text-left text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Status
              </th>

              <th className="px-5 py-3 text-right text-[9px] font-medium uppercase tracking-[0.15em] text-gray-700">
                Timestamp
              </th>
            </tr>
          </thead>

          <tbody>
            {flows.map((flow) => {
              const attack = flow.status === "ATTACK";

              return (
                <motion.tr
                  key={flow.id}
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    duration: 0.35,
                    delay: 0.55,
                  }}
                  className="group border-b border-white/[0.03] transition-colors hover:bg-white/[0.025]"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] text-gray-500">
                      {flow.id}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-3 w-3 text-gray-700" />

                      <span className="font-mono text-[10px] text-gray-400">
                        {flow.source}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="h-3 w-3 text-gray-700" />

                      <span className="font-mono text-[10px] text-gray-400">
                        {flow.destination}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md border border-white/[0.05] bg-white/[0.02] px-2 py-1 text-[9px] text-gray-500">
                      {flow.protocol}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${flow.probability * 100}%`,
                          }}
                          transition={{
                            duration: 0.8,
                          }}
                          className={`h-full rounded-full ${
                            attack
                              ? "bg-red-400"
                              : "bg-emerald-400"
                          }`}
                        />
                      </div>

                      <span
                        className={`text-[10px] font-semibold ${
                          attack
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {(flow.probability * 100).toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 ${
                        attack
                          ? "border-red-400/10 bg-red-400/[0.04]"
                          : "border-emerald-400/10 bg-emerald-400/[0.04]"
                      }`}
                    >
                      {attack ? (
                        <ShieldAlert className="h-3 w-3 text-red-400" />
                      ) : (
                        <CircleCheck className="h-3 w-3 text-emerald-400" />
                      )}

                      <span
                        className={`text-[9px] font-semibold ${
                          attack
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {flow.status}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-[9px] text-gray-700">
                      {flow.time}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3">
        <p className="text-[9px] text-gray-700">
          Verified evaluation flow
        </p>

        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="text-[9px] text-gray-600">
            GNN engine active
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default FlowTable;