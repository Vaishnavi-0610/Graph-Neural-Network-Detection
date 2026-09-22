import json
import os

import numpy as np
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.inference_service import predict_flow
from services.inference_engine import engine
from dynamic_network import builder as dynamic_network_builder
from services.enterprise_evaluator import enterprise_evaluator
from services.lateral_movement_evaluator import lateral_movement_evaluator


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="CICIDS GNN Intrusion Detection API",
    version="1.0.0",
    description=(
        "Edge-aware GNN inference API for CICIDS2017 "
        "network intrusion detection."
    ),
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class PredictionRequest(BaseModel):
    source_ip: str
    destination_ip: str

    flow_features: list[float] = Field(
        ...,
        min_length=15,
        max_length=15,
    )


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

ARTIFACTS_DIR = os.path.join(
    BASE_DIR,
    "artifacts",
)

VERIFIED_FLOW_PATHS = [
    os.path.join(
        ARTIFACTS_DIR,
        "verified_portscan_flow.json",
    ),
    os.path.join(
        ARTIFACTS_DIR,
        "verified_test_flow.json",
    ),
]

ATTACK_NODES_PATH = os.path.join(
    ARTIFACTS_DIR,
    "attack_nodes.json",
)

NETWORK_STATISTICS_PATH = os.path.join(
    ARTIFACTS_DIR,
    "network_statistics.json",
)


# ============================================================
# ATTACK METADATA
# ============================================================

