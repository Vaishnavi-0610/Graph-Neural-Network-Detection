import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CircleDot,
  Crosshair,
  Database,
  Network,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";

import {
  getNetworkGraph,
  getNetworkNode,
} from "../services/api";


const GRAPH_LIMIT = 24;


function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Number(value || 0)
  );
}


function getNodeSize(node) {

  if (node.critical) {

    const attacks =
      Number(
        node.attack_flow_count || 0
      );

    if (attacks >= 100000) {
      return 24;
    }

    if (attacks >= 10000) {
      return 22;
    }

    if (attacks >= 1000) {
      return 20;
    }

    return 18;
  }

  const degree =
    Number(
      node.degree || 0
    );

  if (degree >= 5000) {
    return 18;
  }

  if (degree >= 1000) {
    return 16;
  }

  if (degree >= 100) {
    return 14;
  }

  return 12;
}


function getNodePosition(
  node,
  index,
  total,
  width,
  height
) {

  if (node.critical) {

    const angle =
      (
        index /
        Math.max(
          total,
          1
        )
      ) *
      Math.PI *
      2;

    const radiusX =
      Math.min(
        width * 0.39,
        390
      );

    const radiusY =
      Math.min(
        height * 0.32,
        175
      );

    return {
      x:
        width / 2 +
        Math.cos(angle) *
        radiusX,

      y:
        height / 2 +
        Math.sin(angle) *
        radiusY,
    };
  }

  const columns = 4;

  const rows =
    Math.ceil(
      total / columns
    );

  const horizontalGap =
    width /
    (columns + 1);

  const verticalGap =
    height /
    (rows + 1);

  const column =
    index % columns;

  const row =
    Math.floor(
      index / columns
    );

  return {
    x:
      horizontalGap *
      (column + 1),

    y:
      verticalGap *
      (row + 1),
  };
}


// ============================================================
// NODE DETAILS
// ============================================================

