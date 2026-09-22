import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  GitBranch,
  Layers3,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const NODE_FEATURES = [
  "Outgoing flow count",
  "Incoming flow count",
  "Unique outgoing destinations",
  "Unique incoming sources",
  "Total outgoing flow duration",
  "Total incoming flow duration",
  "Outgoing forward packets",
  "Incoming forward packets",
  "Outgoing forward bytes",
  "Incoming forward bytes",
  "Mean outgoing packet size",
  "Mean incoming packet size",
];

const EDGE_FEATURES = [
  "Flow duration",
  "Total forward packets",
  "Total backward packets",
  "Total length of forward packets",
  "Total length of backward packets",
  "Forward packet length mean",
  "Backward packet length mean",
  "Flow bytes/s",
  "Flow packets/s",
  "Flow IAT mean",
  "Flow IAT std",
  "Fwd IAT total",
  "Bwd IAT total",
  "Active mean",
  "Idle mean",
];

const ARCHITECTURE = [
  {
    step: "01",
    title: "Network flows",
    subtitle: "CICIDS2017",
    icon: Database,
    detail:
      "Directed source → destination communication events extracted from network traffic.",
  },
  {
    step: "02",
    title: "Graph construction",
    subtitle: "NODES + EDGES",
    icon: Network,
    detail:
      "Hosts become nodes and communication flows become directed edges.",
  },
  {
    step: "03",
    title: "Edge-Aware GNN",
    subtitle: "2 MESSAGE-PASSING LAYERS",
    icon: Layers3,
    detail:
      "Node representations are updated using source-node context together with edge features.",
  },
  {
    step: "04",
    title: "Node embeddings",
    subtitle: "64-D HIDDEN SPACE",
    icon: BrainCircuit,
    detail:
      "Each host receives a learned representation containing graph context.",
  },
  {
    step: "05",
    title: "Edge classifier",
    subtitle: "143 → 64 → 32 → 1",
    icon: GitBranch,
    detail:
      "Source embedding + destination embedding + 15 edge features are classified.",
  },
  {
    step: "06",
    title: "Detection",
    subtitle: "THRESHOLD 0.67",
    icon: ShieldCheck,
    detail:
      "The sigmoid probability is converted into a BENIGN or ATTACK decision.",
  },
];

function SectionHeader({ index, title, subtitle }) {
  return (
    <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-3">
      <div>
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.3em] text-red-400/80">
          {index}
        </div>

        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-white">
          {title}
        </h2>
      </div>

      <div className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/30 md:block">
        {subtitle}
      </div>
    </div>
  );
}

function FeatureList({ items, accent = "cyan" }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <motion.div
          key={item}
          className="flex items-center gap-3 border border-white/5 bg-white/[0.015] px-3 py-2.5"
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.25,
            delay: index * 0.025,
          }}
        >
          <span
            className={`font-mono text-[8px] ${
              accent === "red" ? "text-red-400" : "text-cyan-300"
            }`}
          >
            {(index + 1).toString().padStart(2, "0")}
          </span>

          <span className="text-[10px] text-white/55">
            {item}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ArchitectureCard({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.div
      className="relative border border-white/10 bg-[#050505] p-5"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
      }}
    >
      <div className="absolute left-0 top-0 h-px w-10 bg-red-500/80" />

      <div className="mb-5 flex items-start justify-between">
        <span className="font-mono text-[9px] tracking-[0.18em] text-red-400">
          {item.step}
        </span>

        <Icon
          size={17}
          strokeWidth={1.4}
          className="text-white/35"
        />
      </div>

      <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white">
        {item.title}
      </div>

      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300/70">
        {item.subtitle}
      </div>

      <p className="mt-4 text-[10px] leading-5 text-white/35">
        {item.detail}
      </p>
    </motion.div>
  );
}

function Spec({ label, value, icon: Icon }) {
  return (
    <div className="border border-white/5 bg-[#050505] p-4">
      <div className="mb-2 flex items-center gap-2 text-white/30">
        <Icon
          size={13}
          strokeWidth={1.4}
        />

        <span className="font-mono text-[8px] uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>

      <div className="font-mono text-sm text-white/80">
        {value}
      </div>
    </div>
  );
}

