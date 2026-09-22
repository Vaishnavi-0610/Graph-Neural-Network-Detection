import os
import pickle
from datetime import datetime, timezone

import numpy as np
import torch

from services.inference_engine import engine


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")


class DynamicNetworkBuilder:
    def __init__(self):
        self.edge_index = np.load(
            os.path.join(ARTIFACTS_DIR, "train_context_edge_index.npy")
        )
        self.edge_features = np.load(
            os.path.join(ARTIFACTS_DIR, "train_context_edge_features.npy")
        )
        self.edge_time = np.load(
            os.path.join(ARTIFACTS_DIR, "train_context_edge_time.npy")
        )

        with open(
            os.path.join(ARTIFACTS_DIR, "node_mapping.pkl"),
            "rb",
        ) as file:
            self.node_mapping = pickle.load(file)

        self.node_list = [None] * len(self.node_mapping)
        for ip, node_id in self.node_mapping.items():
            self.node_list[int(node_id)] = ip

        # Score the saved training-context edges with the already-trained
        # Edge-Aware GNN. This is visualization/investigation only; no
        # retraining is performed and timestamps are not used by the GNN.
        self.edge_predictions, self.edge_probabilities = self._score_context_edges()

    def _score_context_edges(self):
        edge_index = torch.tensor(
            self.edge_index,
            dtype=torch.long,
            device=engine.device,
        )
        edge_features = torch.tensor(
            self.edge_features,
            dtype=torch.float32,
            device=engine.device,
        )

        with torch.no_grad():
            source_embeddings = engine.node_embeddings[edge_index[0]]
            destination_embeddings = engine.node_embeddings[edge_index[1]]
            edge_input = torch.cat(
                [source_embeddings, destination_embeddings, edge_features],
                dim=1,
            )
            logits = engine.model.edge_classifier(edge_input).squeeze(1)
            probabilities = torch.sigmoid(logits).cpu().numpy()

        predictions = probabilities >= float(engine.threshold)
        return predictions, probabilities

    @staticmethod
    def _safe_number(value):
        value = float(value)
        if not np.isfinite(value):
            return 0.0
        return value

    @staticmethod
    def _format_time(timestamp):
        return datetime.fromtimestamp(
            int(timestamp),
            tz=timezone.utc,
        ).strftime("%Y-%m-%d %H:%M:%S UTC")

    @staticmethod
    def _build_suspicious_paths(edges, max_paths=12, max_hops=5):
        """Build short directed suspicious communication paths from scored edges.

        These are model-scored suspicious communication paths, not proof of
        lateral movement. Paths preserve the actual source -> destination
        direction present in the chronological graph.
        """
        suspicious = [
            edge
            for edge in edges
            if bool(edge.get("is_suspicious"))
        ]

        if not suspicious:
            return []

        adjacency = {}
        indegree = {}
        outdegree = {}

        for edge in suspicious:
            src = int(edge["source_id"])
            dst = int(edge["destination_id"])
            adjacency.setdefault(src, []).append(edge)
            outdegree[src] = outdegree.get(src, 0) + 1
            indegree[dst] = indegree.get(dst, 0) + 1
            indegree.setdefault(src, indegree.get(src, 0))
            outdegree.setdefault(dst, outdegree.get(dst, 0))

        for src in adjacency:
            adjacency[src].sort(
                key=lambda item: float(item.get("attack_probability", 0.0)),
                reverse=True,
            )

        starts = [
            node_id
            for node_id in adjacency
            if indegree.get(node_id, 0) == 0
        ]

        # If the suspicious graph contains cycles, start from high-confidence
        # nodes so we still get useful paths.
        if not starts:
            starts = sorted(
                adjacency,
                key=lambda node_id: max(
                    float(edge.get("attack_probability", 0.0))
                    for edge in adjacency[node_id]
                ),
                reverse=True,
            )

        paths = []
        seen_signatures = set()

        def walk(current, node_ids, path_edges, visited):
            if len(paths) >= max_paths:
                return

            if path_edges:
                signature = tuple(node_ids)
                if signature not in seen_signatures and len(node_ids) >= 2:
                    probabilities = [
                        float(edge.get("attack_probability", 0.0))
                        for edge in path_edges
                    ]
                    paths.append(
                        {
                            "path_id": len(paths) + 1,
                            "node_ids": list(node_ids),
                            "nodes": [
                                path_edges[0]["source"],
                                *[edge["destination"] for edge in path_edges],
                            ],
                            "hops": len(path_edges),
                            "suspicious_flows": int(
                                sum(int(edge.get("flows", 0)) for edge in path_edges)
                            ),
                            "max_probability": round(max(probabilities), 6),
                            "mean_probability": round(
                                sum(probabilities) / len(probabilities),
                                6,
                            ),
                            "status": "SUSPICIOUS",
                        }
                    )
                    seen_signatures.add(signature)

            if len(path_edges) >= max_hops:
                return

            for edge in adjacency.get(current, [])[:6]:
                nxt = int(edge["destination_id"])
                if nxt in visited:
                    continue
                walk(
                    nxt,
                    node_ids + [nxt],
                    path_edges + [edge],
                    visited | {nxt},
                )

        for start in starts[:20]:
            walk(start, [start], [], {start})
            if len(paths) >= max_paths:
                break

        # Highest-confidence paths first, while preserving path ids for UI.
        paths.sort(
            key=lambda item: (
                item["max_probability"],
                item["hops"],
                item["suspicious_flows"],
            ),
            reverse=True,
        )

        for index, path in enumerate(paths[:max_paths], start=1):
            path["path_id"] = index

        return paths[:max_paths]

    def build(
        self,
        window_minutes=5,
        max_snapshots=200,
        max_nodes=60,
    ):
        window_seconds = max(int(window_minutes), 1) * 60

        times = np.asarray(self.edge_time, dtype=np.int64)
        if len(times) == 0:
            return {
                "window_minutes": window_minutes,
                "total_snapshots": 0,
                "snapshots": [],
                "source": "train_context_edge_time",
            }

        order = np.argsort(times, kind="stable")
        sorted_times = times[order]
        first_time = int(sorted_times[0])

        bucket_ids = (sorted_times - first_time) // window_seconds
        unique_buckets = np.unique(bucket_ids)

        if len(unique_buckets) > max_snapshots:
            unique_buckets = unique_buckets[:max_snapshots]

        snapshots = []

        for bucket in unique_buckets:
            mask = bucket_ids == bucket
            indices = order[mask]
            if len(indices) == 0:
                continue

            start_ts = first_time + int(bucket) * window_seconds
            end_ts = start_ts + window_seconds

            edge_map = {}
            degree = {}
            node_flows = {}

            for original_index in indices:
                src = int(self.edge_index[0, original_index])
                dst = int(self.edge_index[1, original_index])

                if src < 0 or dst < 0:
                    continue
                if src >= len(self.node_list) or dst >= len(self.node_list):
                    continue

                src_ip = self.node_list[src]
                dst_ip = self.node_list[dst]
                if not src_ip or not dst_ip:
                    continue

                key = (src, dst)
                probability = float(self.edge_probabilities[original_index])
                suspicious = bool(self.edge_predictions[original_index])

                if key not in edge_map:
                    edge_map[key] = {
                        "source": src_ip,
                        "destination": dst_ip,
                        "source_id": src,
                        "destination_id": dst,
                        "flows": 0,
                        "first_seen": int(times[original_index]),
                        "last_seen": int(times[original_index]),
                        "max_probability": 0.0,
                        "suspicious_flows": 0,
                    }

                edge = edge_map[key]
                edge["flows"] += 1
                edge["last_seen"] = int(times[original_index])
                edge["max_probability"] = max(
                    edge["max_probability"],
                    probability,
                )
                if suspicious:
                    edge["suspicious_flows"] += 1

                degree[src] = degree.get(src, 0) + 1
                degree[dst] = degree.get(dst, 0) + 1
                node_flows[src] = node_flows.get(src, 0) + 1
                node_flows[dst] = node_flows.get(dst, 0) + 1

            if not edge_map:
                continue

            # Keep the most active nodes for a readable SOC visualization.
            ranked_nodes = sorted(
                degree,
                key=lambda node_id: degree[node_id],
                reverse=True,
            )[: max(int(max_nodes), 10)]
            visible_ids = set(ranked_nodes)

            visible_edges = []
            for edge in edge_map.values():
                if (
                    edge["source_id"] not in visible_ids
                    or edge["destination_id"] not in visible_ids
                ):
                    continue

                edge["attack_probability"] = round(
                    float(edge["max_probability"]),
                    6,
                )
                edge["is_suspicious"] = bool(
                    edge["suspicious_flows"] > 0
                )
                edge["prediction"] = (
                    "ATTACK" if edge["is_suspicious"] else "BENIGN"
                )
                edge["attack_rate"] = round(
                    edge["suspicious_flows"] / max(edge["flows"], 1),
                    6,
                )
                visible_edges.append(edge)

            visible_edges.sort(
                key=lambda edge: (
                    bool(edge["is_suspicious"]),
                    edge["flows"],
                ),
                reverse=True,
            )

            nodes = []
            for node_id in ranked_nodes:
                node_attack_edges = [
                    edge
                    for edge in visible_edges
                    if edge["source_id"] == node_id
                    or edge["destination_id"] == node_id
                ]
                suspicious_flows = sum(
                    int(edge["suspicious_flows"])
                    for edge in node_attack_edges
                )

                nodes.append(
                    {
                        "id": node_id,
                        "ip": self.node_list[node_id],
                        "flows": int(node_flows.get(node_id, 0)),
                        "degree": int(degree.get(node_id, 0)),
                        "suspicious_flows": int(suspicious_flows),
                        "status": "SUSPICIOUS" if suspicious_flows else "NORMAL",
                    }
                )

            suspicious_paths = self._build_suspicious_paths(
                visible_edges,
                max_paths=12,
                max_hops=5,
            )

            snapshots.append(
                {
                    "snapshot_id": len(snapshots),
                    "start_timestamp": start_ts,
                    "end_timestamp": end_ts,
                    "start_time": self._format_time(start_ts),
                    "end_time": self._format_time(end_ts),
                    "event_count": int(len(indices)),
                    "node_count": len(nodes),
                    "edge_count": len(visible_edges),
                    "total_unique_edges": len(edge_map),
                    "suspicious_edge_count": int(
                        sum(1 for edge in visible_edges if edge["is_suspicious"])
                    ),
                    "suspicious_flow_count": int(
                        sum(int(edge["suspicious_flows"]) for edge in visible_edges)
                    ),
                    "nodes": nodes,
                    "edges": visible_edges,
                    "suspicious_paths": suspicious_paths,
                }
            )

        return {
            "window_minutes": int(window_minutes),
            "total_snapshots": len(snapshots),
            "total_events": int(len(times)),
            "start_time": self._format_time(int(times.min())),
            "end_time": self._format_time(int(times.max())),
            "source": "CICIDS2017 training context chronological events",
            "threshold": float(engine.threshold),
            "note": (
                "Snapshots are constructed from saved chronological training-context "
                "edge events. Suspicious links are scored by the existing trained "
                "Edge-Aware GNN at the saved threshold. These paths indicate model-"
                "scored suspicious communication and are not proof of lateral movement. "
                "The current GNN does not perform recurrent temporal message passing."
            ),
            "snapshots": snapshots,
        }


builder = DynamicNetworkBuilder()