function NodeDetails({
  node,
  onClose,
}) {

  if (!node) {
    return null;
  }

  const critical =
    Boolean(
      node.critical
    );


  return (
    <div
      className="
        absolute
        right-4
        top-4
        z-30
        w-[330px]
        max-h-[480px]
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-[#080d1d]/95
        shadow-2xl
        backdrop-blur-xl
      "
    >

      {/* =====================================================
          FIXED HEADER
      ===================================================== */}

      <div
        className="
          sticky
          top-0
          z-20
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-white/10
          bg-[#080d1d]/95
          px-4
          py-3
          backdrop-blur-xl
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          {critical ? (
            <ShieldAlert
              size={17}
              className="text-red-400"
            />
          ) : (
            <ShieldCheck
              size={17}
              className="text-cyan-400"
            />
          )}

          <span
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.18em]
              text-white
            "
          >
            Network details
          </span>

        </div>


        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg
            p-1.5
            text-slate-400
            transition
            hover:bg-white/10
            hover:text-white
          "
        >
          <X size={17} />
        </button>

      </div>


      {/* =====================================================
          SCROLLABLE CONTENT
      ===================================================== */}

      <div
        className="
          max-h-[425px]
          overflow-y-auto
          overscroll-contain
          px-4
          pb-4
          scrollbar-thin
          scrollbar-track-transparent
          scrollbar-thumb-slate-700
          hover:scrollbar-thumb-slate-600
        "
        style={{
          scrollbarWidth:
            "thin",

          scrollbarColor:
            "#334155 transparent",
        }}
      >

        {/* ===================================================
            IP ADDRESS
        =================================================== */}

        <div
          className="
            mb-4
            mt-4
            rounded-xl
            border
            border-white/10
            bg-white/[0.03]
            p-3
          "
        >

          <div
            className="
              mb-1
              text-[10px]
              uppercase
              tracking-[0.18em]
              text-slate-500
            "
          >
            IP address
          </div>


          <div
            className="
              break-all
              font-mono
              text-sm
              font-semibold
              text-white
            "
          >
            {node.ip}
          </div>


          <div
            className={`
              mt-2
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              ${
                critical
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
              }
            `}
          >

            {critical ? (
              <AlertTriangle
                size={11}
              />
            ) : (
              <CircleDot
                size={11}
              />
            )}

            {critical
              ? "Critical / Attacked"
              : "Normal"}

          </div>

        </div>


        {/* ===================================================
            ATTACK ACTIVITY
        =================================================== */}

        {critical && (
          <div
            className="
              mb-4
              rounded-xl
              border
              border-red-500/20
              bg-red-500/[0.06]
              p-3
            "
          >

            <div
              className="
                mb-2
                flex
                items-center
                gap-2
                text-xs
                font-semibold
                text-red-300
              "
            >

              <Zap
                size={14}
              />

              Attack activity

            </div>


            <div
              className="
                text-xl
                font-bold
                text-red-400
              "
            >
              {formatNumber(
                node.attack_flow_count
              )}
            </div>


            <div
              className="
                mt-0.5
                text-[10px]
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              attack flows
            </div>


            <div
              className="
                mt-3
                flex
                flex-wrap
                gap-1.5
              "
            >

              {(
                node.attack_categories ||
                []
              ).map(
                (category) => (

                  <span
                    key={category}
                    className="
                      rounded-md
                      border
                      border-red-500/20
                      bg-red-500/10
                      px-2
                      py-1
                      text-[10px]
                      font-medium
                      text-red-300
                    "
                  >
                    {category}
                  </span>

                )
              )}

            </div>

          </div>
        )}


        {/* ===================================================
            FLOW STATISTICS
        =================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-2
          "
        >

          <InfoBox
            label="Degree"
            value={formatNumber(
              node.degree
            )}
          />

          <InfoBox
            label="Total flows"
            value={formatNumber(
              node.total_flows
            )}
          />

          <InfoBox
            label="Incoming"
            value={formatNumber(
              node.incoming
            )}
          />

          <InfoBox
            label="Outgoing"
            value={formatNumber(
              node.outgoing
            )}
          />

        </div>


        {/* ===================================================
            ATTACK SOURCE / DESTINATION
        =================================================== */}

        {critical && (
          <div
            className="
              mt-3
              grid
              grid-cols-2
              gap-2
            "
          >

            <InfoBox
              label="Attack source flows"
              value={formatNumber(
                node.attack_source_flow_count
              )}
            />

            <InfoBox
              label="Attack destination flows"
              value={formatNumber(
                node.attack_destination_flow_count
              )}
            />

          </div>
        )}


        {/* ===================================================
            TRAINING GRAPH
        =================================================== */}

        <div
          className="
            mt-3
            rounded-xl
            border
            border-white/10
            bg-white/[0.025]
            p-3
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <span
              className="
                text-[10px]
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              Training graph
            </span>


            <span
              className={`
                text-[10px]
                font-semibold
                ${
                  node.has_training_edges
                    ? "text-cyan-400"
                    : "text-slate-500"
                }
              `}
            >
              {node.has_training_edges
                ? "CONNECTED"
                : "NO EDGES"}
            </span>

          </div>


          {!node.has_training_edges &&
            critical && (

              <p
                className="
                  mt-2
                  text-[10px]
                  leading-relaxed
                  text-slate-500
                "
              >
                This attacked network is
                included from the CICIDS2017
                test attack metadata but has
                no communication edge in the
                displayed training context.
              </p>

            )}

        </div>


        {/* ===================================================
            CONNECTION COUNT
        =================================================== */}

        {node.connection_count !==
          undefined && (

          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-white/10
              bg-white/[0.025]
              px-3
              py-3
              text-xs
            "
          >

            <span
              className="
                text-slate-500
              "
            >
              Connected networks
            </span>


            <span
              className="
                font-semibold
                text-white
              "
            >
              {formatNumber(
                node.connection_count
              )}
            </span>

          </div>

        )}


        {/* ===================================================
            CONNECTION LIST
        =================================================== */}

        {node.connections &&
          node.connections.length > 0 && (

            <div
              className="
                mt-3
                rounded-xl
                border
                border-white/10
                bg-white/[0.025]
                p-3
              "
            >

              <div
                className="
                  mb-3
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-slate-400
                  "
                >
                  Connections
                </span>


                <span
                  className="
                    rounded-md
                    bg-white/5
                    px-2
                    py-1
                    text-[9px]
                    text-slate-500
                  "
                >
                  {node.connections.length}
                </span>

              </div>


              <div
                className="
                  space-y-1.5
                "
              >

                {node.connections
                  .slice(0, 50)
                  .map(
                    (
                      connection
                    ) => (

                      <div
                        key={
                          connection.id
                        }
                        className="
                          flex
                          items-center
                          justify-between
                          rounded-lg
                          border
                          border-white/5
                          bg-black/10
                          px-2.5
                          py-2
                        "
                      >

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <div
                            className={`
                              truncate
                              font-mono
                              text-[10px]
                              ${
                                connection.critical
                                  ? "text-red-300"
                                  : "text-slate-300"
                              }
                            `}
                          >
                            {connection.ip}
                          </div>


                          <div
                            className="
                              mt-0.5
                              text-[8px]
                              text-slate-600
                            "
                          >
                            {formatNumber(
                              connection.degree
                            )}{" "}
                            connections
                          </div>

                        </div>


                        {connection.critical && (
                          <ShieldAlert
                            size={12}
                            className="
                              shrink-0
                              text-red-400
                            "
                          />
                        )}

                      </div>

                    )
                  )}

              </div>

            </div>

          )}


        {/* ===================================================
            SCROLL END
        =================================================== */}

        <div
          className="
            mt-4
            border-t
            border-white/5
            pt-3
            text-center
            text-[9px]
            uppercase
            tracking-wider
            text-slate-700
          "
        >
          CICIDS2017 network metadata
        </div>

      </div>

    </div>
  );
}


// ============================================================
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
}) {

  return (
    <div
      className="
        rounded-xl
        border
        border-white/10
        bg-white/[0.025]
        p-3
      "
    >

      <div
        className="
          text-[9px]
          uppercase
          tracking-wider
          text-slate-500
        "
      >
        {label}
      </div>


      <div
        className="
          mt-1
          break-words
          text-sm
          font-semibold
          text-slate-200
        "
      >
        {value}
      </div>

    </div>
  );
}