export default function Model() {
  return (
    <div className="relative z-10 min-h-full px-4 pb-12 pt-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <motion.div
          className="mb-8 border-b border-white/10 pb-6"
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-red-400">
              SEC-MODEL / 06
            </span>

            <span className="h-px w-10 bg-red-500/60" />

            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              Architecture & methodology
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-mono text-2xl font-semibold uppercase tracking-[0.08em] text-white md:text-4xl">
                Edge-Aware GNN
              </h1>

              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/40">
                Graph-based network intrusion detection using host context,
                directed communication edges, and flow-level features.
              </p>
            </div>

            <div className="border border-white/10 px-4 py-3">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
                PARAMETERS
              </div>

              <div className="mt-1 font-mono text-lg text-cyan-300">
                35,137
              </div>
            </div>
          </div>
        </motion.div>

        {/* DETECTION PIPELINE */}

        <section className="mb-10">
          <SectionHeader
            index="01"
            title="Detection pipeline"
            subtitle="END-TO-END DATA FLOW"
          />

          <div className="grid gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-3">
            {ARCHITECTURE.map((item, index) => (
              <ArchitectureCard
                key={item.step}
                item={item}
                index={index}
              />
            ))}
          </div>

          <div className="mt-4 border border-white/5 bg-black/30 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
            FLOW → GRAPH → MESSAGE PASSING → NODE EMBEDDINGS → EDGE CLASSIFICATION → DETECTION
          </div>
        </section>

        {/* FEATURES */}

        <section className="mb-10 grid gap-5 xl:grid-cols-2">

          {/* NODE FEATURES */}

          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader
              index="02"
              title="Node feature space"
              subtitle="12 FEATURES / HOST CONTEXT"
            />

            <div className="mb-5 grid grid-cols-3 gap-px bg-white/10">
              <Spec
                label="Input"
                value="12-D"
                icon={Network}
              />

              <Spec
                label="Hidden"
                value="64-D"
                icon={Layers3}
              />

              <Spec
                label="Normalization"
                value="TRAIN-ONLY"
                icon={SlidersHorizontal}
              />
            </div>

            <FeatureList items={NODE_FEATURES} />
          </div>

          {/* EDGE FEATURES */}

          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader
              index="03"
              title="Edge feature space"
              subtitle="15 FEATURES / FLOW CONTEXT"
            />

            <div className="mb-5 grid grid-cols-3 gap-px bg-white/10">
              <Spec
                label="Input"
                value="15-D"
                icon={GitBranch}
              />

              <Spec
                label="Hidden"
                value="64-D"
                icon={Layers3}
              />

              <Spec
                label="Role"
                value="FLOW EDGE"
                icon={Activity}
              />
            </div>

            <FeatureList
              items={EDGE_FEATURES}
              accent="red"
            />
          </div>
        </section>

        {/* GNN INTERNALS */}

        <section className="mb-10">
          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader
              index="04"
              title="Message-passing architecture"
              subtitle="EDGE-AWARE GNN LAYERS"
            />

            <div className="grid gap-4 lg:grid-cols-2">

              {/* LAYER 1 */}

              <div className="border border-white/10 bg-[#050505] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[0.18em] text-red-400">
                    LAYER 01
                  </span>

                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                    MESSAGE PASSING
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-px bg-white/10 text-center font-mono">

                  <div className="bg-[#050505] p-4">
                    <div className="text-[8px] text-white/30">
                      INPUT
                    </div>

                    <div className="mt-2 text-xs text-white/70">
                      12-D NODE
                    </div>
                  </div>

                  <div className="bg-[#050505] p-4">
                    <div className="text-[8px] text-white/30">
                      EDGE
                    </div>

                    <div className="mt-2 text-xs text-cyan-300">
                      15-D
                    </div>
                  </div>

                  <div className="bg-[#050505] p-4">
                    <div className="text-[8px] text-white/30">
                      OUTPUT
                    </div>

                    <div className="mt-2 text-xs text-white/70">
                      64-D
                    </div>
                  </div>

                </div>

                <div className="mt-4 border-l border-cyan-400/30 pl-3 font-mono text-[9px] leading-5 text-white/40">
                  message = Linear(node[source]) + Linear(edge)
                </div>
              </div>

              {/* LAYER 2 */}

              <div className="border border-white/10 bg-[#050505] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[0.18em] text-red-400">
                    LAYER 02
                  </span>

                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                    MESSAGE PASSING
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-px bg-white/10 text-center font-mono">

                  <div className="bg-[#050505] p-4">
                    <div className="text-[8px] text-white/30">
                      INPUT
                    </div>

                    <div className="mt-2 text-xs text-white/70">
                      64-D NODE
                    </div>
                  </div>

                  <div className="bg-[#050505] p-4">
                    <div className="text-[8px] text-white/30">
                      EDGE
                    </div>

                    <div className="mt-2 text-xs text-cyan-300">
                      15-D
                    </div>
                  </div>

                  <div className="bg-[#050505] p-4">
                    <div className="text-[8px] text-white/30">
                      OUTPUT
                    </div>

                    <div className="mt-2 text-xs text-white/70">
                      64-D
                    </div>
                  </div>

                </div>

                <div className="mt-4 border-l border-cyan-400/30 pl-3 font-mono text-[9px] leading-5 text-white/40">
                  aggregate(messages) → node update
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">

              <Spec
                label="Activation"
                value="ReLU"
                icon={Zap}
              />

              <Spec
                label="Normalization"
                value="LayerNorm"
                icon={SlidersHorizontal}
              />

              <Spec
                label="Hidden size"
                value="64"
                icon={Layers3}
              />

              <Spec
                label="Aggregation"
                value="index_add"
                icon={GitBranch}
              />

            </div>
          </div>
        </section>

        {/* CLASSIFIER */}

        <section className="mb-10 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">

          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader
              index="05"
              title="Edge classifier"
              subtitle="EDGE-LEVEL DECISION"
            />

            <div className="flex flex-col items-center gap-2">

              {[
                ["SOURCE EMBEDDING", "64-D"],
                ["DESTINATION EMBEDDING", "64-D"],
                ["EDGE FEATURES", "15-D"],
              ].map(([name, size]) => (
                <div
                  key={name}
                  className="flex w-full max-w-xl items-center justify-between border border-white/10 bg-[#050505] px-5 py-4"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                    {name}
                  </span>

                  <span className="font-mono text-xs text-cyan-300">
                    {size}
                  </span>
                </div>
              ))}

              <div className="my-1 h-5 w-px bg-red-500/50" />

              <div className="w-full max-w-xl border border-red-500/30 bg-red-500/[0.035] p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-red-400">
                  CONCATENATED EDGE INPUT
                </div>

                <div className="mt-2 font-mono text-2xl text-white">
                  143-D
                </div>
              </div>

              <div className="my-1 h-5 w-px bg-red-500/50" />

              <div className="grid w-full max-w-xl grid-cols-3 gap-px bg-white/10">

                <div className="bg-[#050505] p-4 text-center">
                  <div className="font-mono text-[8px] text-white/30">
                    FC 01
                  </div>

                  <div className="mt-2 font-mono text-xs text-white/75">
                    143 → 64
                  </div>
                </div>

                <div className="bg-[#050505] p-4 text-center">
                  <div className="font-mono text-[8px] text-white/30">
                    FC 02
                  </div>

                  <div className="mt-2 font-mono text-xs text-white/75">
                    64 → 32
                  </div>
                </div>

                <div className="bg-[#050505] p-4 text-center">
                  <div className="font-mono text-[8px] text-white/30">
                    OUTPUT
                  </div>

                  <div className="mt-2 font-mono text-xs text-white/75">
                    32 → 1
                  </div>
                </div>

              </div>

              <div className="my-1 h-5 w-px bg-red-500/50" />

              <div className="border border-cyan-400/20 bg-cyan-400/[0.025] px-8 py-4 text-center">
                <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
                  SIGMOID
                </div>

                <div className="mt-1 font-mono text-lg text-cyan-300">
                  ATTACK PROBABILITY
                </div>
              </div>

            </div>
          </div>

          {/* TRAINING CONFIG */}

          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader
              index="06"
              title="Training configuration"
              subtitle="SAVED EXPERIMENT"
            />

            <div className="space-y-px bg-white/10">

              <Spec
                label="Optimizer"
                value="Adam"
                icon={Cpu}
              />

              <Spec
                label="Learning rate"
                value="0.001"
                icon={TrendingUp}
              />

              <Spec
                label="Weight decay"
                value="0.0001"
                icon={SlidersHorizontal}
              />

              <Spec
                label="Epochs"
                value="10"
                icon={Clock3}
              />

              <Spec
                label="Gradient clipping"
                value="1.0"
                icon={Zap}
              />

              <Spec
                label="Positive weight"
                value="4.0"
                icon={Target}
              />

              <Spec
                label="Training ratio"
                value="1 : 4 attack / benign"
                icon={Activity}
              />

              <Spec
                label="Framework"
                value="PyTorch / CPU"
                icon={Cpu}
              />

            </div>

            <div className="mt-5 border-l border-emerald-400/30 pl-4">
              <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300">
                <CheckCircle2 size={13} />
                Inference ready
              </div>

              <p className="text-[10px] leading-5 text-white/35">
                The trained weights, normalization statistics, node mapping,
                context graph, and detection threshold are loaded by the backend.
              </p>
            </div>
          </div>
        </section>

        {/* CHRONOLOGICAL GRAPH */}

        <section className="mb-10">
          <div className="cyber-panel p-5 md:p-6">
            <SectionHeader
              index="07"
              title="Chronological graph evaluation"
              subtitle="SNAPSHOT METHODOLOGY"
            />

            <div className="grid gap-4 md:grid-cols-4">

              {[
                ["01", "ORDER", "Network events ordered by timestamp."],
                ["02", "WINDOW", "Five-minute chronological snapshots."],
                ["03", "GRAPH", "Directed source → destination topology."],
                ["04", "EVALUATE", "Model scores edges in held-out periods."],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="border border-white/5 p-5"
                >
                  <div className="font-mono text-[9px] text-red-400">
                    {number}
                  </div>

                  <div className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-white/75">
                    {title}
                  </div>

                  <p className="mt-3 text-[10px] leading-5 text-white/35">
                    {text}
                  </p>
                </div>
              ))}

            </div>

            <div className="mt-5 border border-amber-400/15 bg-amber-400/[0.015] p-5">

              <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-amber-300/80">
                <Clock3 size={13} />
                Methodology note
              </div>

              <p className="max-w-4xl text-[10px] leading-5 text-white/40">
                The current implementation is an Edge-Aware GNN evaluated
                with chronological graph snapshots. Edge timestamps organize
                the snapshots, but they are not directly used inside the
                message-passing equations. Therefore, this should not be
                described as a fully temporal GNN.
              </p>

            </div>
          </div>
        </section>

        {/* SYSTEM PROFILE */}

        <section>
          <div className="cyber-panel border-red-500/20 p-5 md:p-6">

            <SectionHeader
              index="08"
              title="System profile"
              subtitle="RESEARCH CONFIGURATION"
            />

            <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">

              <Spec
                label="Dataset"
                value="CICIDS2017"
                icon={Database}
              />

              <Spec
                label="Unique IPs"
                value="19,129"
                icon={Network}
              />

              <Spec
                label="Context edges"
                value="62,538"
                icon={GitBranch}
              />

              <Spec
                label="Detection threshold"
                value="0.67"
                icon={Target}
              />

            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">

              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                  Recommended terminology
                </div>

                <div className="mt-2 font-mono text-sm text-white/75">
                  Edge-Aware GNN + chronological graph-snapshot evaluation
                </div>
              </div>

              <div className="border border-cyan-400/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300">
                Research-ready architecture
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}