def load_attack_nodes():

    if not os.path.exists(
        ATTACK_NODES_PATH
    ):
        return {
            "available": False,
            "nodes": {},
            "categories": {},
            "total_attack_flows": 0,
            "total_attack_nodes": 0,
        }

    try:

        with open(
            ATTACK_NODES_PATH,
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        raw_nodes = data.get(
            "nodes",
            [],
        )

        nodes = {}

        if isinstance(
            raw_nodes,
            list,
        ):

            for item in raw_nodes:

                if not isinstance(
                    item,
                    dict,
                ):
                    continue

                ip = item.get(
                    "ip"
                )

                if not ip:
                    continue

                nodes[
                    str(ip)
                ] = item

        elif isinstance(
            raw_nodes,
            dict,
        ):

            nodes = raw_nodes

        return {
            "available": True,

            "nodes": nodes,

            "categories": data.get(
                "categories",
                {},
            ),

            "total_attack_flows": int(
                data.get(
                    "total_attack_flows",
                    0,
                )
            ),

            "total_attack_nodes": int(
                data.get(
                    "total_attack_nodes",
                    len(nodes),
                )
            ),
        }

    except Exception as error:

        print(
            "Failed to load attack_nodes.json:",
            error,
        )

        return {
            "available": False,
            "nodes": {},
            "categories": {},
            "total_attack_flows": 0,
            "total_attack_nodes": 0,
        }


# ============================================================
# NETWORK STATISTICS
# ============================================================

def load_network_statistics():

    if not os.path.exists(
        NETWORK_STATISTICS_PATH
    ):
        return {
            "available": False,
            "networks": {},
            "total_flows": 0,
            "total_attack_flows": 0,
            "total_benign_flows": 0,
            "total_networks": 0,
        }

    try:

        with open(
            NETWORK_STATISTICS_PATH,
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        raw_networks = data.get(
            "networks",
            [],
        )

        networks = {}

        if isinstance(
            raw_networks,
            list,
        ):

            for item in raw_networks:

                if not isinstance(
                    item,
                    dict,
                ):
                    continue

                ip = item.get(
                    "ip"
                )

                if not ip:
                    continue

                networks[
                    str(ip)
                ] = item

        elif isinstance(
            raw_networks,
            dict,
        ):

            networks = raw_networks

        return {
            "available": True,

            "networks": networks,

            "total_flows": int(
                data.get(
                    "total_flows",
                    0,
                )
            ),

            "total_attack_flows": int(
                data.get(
                    "total_attack_flows",
                    0,
                )
            ),

            "total_benign_flows": int(
                data.get(
                    "total_benign_flows",
                    0,
                )
            ),

            "total_networks": int(
                data.get(
                    "total_networks",
                    len(networks),
                )
            ),
        }

    except Exception as error:

        print(
            "Failed to load network_statistics.json:",
            error,
        )

        return {
            "available": False,
            "networks": {},
            "total_flows": 0,
            "total_attack_flows": 0,
            "total_benign_flows": 0,
            "total_networks": 0,
        }


# ============================================================
# LOAD METADATA
# ============================================================

ATTACK_METADATA = load_attack_nodes()

NETWORK_METADATA = load_network_statistics()


# ============================================================
# REFRESH
# ============================================================

def refresh_metadata():

    global ATTACK_METADATA
    global NETWORK_METADATA

    ATTACK_METADATA = load_attack_nodes()

    NETWORK_METADATA = load_network_statistics()


# ============================================================
# REVERSE NODE MAPPING
# ============================================================

def get_reverse_mapping():

    return {
        int(node_id): str(ip)
        for ip, node_id
        in engine.node_mapping.items()
    }


# ============================================================
# GRAPH STATISTICS
# ============================================================

def build_graph_statistics():

    edge_index = engine.context_edge_index

    if (
        edge_index is None
        or edge_index.ndim != 2
        or edge_index.shape[0] != 2
    ):
        return None

    source_nodes = np.asarray(
        edge_index[0],
        dtype=np.int64,
    )

    destination_nodes = np.asarray(
        edge_index[1],
        dtype=np.int64,
    )

    node_count = len(
        engine.node_mapping
    )

    degrees = np.zeros(
        node_count,
        dtype=np.int64,
    )

    outgoing = np.zeros(
        node_count,
        dtype=np.int64,
    )

    incoming = np.zeros(
        node_count,
        dtype=np.int64,
    )

    if len(source_nodes) > 0:

        np.add.at(
            degrees,
            source_nodes,
            1,
        )

        np.add.at(
            degrees,
            destination_nodes,
            1,
        )

        np.add.at(
            outgoing,
            source_nodes,
            1,
        )

        np.add.at(
            incoming,
            destination_nodes,
            1,
        )

    return {
        "edge_index": edge_index,

        "source_nodes":
            source_nodes,

        "destination_nodes":
            destination_nodes,

        "degrees":
            degrees,

        "outgoing":
            outgoing,

        "incoming":
            incoming,

        "reverse_mapping":
            get_reverse_mapping(),
    }


# ============================================================
# NODE CONNECTIONS
# ============================================================

def get_node_connections(
    node_id: int,
):

    edge_index = engine.context_edge_index

    if edge_index is None:
        return set()

    source_nodes = np.asarray(
        edge_index[0],
        dtype=np.int64,
    )

    destination_nodes = np.asarray(
        edge_index[1],
        dtype=np.int64,
    )

    connections = set()

    source_mask = (
        source_nodes == node_id
    )

    destination_mask = (
        destination_nodes == node_id
    )

    for connected_id in (
        destination_nodes[
            source_mask
        ]
    ):

        connections.add(
            int(connected_id)
        )

    for connected_id in (
        source_nodes[
            destination_mask
        ]
    ):

        connections.add(
            int(connected_id)
        )

    connections.discard(
        int(node_id)
    )

    return connections


# ============================================================
# IP METADATA
# ============================================================

def get_ip_metadata(
    ip: str,
):

    attack_item = (
        ATTACK_METADATA[
            "nodes"
        ].get(ip)
    )

    network_item = (
        NETWORK_METADATA[
            "networks"
        ].get(ip)
    )

    attack_flow_count = 0
    attack_source_flows = 0
    attack_destination_flows = 0
    attack_categories = []

    total_flows = 0
    incoming_flows = 0
    outgoing_flows = 0
    connected_ips = []

    # --------------------------------------------------------
    # ATTACK DATA
    # --------------------------------------------------------

    if attack_item:

        attack_flow_count = int(
            attack_item.get(
                "attack_flow_count",
                attack_item.get(
                    "attacks",
                    0,
                ),
            )
        )

        attack_source_flows = int(
            attack_item.get(
                "attack_source_flow_count",
                attack_item.get(
                    "source_attack_flows",
                    0,
                ),
            )
        )

        attack_destination_flows = int(
            attack_item.get(
                "attack_destination_flow_count",
                attack_item.get(
                    "destination_attack_flows",
                    0,
                ),
            )
        )

        categories = attack_item.get(
            "attack_categories",
            attack_item.get(
                "categories",
                [],
            ),
        )

        if isinstance(
            categories,
            str,
        ):

            attack_categories = [
                categories
            ]

        else:

            attack_categories = sorted(
                list(
                    set(
                        str(category)
                        for category
                        in categories
                    )
                )
            )

    # --------------------------------------------------------
    # NETWORK DATA
    # --------------------------------------------------------

    if network_item:

        total_flows = int(
            network_item.get(
                "total_flows",
                network_item.get(
                    "flows",
                    0,
                ),
            )
        )

        incoming_flows = int(
            network_item.get(
                "incoming_flows",
                network_item.get(
                    "incoming",
                    0,
                ),
            )
        )

        outgoing_flows = int(
            network_item.get(
                "outgoing_flows",
                network_item.get(
                    "outgoing",
                    0,
                ),
            )
        )

        connected_ips = list(
            network_item.get(
                "connected_ips",
                [],
            )
        )

    critical = (
        attack_flow_count > 0
    )

    return {
        "critical":
            critical,

        "status":
            (
                "CRITICAL"
                if critical
                else "NORMAL"
            ),

        "attack_flow_count":
            attack_flow_count,

        "attack_source_flow_count":
            attack_source_flows,

        "attack_destination_flow_count":
            attack_destination_flows,

        "attack_categories":
            attack_categories,

        "total_flows":
            total_flows,

        "incoming_flows":
            incoming_flows,

        "outgoing_flows":
            outgoing_flows,

        "connected_ips":
            connected_ips,
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
            "CICIDS GNN Intrusion Detection API",

        "status":
            "online",

        "model":
            "TemporalEdgeGNN",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status":
            "healthy",

        "model":
            "TemporalEdgeGNN",

        "framework":
            "PyTorch",

        "device":
            "CPU",

        "inference_ready":
            True,

        "attack_metadata_available":
            ATTACK_METADATA[
                "available"
            ],

        "network_metadata_available":
            NETWORK_METADATA[
                "available"
            ],

        "critical_networks":
            ATTACK_METADATA[
                "total_attack_nodes"
            ],
    }


# ============================================================
# MODEL INFO
# ============================================================

@app.get("/model-info")
def model_info():

    return {
        "model":
            "TemporalEdgeGNN",

        "model_type":
            "Edge-Aware Graph Neural Network",

        "framework":
            "PyTorch",

        "dataset":
            "CICIDS2017",

        "evaluation":
            "Unseen Attack Category / Zero-Day-Style Evaluation",

        "node_count":
            19129,

        "node_features":
            12,

        "context_edges":
            62538,

        "edge_features":
            15,

        "embedding_dimension":
            64,

        "hidden_dimension":
            64,

        "classifier":
            "64 -> 32 -> 1",

        "dropout":
            0.30,

        "optimizer":
            "Adam",

        "learning_rate":
            0.001,

        "weight_decay":
            0.0001,

        "threshold":
            round(
                float(
                    engine.threshold
                ),
                6,
            ),

        "parameters":
            35137,

        "device":
            "CPU",

        "test_flows":
            703198,

        "test_accuracy":
            0.9968,

        "test_precision":
            0.9989,

        "test_recall":
            0.9932,

        "test_f1":
            0.9960,

        "test_roc_auc":
            0.9976,

        "test_pr_auc":
            0.9974,

        "unseen_categories": [
            {
                "name":
                    "DDoS",

                "total":
                    128027,

                "detected":
                    128024,

                "missed":
                    3,

                "recall":
                    0.99997656,
            },

            {
                "name":
                    "PortScan",

                "total":
                    158930,

                "detected":
                    158930,

                "missed":
                    0,

                "recall":
                    1.0,
            },

            {
                "name":
                    "Bot",

                "total":
                    1966,

                "detected":
                    0,

                "missed":
                    1966,

                "recall":
                    0.0,
            },
        ],
    }


# ============================================================
# FEATURES
# ============================================================

@app.get("/features")
def features():

    return {
        "features": [
            "Flow Duration",
            "Total Fwd Packets",
            "Total Backward Packets",
            "Total Length of Fwd Packets",
            "Total Length of Bwd Packets",
            "Fwd Packet Length Mean",
            "Bwd Packet Length Mean",
            "Flow Bytes/s",
            "Flow Packets/s",
            "Flow IAT Mean",
            "Packet Length Mean",
            "Packet Length Std",
            "SYN Flag Count",
            "ACK Flag Count",
            "Average Packet Size",
        ]
    }


# ============================================================
# VERIFIED FLOW
# ============================================================

@app.get("/verified-flow")
def verified_flow():

    selected_path = None

    for path in VERIFIED_FLOW_PATHS:

        if os.path.exists(path):

            selected_path = path

            break

    if selected_path is None:

        return {
            "status":
                "unavailable",

            "message":
                "Verified test-flow artifact is not installed.",
        }

    try:

        with open(
            selected_path,
            "r",
            encoding="utf-8",
        ) as file:

            flow = json.load(
                file
            )

        return {
            "status":
                "available",

            **flow,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# NETWORK GRAPH
# ============================================================

@app.get("/network-graph")
def network_graph(
    limit: int = Query(
        default=24,
        ge=8,
        le=40,
    ),
):

    statistics = (
        build_graph_statistics()
    )

    if statistics is None:

        return {
            "status":
                "unavailable",

            "message":
                "Training graph context is not available.",
        }

    edge_index = statistics[
        "edge_index"
    ]

    source_nodes = statistics[
        "source_nodes"
    ]

    destination_nodes = statistics[
        "destination_nodes"
    ]

    degrees = statistics[
        "degrees"
    ]

    outgoing = statistics[
        "outgoing"
    ]

    incoming = statistics[
        "incoming"
    ]

    reverse_mapping = statistics[
        "reverse_mapping"
    ]

    # ========================================================
    # ALL CRITICAL IPs
    #
    # IMPORTANT:
    # Critical IPs are taken from the TEST attack metadata.
    #
    # They are intentionally included even when they have
    # zero degree in the training communication graph.
    # ========================================================

    critical_ips = list(
        ATTACK_METADATA[
            "nodes"
        ].keys()
    )

    critical_node_ids = []

    for ip in critical_ips:

        node_id = (
            engine.node_mapping.get(
                ip
            )
        )

        if node_id is None:
            continue

        critical_node_ids.append(
            int(node_id)
        )

    critical_node_ids = list(
        dict.fromkeys(
            critical_node_ids
        )
    )

    critical_set = set(
        critical_node_ids
    )

    # ========================================================
    # SORT CRITICAL NODES BY ATTACK COUNT
    # ========================================================

    critical_node_ids.sort(
        key=lambda node_id: int(
            ATTACK_METADATA[
                "nodes"
            ].get(
                reverse_mapping.get(
                    node_id,
                    "",
                ),
                {},
            ).get(
                "attack_flow_count",
                ATTACK_METADATA[
                    "nodes"
                ].get(
                    reverse_mapping.get(
                        node_id,
                        "",
                    ),
                    {},
                ).get(
                    "attacks",
                    0,
                ),
            )
        ),
        reverse=True,
    )

    # ========================================================
    # NORMAL ACTIVE NODES
    # ========================================================

    active_nodes = np.where(
        degrees > 0
    )[0]

    normal_nodes = [
        int(node_id)
        for node_id in active_nodes
        if int(node_id)
        not in critical_set
    ]

    normal_nodes.sort(
        key=lambda node_id: int(
            degrees[
                node_id
            ]
        ),
        reverse=True,
    )

    # ========================================================
    # SELECT NODES
    #
    # ALL CRITICAL NODES ARE ALWAYS INCLUDED.
    # Remaining slots are occupied by normal nodes.
    # ========================================================

    selected_critical = list(
        critical_node_ids
    )

    remaining_slots = max(
        0,
        limit -
        len(
            selected_critical
        ),
    )

    selected_normal = (
        normal_nodes[
            :remaining_slots
        ]
    )

    selected_nodes = (
        selected_critical
        +
        selected_normal
    )

    selected_set = set(
        selected_nodes
    )

    # ========================================================
    # BUILD EDGES
    # ========================================================

    selected_edges = []

    for source, destination in zip(
        source_nodes,
        destination_nodes,
    ):

        source = int(
            source
        )

        destination = int(
            destination
        )

        if (
            source not in selected_set
            or
            destination not in selected_set
        ):
            continue

        source_ip = (
            reverse_mapping.get(
                source,
                f"node-{source}",
            )
        )

        destination_ip = (
            reverse_mapping.get(
                destination,
                f"node-{destination}",
            )
        )

        source_metadata = (
            get_ip_metadata(
                source_ip
            )
        )

        destination_metadata = (
            get_ip_metadata(
                destination_ip
            )
        )

        attacked = (
            source_metadata[
                "critical"
            ]
            or
            destination_metadata[
                "critical"
            ]
        )

        selected_edges.append(
            {
                "source":
                    source,

                "target":
                    destination,

                "source_ip":
                    source_ip,

                "target_ip":
                    destination_ip,

                "attacked":
                    attacked,
            }
        )

    # ========================================================
    # BUILD NODES
    # ========================================================

    nodes = []

    for rank, node_id in enumerate(
        selected_nodes,
        start=1,
    ):

        node_id = int(
            node_id
        )

        ip = reverse_mapping.get(
            node_id,
            f"node-{node_id}",
        )

        metadata = (
            get_ip_metadata(
                ip
            )
        )

        nodes.append(
            {
                "id":
                    node_id,

                "ip":
                    ip,

                "degree":
                    int(
                        degrees[
                            node_id
                        ]
                    ),

                "incoming":
                    int(
                        incoming[
                            node_id
                        ]
                    ),

                "outgoing":
                    int(
                        outgoing[
                            node_id
                        ]
                    ),

                "rank":
                    rank,

                "critical":
                    bool(
                        metadata[
                            "critical"
                        ]
                    ),

                "status":
                    metadata[
                        "status"
                    ],

                "attack_flow_count":
                    int(
                        metadata[
                            "attack_flow_count"
                        ]
                    ),

                "attack_source_flow_count":
                    int(
                        metadata[
                            "attack_source_flow_count"
                        ]
                    ),

                "attack_destination_flow_count":
                    int(
                        metadata[
                            "attack_destination_flow_count"
                        ]
                    ),

                "attack_categories":
                    metadata[
                        "attack_categories"
                    ],

                "total_flows":
                    int(
                        metadata[
                            "total_flows"
                        ]
                    ),

                "has_training_edges":
                    bool(
                        degrees[
                            node_id
                        ] > 0
                    ),
            }
        )

    # ========================================================
    # STATISTICS
    # ========================================================

    displayed_critical = sum(
        1
        for node
        in nodes
        if node[
            "critical"
        ]
    )

    displayed_normal = (
        len(nodes)
        -
        displayed_critical
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "status":
            "available",

        "source":
            (
                "CICIDS2017 training communication graph "
                "+ CICIDS2017 test attack metadata"
            ),

        "graph_type":
            "Training Communication Graph",

        "total_graph_nodes":
            int(
                len(
                    engine.node_mapping
                )
            ),

        "total_graph_edges":
            int(
                edge_index.shape[
                    1
                ]
            ),

        "displayed_nodes":
            int(
                len(nodes)
            ),

        "displayed_edges":
            int(
                len(
                    selected_edges
                )
            ),

        "displayed_critical_nodes":
            int(
                displayed_critical
            ),

        "displayed_normal_nodes":
            int(
                displayed_normal
            ),

        "critical_nodes_available":
            int(
                ATTACK_METADATA[
                    "total_attack_nodes"
                ]
            ),

        "attack_metadata_available":
            bool(
                ATTACK_METADATA[
                    "available"
                ]
            ),

        "network_metadata_available":
            bool(
                NETWORK_METADATA[
                    "available"
                ]
            ),

        "nodes":
            nodes,

        "edges":
            selected_edges,
    }


# ============================================================
# NETWORK NODE DETAILS
# ============================================================

@app.get(
    "/network-node/{ip_address}"
)
def network_node(
    ip_address: str,
):

    ip_address = (
        ip_address.strip()
    )

    if (
        ip_address
        not in
        engine.node_mapping
    ):

        raise HTTPException(
            status_code=404,

            detail=(
                f"IP address {ip_address} "
                "was not found in the CICIDS2017 graph."
            ),
        )

    node_id = int(
        engine.node_mapping[
            ip_address
        ]
    )

    statistics = (
        build_graph_statistics()
    )

    if statistics is None:

        raise HTTPException(
            status_code=503,

            detail=(
                "Network graph is unavailable."
            ),
        )

    degrees = statistics[
        "degrees"
    ]

    incoming = statistics[
        "incoming"
    ]

    outgoing = statistics[
        "outgoing"
    ]

    edge_index = statistics[
        "edge_index"
    ]

    reverse_mapping = statistics[
        "reverse_mapping"
    ]

    metadata = (
        get_ip_metadata(
            ip_address
        )
    )

    connection_ids = (
        get_node_connections(
            node_id
        )
    )

    connections = []

    for connection_id in connection_ids:

        connection_id = int(
            connection_id
        )

        if (
            connection_id < 0
            or
            connection_id >= len(
                degrees
            )
        ):
            continue

        connection_ip = (
            reverse_mapping.get(
                connection_id,
                f"node-{connection_id}",
            )
        )

        connection_metadata = (
            get_ip_metadata(
                connection_ip
            )
        )

        connections.append(
            {
                "id":
                    connection_id,

                "ip":
                    connection_ip,

                "degree":
                    int(
                        degrees[
                            connection_id
                        ]
                    ),

                "incoming":
                    int(
                        incoming[
                            connection_id
                        ]
                    ),

                "outgoing":
                    int(
                        outgoing[
                            connection_id
                        ]
                    ),

                "critical":
                    bool(
                        connection_metadata[
                            "critical"
                        ]
                    ),

                "status":
                    connection_metadata[
                        "status"
                    ],

                "attack_flow_count":
                    int(
                        connection_metadata[
                            "attack_flow_count"
                        ]
                    ),

                "attack_categories":
                    connection_metadata[
                        "attack_categories"
                    ],
            }
        )

    connections.sort(
        key=lambda item: (
            int(
                item[
                    "critical"
                ]
            ),
            item[
                "degree"
            ],
        ),
        reverse=True,
    )

    return {
        "status":
            "available",

        "node": {
            "id":
                node_id,

            "ip":
                ip_address,

            "degree":
                int(
                    degrees[
                        node_id
                    ]
                ),

            "incoming":
                int(
                    incoming[
                        node_id
                    ]
                ),

            "outgoing":
                int(
                    outgoing[
                        node_id
                    ]
                ),

            "total_flows":
                int(
                    metadata[
                        "total_flows"
                    ]
                ),

            "critical":
                bool(
                    metadata[
                        "critical"
                    ]
                ),

            "status":
                metadata[
                    "status"
                ],

            "attack_flow_count":
                int(
                    metadata[
                        "attack_flow_count"
                    ]
                ),

            "attack_source_flow_count":
                int(
                    metadata[
                        "attack_source_flow_count"
                    ]
                ),

            "attack_destination_flow_count":
                int(
                    metadata[
                        "attack_destination_flow_count"
                    ]
                ),

            "attack_categories":
                metadata[
                    "attack_categories"
                ],

            "connection_count":
                int(
                    len(
                        connections
                    )
                ),

            "has_training_edges":
                bool(
                    degrees[
                        node_id
                    ] > 0
                ),
        },

        "connections":
            connections,

        "graph": {
            "total_nodes":
                int(
                    len(
                        engine.node_mapping
                    )
                ),

            "total_edges":
                int(
                    edge_index.shape[
                        1
                    ]
                ),
        },

        "attack_metadata_available":
            bool(
                ATTACK_METADATA[
                    "available"
                ]
            ),

        "network_metadata_available":
            bool(
                NETWORK_METADATA[
                    "available"
                ]
            ),
    }


# ============================================================
# NETWORK METADATA
# ============================================================

@app.get(
    "/network-metadata"
)
def network_metadata():

    return {
        "attack_metadata_available":
            ATTACK_METADATA[
                "available"
            ],

        "network_metadata_available":
            NETWORK_METADATA[
                "available"
            ],

        "critical_networks":
            ATTACK_METADATA[
                "total_attack_nodes"
            ],

        "attack_flows":
            ATTACK_METADATA[
                "total_attack_flows"
            ],

        "metadata_total_flows":
            NETWORK_METADATA[
                "total_flows"
            ],

        "metadata_attack_flows":
            NETWORK_METADATA[
                "total_attack_flows"
            ],

        "metadata_benign_flows":
            NETWORK_METADATA[
                "total_benign_flows"
            ],

        "metadata_networks":
            NETWORK_METADATA[
                "total_networks"
            ],

        "categories":
            ATTACK_METADATA[
                "categories"
            ],
    }


# ============================================================
# REFRESH METADATA
# ============================================================

@app.post(
    "/refresh-network-metadata"
)
def refresh_network_metadata():

    refresh_metadata()

    return {
        "status":
            "refreshed",

        "attack_metadata_available":
            ATTACK_METADATA[
                "available"
            ],

        "network_metadata_available":
            NETWORK_METADATA[
                "available"
            ],

        "critical_nodes":
            ATTACK_METADATA[
                "total_attack_nodes"
            ],

        "attack_flows":
            ATTACK_METADATA[
                "total_attack_flows"
            ],
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict(
    request: PredictionRequest,
):

    return predict_flow(
        source_ip=
            request.source_ip,

        destination_ip=
            request.destination_ip,

        flow_features=
            request.flow_features,
    )

# ============================================================
# DYNAMIC NETWORK GRAPH
# ============================================================

@app.get("/dynamic-network")
def dynamic_network(
    window_minutes: int = Query(
        default=5,
        ge=1,
        le=60,
    ),
    max_snapshots: int = Query(
        default=200,
        ge=1,
        le=500,
    ),
    max_nodes: int = Query(
        default=60,
        ge=10,
        le=120,
    ),
):
    try:
        return dynamic_network_builder.build(
            window_minutes=window_minutes,
            max_snapshots=max_snapshots,
            max_nodes=max_nodes,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to build dynamic network snapshots: {exc}",
        ) from exc


# ============================================================
# SYNTHETIC LATERAL-MOVEMENT EVALUATION
# ============================================================

@app.get("/lateral-movement-evaluation")
def lateral_movement_evaluation():
    try:
        return lateral_movement_evaluator.evaluate()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lateral-movement evaluation failed: {exc}",
        ) from exc


@app.get("/lateral-movement-dataset")
def lateral_movement_dataset():
    try:
        frame = lateral_movement_evaluator.dataset()
        return {
            "status": "SUCCESS",
            "rows": frame.to_dict(orient="records"),
            "columns": list(frame.columns),
            "synthetic": True,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lateral-movement dataset generation failed: {exc}",
        ) from exc


# ============================================================
# ENTERPRISE CSV EVALUATION
# ============================================================

@app.post("/evaluate-enterprise")
async def evaluate_enterprise(
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A CSV file is required.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV is empty.",
        )

    try:
        return enterprise_evaluator.evaluate(
            content,
            file.filename,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Enterprise evaluation failed: {exc}",
        ) from exc