// ============================================================
// MAIN GRAPH
// ============================================================

export default function NetworkGraph() {

  const [
    graph,
    setGraph,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedNode,
    setSelectedNode,
  ] = useState(null);

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  const [
    showLegend,
    setShowLegend,
  ] = useState(true);


  // ==========================================================
  // LOAD GRAPH
  // ==========================================================

  useEffect(() => {

    let mounted = true;

    async function loadGraph() {

      try {

        setLoading(
          true
        );

        setError("");

        const response =
          await getNetworkGraph(
            GRAPH_LIMIT
          );

        if (!mounted) {
          return;
        }

        setGraph(
          response
        );

      } catch (err) {

        if (!mounted) {
          return;
        }

        console.error(
          "Network graph error:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load network graph."
        );

      } finally {

        if (mounted) {

          setLoading(
            false
          );

        }

      }

    }

    loadGraph();

    return () => {
      mounted = false;
    };

  }, []);


  // Global header search bridge: allow the topbar search to open/focus a node here.
  useEffect(() => {
    let cancelled = false;

    const onNetworkSearch = async (event) => {
      const ip = String(event?.detail?.ip || "").trim();
      if (!ip || cancelled) return;

      setSearchValue(ip);
      setSearchError("");
      setSearching(true);

      try {
        const response = await getNetworkNode(ip);
        if (cancelled) return;

        const foundNode = response?.node || response;
        const connections = response?.connections || [];
        const existingNode = graph?.nodes?.find((node) => node.ip === ip);

        if (existingNode) {
          setSelectedNode({ ...existingNode, ...foundNode, connections });
        } else {
          const newNode = { ...foundNode, searched: true, connections };
          setGraph((previous) => {
            if (!previous) return previous;
            if (previous.nodes.some((node) => node.ip === ip)) return previous;

            const nodes = [...previous.nodes, newNode];
            const existingIds = new Set(nodes.map((node) => Number(node.id)));
            const newEdges = [...previous.edges];

            connections.forEach((connection) => {
              const connectionId = Number(connection.id);
              if (!existingIds.has(connectionId)) return;
              const exists = newEdges.some((edge) =>
                (Number(edge.source) === Number(foundNode.id) && Number(edge.target) === connectionId) ||
                (Number(edge.source) === connectionId && Number(edge.target) === Number(foundNode.id))
              );
              if (!exists) {
                newEdges.push({
                  source: Number(foundNode.id),
                  target: connectionId,
                  source_ip: foundNode.ip,
                  target_ip: connection.ip,
                  attacked: Boolean(foundNode.critical || connection.critical),
                  searched: true,
                });
              }
            });

            return { ...previous, nodes, edges: newEdges, displayed_nodes: nodes.length, displayed_edges: newEdges.length };
          });
          setSelectedNode(newNode);
        }

        setSearchError("");
      } catch (err) {
        if (!cancelled) {
          setSearchError(err?.response?.data?.detail || `IP address ${ip} was not found in the CICIDS2017 graph.`);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    window.addEventListener("gnn:network-search", onNetworkSearch);
    return () => {
      cancelled = true;
      window.removeEventListener("gnn:network-search", onNetworkSearch);
    };
  }, [graph]);


  // ==========================================================
  // CRITICAL / NORMAL
  // ==========================================================

  const criticalNodes =
    useMemo(
      () =>
        (
          graph?.nodes ||
          []
        ).filter(
          (node) =>
            Boolean(
              node.critical
            )
        ),
      [graph]
    );


  const normalNodes =
    useMemo(
      () =>
        (
          graph?.nodes ||
          []
        ).filter(
          (node) =>
            !node.critical
        ),
      [graph]
    );


  // ==========================================================
  // SVG
  // ==========================================================

  const width = 900;

  const height = 520;


  // ==========================================================
  // POSITIONS
  // ==========================================================

  const positions =
    useMemo(() => {

      if (!graph?.nodes) {
        return {};
      }

      const result = {};


      criticalNodes.forEach(
        (node, index) => {

          result[
            node.id
          ] =
            getNodePosition(
              node,
              index,
              criticalNodes.length,
              width,
              height
            );

        }
      );


      normalNodes.forEach(
        (node, index) => {

          result[
            node.id
          ] =
            getNodePosition(
              node,
              index,
              normalNodes.length,
              width,
              height
            );

        }
      );


      return result;

    }, [
      graph,
      criticalNodes,
      normalNodes,
    ]);


  // ==========================================================
  // SEARCH
  // ==========================================================

  async function handleSearch(
    event
  ) {

    event?.preventDefault();

    const ip =
      searchValue.trim();

    if (!ip) {
      return;
    }


    try {

      setSearching(
        true
      );

      setSearchError("");


      const response =
        await getNetworkNode(
          ip
        );


      const foundNode =
        response.node;


      const existingNode =
        graph?.nodes?.find(
          (node) =>
            node.ip === ip
        );


      if (existingNode) {

        setSelectedNode(
          {
            ...existingNode,
            ...foundNode,
          }
        );

        setSearching(
          false
        );

        return;
      }


      const newNode = {
        ...foundNode,
        searched: true,
        connections:
          response.connections ||
          [],
      };


      setGraph(
        (previous) => {

          if (!previous) {
            return previous;
          }


          const nodeExists =
            previous.nodes.some(
              (node) =>
                node.ip === ip
            );


          if (nodeExists) {
            return previous;
          }


          const nodes = [
            ...previous.nodes,
            newNode,
          ];


          const existingIds =
            new Set(
              nodes.map(
                (node) =>
                  Number(
                    node.id
                  )
              )
            );


          const newEdges = [
            ...previous.edges,
          ];


          (
            response.connections ||
            []
          ).forEach(
            (
              connection
            ) => {

              const connectionId =
                Number(
                  connection.id
                );


              if (
                !existingIds.has(
                  connectionId
                )
              ) {
                return;
              }


              const alreadyExists =
                newEdges.some(
                  (edge) =>
                    (
                      Number(
                        edge.source
                      ) ===
                      Number(
                        foundNode.id
                      ) &&
                      Number(
                        edge.target
                      ) ===
                      connectionId
                    )
                    ||
                    (
                      Number(
                        edge.source
                      ) ===
                      connectionId &&
                      Number(
                        edge.target
                      ) ===
                      Number(
                        foundNode.id
                      )
                    )
                );


              if (
                alreadyExists
              ) {
                return;
              }


              newEdges.push(
                {
                  source:
                    Number(
                      foundNode.id
                    ),

                  target:
                    connectionId,

                  source_ip:
                    foundNode.ip,

                  target_ip:
                    connection.ip,

                  attacked:
                    Boolean(
                      foundNode.critical ||
                      connection.critical
                    ),

                  searched:
                    true,
                }
              );

            }
          );


          return {
            ...previous,

            nodes,

            edges:
              newEdges,

            displayed_nodes:
              nodes.length,

            displayed_edges:
              newEdges.length,
          };

        }
      );


      setSelectedNode(
        newNode
      );

      setSearchValue("");

    } catch (err) {

      console.error(
        "IP search error:",
        err
      );

      setSearchError(
        err?.response?.data?.detail ||
        `IP address ${ip} was not found in the CICIDS2017 graph.`
      );

    } finally {

      setSearching(
        false
      );

    }

  }


  // ==========================================================
  // NODE CLICK
  // ==========================================================

  async function handleNodeClick(
    node
  ) {

    try {

      const response =
        await getNetworkNode(
          node.ip
        );


      setSelectedNode(
        {
          ...node,
          ...response.node,
          connections:
            response.connections ||
            [],
        }
      );

    } catch {

      setSelectedNode(
        node
      );

    }

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div
        className="
          flex
          min-h-[500px]
          items-center
          justify-center
          rounded-2xl
          border
          border-red-500/20
          bg-[#080d1d]
        "
      >

        <div
          className="
            max-w-md
            text-center
          "
        >

          <div
            className="
              mx-auto
              mb-4
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              border
              border-red-500/20
              bg-red-500/10
            "
          >

            <ShieldAlert
              className="text-red-400"
              size={22}
            />

          </div>


          <h3
            className="
              text-sm
              font-semibold
              text-white
            "
          >
            Network graph unavailable
          </h3>


          <p
            className="
              mt-2
              text-xs
              leading-relaxed
              text-slate-500
            "
          >
            {error}
          </p>

        </div>

      </div>
    );

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div
        className="
          flex
          min-h-[500px]
          items-center
          justify-center
          rounded-2xl
          border
          border-white/10
          bg-[#080d1d]
        "
      >

        <div
          className="
            text-center
          "
        >

          <div
            className="
              mx-auto
              mb-4
              h-10
              w-10
              animate-spin
              rounded-full
              border-2
              border-white/10
              border-t-cyan-400
            "
          />

          <p
            className="
              text-xs
              text-slate-500
            "
          >
            Loading CICIDS2017 network graph...
          </p>

        </div>

      </div>
    );

  }


  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-[#05091a]
      "
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          relative
          z-20
          flex
          flex-col
          gap-3
          border-b
          border-white/10
          bg-[#080d1d]/90
          px-5
          py-4
          backdrop-blur-xl
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                border
                border-cyan-500/20
                bg-cyan-500/10
              "
            >

              <Network
                size={16}
                className="text-cyan-400"
              />

            </div>


            <div>

              <h3
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >
                Network Topology
              </h3>


              <p
                className="
                  text-[10px]
                  text-slate-500
                "
              >
                CICIDS2017 communication graph
              </p>

            </div>

          </div>

        </div>


        {/* SEARCH */}

        <form
          onSubmit={
            handleSearch
          }
          className="
            flex
            w-full
            max-w-sm
            items-center
            gap-2
          "
        >

          <div
            className="
              relative
              flex-1
            "
          >

            <Search
              size={14}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-500
              "
            />


            <input
              value={
                searchValue
              }
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              placeholder="Search IP address..."
              className="
                h-10
                w-full
                min-w-0
                rounded-lg
                border
                border-white/10
                bg-white/[0.04]
                pl-9
                pr-3
                text-xs
                text-white
                outline-none
                placeholder:text-slate-600
                focus:border-cyan-500/40
                focus:bg-white/[0.06]
              "
            />

          </div>


          <button
            type="submit"
            disabled={
              searching ||
              !searchValue.trim()
            }
            className="
              flex
              min-h-10
              min-w-20
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-cyan-500/20
              bg-cyan-500/10
              px-3
              text-xs
              font-medium
              text-cyan-300
              transition
              hover:bg-cyan-500/15
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >

            <Search
              size={13}
            />

            {searching
              ? "Searching..."
              : "Find"}

          </button>

        </form>

      </div>


      {/* SEARCH ERROR */}

      {searchError && (

        <div
          className="
            relative
            z-20
            flex
            items-center
            justify-between
            border-b
            border-red-500/20
            bg-red-500/[0.06]
            px-5
            py-2.5
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-red-300
            "
          >

            <AlertTriangle
              size={13}
            />

            {searchError}

          </div>


          <button
            type="button"
            onClick={() =>
              setSearchError("")
            }
            className="
              text-red-400
              hover:text-white
            "
          >

            <X size={14} />

          </button>

        </div>

      )}


      {/* =====================================================
          GRAPH
      ===================================================== */}

      <div
        className="
          relative
          h-[520px]
          w-full
          overflow-hidden
        "
      >

        {/* GRID */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-40
          "
          style={{
            backgroundImage:
              `
                linear-gradient(
                  rgba(100,116,139,0.08)
                  1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  rgba(100,116,139,0.08)
                  1px,
                  transparent 1px
                )
              `,
            backgroundSize:
              "40px 40px",
          }}
        />


        {/* CENTER GLOW */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-[320px]
            w-[520px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-cyan-500/[0.025]
            blur-3xl
          "
        />


        {/* SVG */}

        <svg
          viewBox={`
            0 0
            ${width}
            ${height}
          `}
          className="
            relative
            z-10
            h-full
            w-full
          "
          preserveAspectRatio="xMidYMid meet"
        >

          {/* EDGES */}

          <g>

            {(
              graph?.edges ||
              []
            ).map(
              (
                edge,
                index
              ) => {

                const source =
                  positions[
                    Number(
                      edge.source
                    )
                  ];

                const target =
                  positions[
                    Number(
                      edge.target
                    )
                  ];


                if (
                  !source ||
                  !target
                ) {
                  return null;
                }


                const attacked =
                  Boolean(
                    edge.attacked
                  );


                return (
                  <line
                    key={`
                      edge-
                      ${edge.source}-
                      ${edge.target}-
                      ${index}
                    `}
                    x1={
                      source.x
                    }
                    y1={
                      source.y
                    }
                    x2={
                      target.x
                    }
                    y2={
                      target.y
                    }
                    stroke={
                      attacked
                        ? "#ef4444"
                        : "#334155"
                    }
                    strokeWidth={
                      attacked
                        ? 0.9
                        : 0.8
                    }
                    strokeOpacity={
                      attacked
                        ? 0.34
                        : 0.24
                    }
                    strokeDasharray={
                      attacked
                        ? "4 6"
                        : undefined
                    }
                    className={
                      attacked
                        ? "network-attack-edge"
                        : "network-normal-edge"
                    }
                  />
                );

              }
            )}

          </g>


          {/* NODES */}

          <g>

            {(
              graph?.nodes ||
              []
            ).map(
              (
                node
              ) => {

                const position =
                  positions[
                    Number(
                      node.id
                    )
                  ];


                if (!position) {
                  return null;
                }


                const critical =
                  Boolean(
                    node.critical
                  );


                const size =
                  getNodeSize(
                    node
                  );


                const labelY =
                  position.y +
                  size +
                  17;


                const connectionLabel =
                  critical
                    ? `${formatNumber(
                        node.attack_flow_count
                      )} attack flows`
                    : `${formatNumber(
                        node.degree
                      )} connections`;


                return (
                  <g
                    key={
                      node.id
                    }
                    transform={`
                      translate(
                        ${position.x}
                        ${position.y}
                      )
                    `}
                    onClick={() =>
                      handleNodeClick(
                        node
                      )
                    }
                    className="
                      cursor-pointer
                    "
                  >

                    {/* OUTER RING */}

                    <circle
                      r={
                        size +
                        (
                          critical
                            ? 9
                            : 5
                        )
                      }
                      fill="none"
                      stroke={
                        critical
                          ? "#ef4444"
                          : "#334155"
                      }
                      strokeWidth={
                        critical
                          ? 1.2
                          : 0.8
                      }
                      strokeOpacity={
                        critical
                          ? 0.28
                          : 0.65
                      }
                    />


                    {/* CRITICAL GLOW */}

                    {critical && (

                      <circle
                        r={
                          size +
                          13
                        }
                        fill="#ef4444"
                        fillOpacity="0.035"
                        stroke="#ef4444"
                        strokeWidth="0.6"
                        strokeOpacity="0.12"
                      />

                    )}


                    {/* MAIN NODE */}

                    <circle
                      r={size}
                      fill={
                        critical
                          ? "#220b12"
                          : "#081827"
                      }
                      stroke={
                        critical
                          ? "#ef4444"
                          : "#2c485f"
                      }
                      strokeWidth={
                        critical
                          ? 1.8
                          : 1.3
                      }
                    />


                    {/* ICON */}

                    {critical ? (

                      <Shield
                        size={
                          size * 0.85
                        }
                        x={
                          -size *
                          0.42
                        }
                        y={
                          -size *
                          0.42
                        }
                        color="#f87171"
                        strokeWidth={1.5}
                      />

                    ) : (

                      <Database
                        size={
                          size * 0.82
                        }
                        x={
                          -size *
                          0.41
                        }
                        y={
                          -size *
                          0.41
                        }
                        color="#22d3ee"
                        strokeWidth={1.5}
                      />

                    )}


                    {/* PERSISTENT LABEL PLATE */}

                    <rect
                      x={
                        -Math.max(
                          42,
                          String(node.ip || "").length * 3.65
                        )
                      }
                      y={
                        labelY -
                        position.y -
                        10
                      }
                      width={
                        Math.max(
                          84,
                          String(node.ip || "").length * 7.3 + 10
                        )
                      }
                      height="27"
                      rx="4"
                      fill="#020609"
                      fillOpacity="0.90"
                      stroke={
                        critical
                          ? "#ef4444"
                          : "#334155"
                      }
                      strokeOpacity={
                        critical
                          ? 0.26
                          : 0.32
                      }
                      strokeWidth="0.7"
                    />

                    {/* IP */}

                    <text
                      x="0"
                      y={
                        labelY -
                        position.y
                      }
                      textAnchor="middle"
                      fill={
                        critical
                          ? "#fecaca"
                          : "#e2e8f0"
                      }
                      fontSize={
                        critical
                          ? 11
                          : 10
                      }
                      fontFamily="Inter, Arial, sans-serif"
                      fontWeight={
                        critical
                          ? 700
                          : 600
                      }
                      style={{
                        paintOrder: "stroke",
                        stroke: "#020609",
                        strokeWidth: 2.5,
                        strokeOpacity: 0.95,
                      }}
                    >
                      {node.ip}
                    </text>


                    {/* SECONDARY */}

                    <text
                      x="0"
                      y={
                        labelY -
                        position.y +
                        13
                      }
                      textAnchor="middle"
                      fill={
                        critical
                          ? "#f87171"
                          : "#8b9aa5"
                      }
                      fontSize="8.5"
                      fontFamily="Inter, Arial, sans-serif"
                      fontWeight="500"
                    >
                      {connectionLabel}
                    </text>

                  </g>
                );

              }
            )}

          </g>

        </svg>


        {/* ===================================================
            NODE DETAILS
        =================================================== */}

        {selectedNode && (

          <NodeDetails
            node={
              selectedNode
            }
            onClose={() =>
              setSelectedNode(
                null
              )
            }
          />

        )}


        {/* ===================================================
            LEGEND
        =================================================== */}

        {showLegend && (

          <div
            className="
              absolute
              bottom-4
              left-4
              z-20
              rounded-xl
              border
              border-white/10
              bg-[#080d1d]/90
              px-4
              py-3
              shadow-xl
              backdrop-blur-xl
            "
          >

            <div
              className="
                flex
                items-center
                gap-5
              "
            >

              <LegendItem
                type="normal"
                label="Normal"
              />

              <LegendItem
                type="critical"
                label="Critical / Attacked"
              />

              <LegendItem
                type="communication"
                label="Communication"
              />

              <LegendItem
                type="attack"
                label="Attack Path"
              />


              <button
                type="button"
                onClick={() =>
                  setShowLegend(
                    false
                  )
                }
                aria-label="Close network legend"
                className="
                  ml-3
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-white/10
                  bg-white/[0.02]
                  text-slate-500
                  transition
                  hover:border-white/20
                  hover:bg-white/[0.05]
                  hover:text-white
                "
              >

                <X size={13} />

              </button>

            </div>

          </div>

        )}


        {!showLegend && (

          <button
            type="button"
            onClick={() =>
              setShowLegend(
                true
              )
            }
            className="
              absolute
              bottom-4
              left-4
              z-20
              flex
              items-center
              gap-1.5
              rounded-lg
              border
              border-white/10
              bg-[#080d1d]/90
              min-h-10
              min-w-10
              px-3
              py-2
              text-xs
              text-slate-300
              backdrop-blur-xl
              hover:text-white
            "
          >

            <Crosshair
              size={12}
            />

            Legend

          </button>

        )}

      </div>


      {/* =====================================================
          FOOTER STATS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-2
          border-t
          border-white/10
          bg-[#080d1d]
          md:grid-cols-4
        "
      >

        <Stat
          label="Total nodes"
          value={formatNumber(
            graph?.total_graph_nodes
          )}
          icon={
            <Network
              size={14}
            />
          }
        />


        <Stat
          label="Graph edges"
          value={formatNumber(
            graph?.total_graph_edges
          )}
          icon={
            <CircleDot
              size={14}
            />
          }
        />


        <Stat
          label="Displayed"
          value={formatNumber(
            graph?.displayed_nodes
          )}
          icon={
            <Crosshair
              size={14}
            />
          }
          highlight
        />


        <Stat
          label="Critical"
          value={formatNumber(
            graph?.displayed_critical_nodes
          )}
          icon={
            <ShieldAlert
              size={14}
            />
          }
          danger
        />

      </div>


      {/* =====================================================
          DATA SOURCE
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-2
          border-t
          border-white/10
          bg-black/10
          px-5
          py-3
          text-xs
          text-slate-400
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <Database
            size={12}
            className="text-cyan-500"
          />

          <span>
            CICIDS2017 training communication
            graph + test attack metadata
          </span>

        </div>


        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <span>
            {graph?.displayed_critical_nodes || 0}
            {" "}
            critical networks
          </span>


          <span
            className="
              h-1
              w-1
              rounded-full
              bg-slate-700
            "
          />


          <span>
            {graph?.displayed_normal_nodes || 0}
            {" "}
            normal networks
          </span>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// LEGEND
// ============================================================

function LegendItem({
  type,
  label,
}) {

  let indicator = null;


  if (
    type === "normal"
  ) {

    indicator = (
      <span
        className="
          h-3
          w-3
          rounded-full
          border
          border-slate-500
          bg-[#081827]
        "
      />
    );

  } else if (
    type === "critical"
  ) {

    indicator = (
      <span
        className="
          h-3
          w-3
          rounded-full
          border
          border-red-500
          bg-red-500/10
        "
      />
    );

  } else if (
    type === "communication"
  ) {

    indicator = (
      <span
        className="
          h-[2px]
          w-6
          bg-slate-600
        "
      />
    );

  } else {

    indicator = (
      <span
        className="
          w-6
          border-t
          border-dashed
          border-red-500
        "
      />
    );

  }


  return (
    <div
      className="
        flex
        items-center
        gap-2
        whitespace-nowrap
        text-xs
        text-slate-300
      "
    >

      {indicator}

      {label}

    </div>
  );
}


// ============================================================
// STAT
// ============================================================

function Stat({
  label,
  value,
  icon,
  highlight,
  danger,
}) {

  return (
    <div
      className="
        flex
        min-h-[72px]
        items-center
        gap-3
        border-r
        border-white/10
        px-5
        last:border-r-0
      "
    >

      <div
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          border
          ${
            danger
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : highlight
                ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                : "border-white/10 bg-white/[0.03] text-slate-500"
          }
        `}
      >

        {icon}

      </div>


      <div>

        <div
          className="
            text-xs
            uppercase
            tracking-[0.14em]
            text-slate-500
          "
        >
          {label}
        </div>


        <div
          className={`
            mt-1
            text-lg
            font-semibold
            ${
              danger
                ? "text-red-400"
                : highlight
                  ? "text-cyan-400"
                  : "text-white"
            }
          `}
        >
          {value}
        </div>

      </div>

    </div>
  );
}