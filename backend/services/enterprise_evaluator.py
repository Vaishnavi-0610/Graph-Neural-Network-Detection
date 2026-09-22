import io
import os
import pickle
import time

import numpy as np
import pandas as pd
import torch

from models.model import TemporalEdgeGNN


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")


class EnterpriseEvaluator:
    def __init__(self):
        self.device = torch.device("cpu")

        self.model = TemporalEdgeGNN(
            node_features=12,
            edge_features=15,
            hidden=64,
        ).to(self.device)

        model_path = os.path.join(
            ARTIFACTS_DIR,
            "best_temporal_edge_gnn.pt",
        )

        checkpoint = torch.load(
            model_path,
            map_location=self.device,
            weights_only=False,
        )

        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            self.model.load_state_dict(
                checkpoint["model_state_dict"]
            )
        else:
            self.model.load_state_dict(checkpoint)

        self.model.eval()

        self.node_feature_mean = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "node_feature_mean.npy",
            )
        )

        self.node_feature_std = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "node_feature_std.npy",
            )
        )

        self.edge_feature_mean = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "edge_feature_mean.npy",
            )
        )

        self.edge_feature_std = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "edge_feature_std.npy",
            )
        )

        threshold_path = os.path.join(
            ARTIFACTS_DIR,
            "best_detection_threshold.npy",
        )

        self.threshold = float(
            np.asarray(
                np.load(threshold_path)
            ).reshape(-1)[0]
        )

    # ------------------------------------------------------------
    # COLUMN HELPERS
    # ------------------------------------------------------------

    def _find_column(self, df, candidates, required=True):
        normalized = {
            str(column).strip().lower(): column
            for column in df.columns
        }

        for candidate in candidates:
            key = candidate.strip().lower()

            if key in normalized:
                return normalized[key]

        if required:
            raise ValueError(
                "Required column not found. Expected one of: "
                + ", ".join(candidates)
            )

        return None

    def _numeric_column(
        self,
        df,
        candidates,
        default=0.0,
    ):
        column = self._find_column(
            df,
            candidates,
            required=False,
        )

        if column is None:
            return np.full(
                len(df),
                default,
                dtype=np.float64,
            )

        return pd.to_numeric(
            df[column],
            errors="coerce",
        ).fillna(default).to_numpy(
            dtype=np.float64
        )

    # ------------------------------------------------------------
    # SOURCE / DESTINATION
    # ------------------------------------------------------------

    def _get_source_column(self, df):
        return self._find_column(
            df,
            [
                "Source IP",
                "Src IP",
                "Source",
                "src_ip",
                "source_ip",
                "src",
            ],
        )

    def _get_destination_column(self, df):
        return self._find_column(
            df,
            [
                "Destination IP",
                "Dst IP",
                "Destination",
                "dst_ip",
                "destination_ip",
                "dst",
            ],
        )

    # ------------------------------------------------------------
    # EDGE FEATURES
    # ------------------------------------------------------------

    def _build_edge_features(self, df):
        duration = self._numeric_column(
            df,
            ["Flow Duration"],
        )

        total_fwd_packets = self._numeric_column(
            df,
            ["Total Fwd Packets"],
        )

        total_backward_packets = self._numeric_column(
            df,
            ["Total Backward Packets"],
        )

        total_fwd_length = self._numeric_column(
            df,
            ["Total Length of Fwd Packets"],
        )

        total_backward_length = self._numeric_column(
            df,
            ["Total Length of Bwd Packets"],
        )

        fwd_packet_mean = self._numeric_column(
            df,
            ["Fwd Packet Length Mean"],
        )

        bwd_packet_mean = self._numeric_column(
            df,
            ["Bwd Packet Length Mean"],
        )

        flow_bytes = self._numeric_column(
            df,
            ["Flow Bytes/s", "Flow Bytes/s"],
        )

        flow_packets = self._numeric_column(
            df,
            ["Flow Packets/s", "Flow Packets/s"],
        )

        flow_iat = self._numeric_column(
            df,
            ["Flow IAT Mean"],
        )

        packet_mean = self._numeric_column(
            df,
            ["Packet Length Mean"],
        )

        packet_std = self._numeric_column(
            df,
            ["Packet Length Std"],
        )

        syn_count = self._numeric_column(
            df,
            ["SYN Flag Count"],
        )

        ack_count = self._numeric_column(
            df,
            ["ACK Flag Count"],
        )

        average_packet_size = self._numeric_column(
            df,
            ["Average Packet Size"],
        )

        features = np.column_stack(
            [
                duration,
                total_fwd_packets,
                total_backward_packets,
                total_fwd_length,
                total_backward_length,
                fwd_packet_mean,
                bwd_packet_mean,
                flow_bytes,
                flow_packets,
                flow_iat,
                packet_mean,
                packet_std,
                syn_count,
                ack_count,
                average_packet_size,
            ]
        )

        return self._normalize_edge_features(
            features
        )

    # ------------------------------------------------------------
    # NORMALIZATION
    # ------------------------------------------------------------

    def _normalize_edge_features(self, features):
        features = np.asarray(
            features,
            dtype=np.float32,
        )

        features = np.nan_to_num(
            features,
            nan=0.0,
            posinf=0.0,
            neginf=0.0,
        )

        features = np.maximum(
            features,
            0.0,
        )

        features = np.log1p(
            features
        )

        std = np.where(
            self.edge_feature_std == 0,
            1.0,
            self.edge_feature_std,
        )

        features = (
            features
            - self.edge_feature_mean
        ) / std

        return np.nan_to_num(
            features,
            nan=0.0,
            posinf=0.0,
            neginf=0.0,
        ).astype(np.float32)

    def _normalize_node_features(self, features):
        features = np.asarray(
            features,
            dtype=np.float32,
        )

        features = np.nan_to_num(
            features,
            nan=0.0,
            posinf=0.0,
            neginf=0.0,
        )

        features = np.maximum(
            features,
            0.0,
        )

        features = np.log1p(
            features
        )

        std = np.where(
            self.node_feature_std == 0,
            1.0,
            self.node_feature_std,
        )

        features = (
            features
            - self.node_feature_mean
        ) / std

        return np.nan_to_num(
            features,
            nan=0.0,
            posinf=0.0,
            neginf=0.0,
        ).astype(np.float32)

    # ------------------------------------------------------------
    # NODE FEATURES
    # ------------------------------------------------------------

    def _build_node_features(
        self,
        df,
        source_column,
        destination_column,
        edge_features_raw,
    ):
        source_values = (
            df[source_column]
            .astype(str)
            .str.strip()
            .to_numpy()
        )

        destination_values = (
            df[destination_column]
            .astype(str)
            .str.strip()
            .to_numpy()
        )

        nodes = sorted(
            set(source_values)
            | set(destination_values)
        )

        node_mapping = {
            ip: index
            for index, ip in enumerate(nodes)
        }

        source_ids = np.array(
            [
                node_mapping[ip]
                for ip in source_values
            ],
            dtype=np.int64,
        )

        destination_ids = np.array(
            [
                node_mapping[ip]
                for ip in destination_values
            ],
            dtype=np.int64,
        )

        node_count = len(nodes)

        node_features = np.zeros(
            (node_count, 12),
            dtype=np.float64,
        )

        durations = np.maximum(
            self._numeric_column(
                df,
                ["Flow Duration"],
            ),
            0.0,
        )

        fwd_packets = np.maximum(
            self._numeric_column(
                df,
                ["Total Fwd Packets"],
            ),
            0.0,
        )

        fwd_lengths = np.maximum(
            self._numeric_column(
                df,
                ["Total Length of Fwd Packets"],
            ),
            0.0,
        )

        # 1. outgoing flow count
        np.add.at(
            node_features[:, 0],
            source_ids,
            1,
        )

        # 2. incoming flow count
        np.add.at(
            node_features[:, 1],
            destination_ids,
            1,
        )

        # 3. unique outgoing destinations
        outgoing_sets = [
            set()
            for _ in range(node_count)
        ]

        # 4. unique incoming sources
        incoming_sets = [
            set()
            for _ in range(node_count)
        ]

        for src, dst in zip(
            source_ids,
            destination_ids,
        ):
            outgoing_sets[src].add(dst)
            incoming_sets[dst].add(src)

        node_features[:, 2] = [
            len(values)
            for values in outgoing_sets
        ]

        node_features[:, 3] = [
            len(values)
            for values in incoming_sets
        ]

        # 5. total outgoing duration
        np.add.at(
            node_features[:, 4],
            source_ids,
            durations,
        )

        # 6. total incoming duration
        np.add.at(
            node_features[:, 5],
            destination_ids,
            durations,
        )

        # 7. outgoing forward packets
        np.add.at(
            node_features[:, 6],
            source_ids,
            fwd_packets,
        )

        # 8. incoming forward packets
        np.add.at(
            node_features[:, 7],
            destination_ids,
            fwd_packets,
        )

        # 9. outgoing forward bytes
        np.add.at(
            node_features[:, 8],
            source_ids,
            fwd_lengths,
        )

        # 10. incoming forward bytes
        np.add.at(
            node_features[:, 9],
            destination_ids,
            fwd_lengths,
        )

        # 11. mean outgoing packet size
        packet_mean = edge_features_raw[:, 10]

        outgoing_counts = np.bincount(
            source_ids,
            minlength=node_count,
        )

        incoming_counts = np.bincount(
            destination_ids,
            minlength=node_count,
        )

        outgoing_sum = np.zeros(
            node_count,
            dtype=np.float64,
        )

        incoming_sum = np.zeros(
            node_count,
            dtype=np.float64,
        )

        np.add.at(
            outgoing_sum,
            source_ids,
            packet_mean,
        )

        np.add.at(
            incoming_sum,
            destination_ids,
            packet_mean,
        )

        node_features[:, 10] = (
            outgoing_sum
            / np.maximum(
                outgoing_counts,
                1,
            )
        )

        # 12. mean incoming packet size
        node_features[:, 11] = (
            incoming_sum
            / np.maximum(
                incoming_counts,
                1,
            )
        )

        return (
            nodes,
            node_mapping,
            source_ids,
            destination_ids,
            self._normalize_node_features(
                node_features
            ),
        )

    # ------------------------------------------------------------
    # LABELS
    # ------------------------------------------------------------

    def _get_label_column(self, df):
        return self._find_column(
            df,
            [
                "Label",
                "label",
                "Class",
                "class",
                "Attack",
                "attack",
            ],
            required=False,
        )

    def _get_category_column(self, df):
        return self._find_column(
            df,
            [
                "Attack Category",
                "attack category",
                "Attack_Category",
                "Category",
                "category",
            ],
            required=False,
        )

    def _label_to_binary(self, value):
        value = str(value).strip().lower()

        benign_values = {
            "benign",
            "normal",
            "0",
            "false",
            "none",
        }

        if value in benign_values:
            return 0

        return 1

    # ------------------------------------------------------------
    # METRICS
    # ------------------------------------------------------------

    def _calculate_metrics(
        self,
        actual,
        predicted,
    ):
        actual = np.asarray(
            actual,
            dtype=np.int64,
        )

        predicted = np.asarray(
            predicted,
            dtype=np.int64,
        )

        tp = int(
            np.sum(
                (actual == 1)
                & (predicted == 1)
            )
        )

        tn = int(
            np.sum(
                (actual == 0)
                & (predicted == 0)
            )
        )

        fp = int(
            np.sum(
                (actual == 0)
                & (predicted == 1)
            )
        )

        fn = int(
            np.sum(
                (actual == 1)
                & (predicted == 0)
            )
        )

        total = len(actual)

        accuracy = (
            (tp + tn) / total
            if total
            else 0.0
        )

        precision = (
            tp / (tp + fp)
            if (tp + fp)
            else 0.0
        )

        recall = (
            tp / (tp + fn)
            if (tp + fn)
            else 0.0
        )

        f1 = (
            2 * precision * recall
            / (precision + recall)
            if (precision + recall)
            else 0.0
        )

        return {
            "accuracy": round(
                accuracy,
                6,
            ),
            "precision": round(
                precision,
                6,
            ),
            "recall": round(
                recall,
                6,
            ),
            "f1": round(
                f1,
                6,
            ),
            "true_positive": tp,
            "true_negative": tn,
            "false_positive": fp,
            "false_negative": fn,
        }

    # ------------------------------------------------------------
    # MAIN EVALUATION
    # ------------------------------------------------------------

    def evaluate_csv(
        self,
        file_content,
        filename,
    ):
        start_time = time.perf_counter()

        if not filename.lower().endswith(".csv"):
            raise ValueError(
                "Please upload a CSV file."
            )

        try:
            df = pd.read_csv(
                io.BytesIO(file_content),
                low_memory=False,
            )
        except Exception as error:
            raise ValueError(
                f"Unable to read CSV file: {error}"
            )

        if df.empty:
            raise ValueError(
                "The uploaded CSV is empty."
            )

        df.columns = [
            str(column).strip()
            for column in df.columns
        ]

        source_column = self._get_source_column(
            df
        )

        destination_column = self._get_destination_column(
            df
        )

        # Keep valid network rows only.
        valid_mask = (
            df[source_column]
            .notna()
            & df[destination_column]
            .notna()
        )

        df = df.loc[
            valid_mask
        ].copy()

        if df.empty:
            raise ValueError(
                "No valid source/destination network flows were found."
            )

        original_flow_count = len(df)

        # Prevent accidental memory exhaustion.
        max_flows = 200000

        truncated = False

        if len(df) > max_flows:
            df = df.head(
                max_flows
            ).copy()

            truncated = True

        edge_features_raw = np.column_stack(
            [
                self._numeric_column(
                    df,
                    ["Flow Duration"],
                ),
                self._numeric_column(
                    df,
                    ["Total Fwd Packets"],
                ),
                self._numeric_column(
                    df,
                    ["Total Backward Packets"],
                ),
                self._numeric_column(
                    df,
                    ["Total Length of Fwd Packets"],
                ),
                self._numeric_column(
                    df,
                    ["Total Length of Bwd Packets"],
                ),
                self._numeric_column(
                    df,
                    ["Fwd Packet Length Mean"],
                ),
                self._numeric_column(
                    df,
                    ["Bwd Packet Length Mean"],
                ),
                self._numeric_column(
                    df,
                    ["Flow Bytes/s"],
                ),
                self._numeric_column(
                    df,
                    ["Flow Packets/s"],
                ),
                self._numeric_column(
                    df,
                    ["Flow IAT Mean"],
                ),
                self._numeric_column(
                    df,
                    ["Packet Length Mean"],
                ),
                self._numeric_column(
                    df,
                    ["Packet Length Std"],
                ),
                self._numeric_column(
                    df,
                    ["SYN Flag Count"],
                ),
                self._numeric_column(
                    df,
                    ["ACK Flag Count"],
                ),
                self._numeric_column(
                    df,
                    ["Average Packet Size"],
                ),
            ]
        )

        edge_features = self._normalize_edge_features(
            edge_features_raw
        )

        (
            nodes,
            node_mapping,
            source_ids,
            destination_ids,
            node_features,
        ) = self._build_node_features(
            df,
            source_column,
            destination_column,
            edge_features_raw,
        )

        edge_index_np = np.vstack(
            [
                source_ids,
                destination_ids,
            ]
        )

        x = torch.tensor(
            node_features,
            dtype=torch.float32,
            device=self.device,
        )

        edge_index = torch.tensor(
            edge_index_np,
            dtype=torch.long,
            device=self.device,
        )

        edge_features_tensor = torch.tensor(
            edge_features,
            dtype=torch.float32,
            device=self.device,
        )

        # --------------------------------------------------------
        # GNN INFERENCE
        # --------------------------------------------------------

        with torch.no_grad():
            node_embeddings = self.model.encode_nodes(
                x,
                edge_index,
                edge_features_tensor,
            )

            logits = self.model.classify_edges(
                node_embeddings,
                edge_index,
                edge_features_tensor,
            )

            probabilities = torch.sigmoid(
                logits
            ).cpu().numpy()

        predictions = (
            probabilities >= self.threshold
        ).astype(np.int64)

        predicted_labels = np.where(
            predictions == 1,
            "ATTACK",
            "BENIGN",
        )

        # --------------------------------------------------------
        # LABEL METRICS
        # --------------------------------------------------------

        label_column = self._get_label_column(
            df
        )

        metrics = None
        actual_labels = None

        if label_column is not None:
            actual_labels = np.array(
                [
                    self._label_to_binary(value)
                    for value in df[label_column]
                ],
                dtype=np.int64,
            )

            metrics = self._calculate_metrics(
                actual_labels,
                predictions,
            )

        # --------------------------------------------------------
        # CATEGORY ANALYSIS
        # --------------------------------------------------------

        category_column = self._get_category_column(
            df
        )

        categories = []

        if category_column is not None:
            category_values = (
                df[category_column]
                .fillna("Unknown")
                .astype(str)
                .str.strip()
            )

            for category in sorted(
                category_values.unique()
            ):
                mask = (
                    category_values == category
                ).to_numpy()

                count = int(
                    np.sum(mask)
                )

                detected = int(
                    np.sum(
                        predictions[mask]
                        == 1
                    )
                )

                missed = count - detected

                category_actual = (
                    actual_labels[mask]
                    if actual_labels is not None
                    else None
                )

                category_metrics = None

                if category_actual is not None:
                    category_metrics = self._calculate_metrics(
                        category_actual,
                        predictions[mask],
                    )

                categories.append(
                    {
                        "category": category,
                        "name": category,
                        "flows": count,
                        "total": count,
                        "count": count,
                        "detected_attacks": detected,
                        "detected": detected,
                        "missed_attacks": missed,
                        "missed": missed,
                        "recall": (
                            round(
                                detected / count,
                                6,
                            )
                            if count
                            else 0.0
                        ),
                        "metrics": category_metrics,
                    }
                )

        # --------------------------------------------------------
        # HIGH-RISK NODES
        # --------------------------------------------------------

        node_attack_counts = np.zeros(
            len(nodes),
            dtype=np.int64,
        )

        node_flow_counts = np.zeros(
            len(nodes),
            dtype=np.int64,
        )

        np.add.at(
            node_flow_counts,
            source_ids,
            1,
        )

        np.add.at(
            node_flow_counts,
            destination_ids,
            1,
        )

        attack_indices = np.where(
            predictions == 1
        )[0]

        np.add.at(
            node_attack_counts,
            source_ids[attack_indices],
            1,
        )

        np.add.at(
            node_attack_counts,
            destination_ids[attack_indices],
            1,
        )

        high_risk_indices = sorted(
            [
                index
                for index in range(len(nodes))
                if node_attack_counts[index] > 0
            ],
            key=lambda index: (
                int(node_attack_counts[index]),
                int(node_flow_counts[index]),
            ),
            reverse=True,
        )[:20]

        high_risk_nodes = []

        for node_id in high_risk_indices:
            high_risk_nodes.append(
                {
                    "ip_address": nodes[node_id],
                    "ip": nodes[node_id],
                    "flows": int(
                        node_flow_counts[node_id]
                    ),
                    "total_flows": int(
                        node_flow_counts[node_id]
                    ),
                    "attack_flows": int(
                        node_attack_counts[node_id]
                    ),
                    "attack_flow_count": int(
                        node_attack_counts[node_id]
                    ),
                    "attack_rate": round(
                        (
                            node_attack_counts[node_id]
                            / node_flow_counts[node_id]
                        )
                        if node_flow_counts[node_id]
                        else 0.0,
                        6,
                    ),
                    "risk": "HIGH",
                    "status": "ATTACK",
                }
            )

        # --------------------------------------------------------
        # TOPOLOGY
        # --------------------------------------------------------

        # Build a compact enterprise topology from the actual uploaded
        # source/destination pairs. Edges are aggregated so repeated
        # flows between the same hosts become one meaningful link.
        node_attack_counts = np.zeros(
            len(nodes),
            dtype=np.int64,
        )

        node_flow_counts = np.zeros(
            len(nodes),
            dtype=np.int64,
        )

        np.add.at(
            node_flow_counts,
            source_ids,
            1,
        )

        np.add.at(
            node_flow_counts,
            destination_ids,
            1,
        )

        attack_indices = np.where(
            predictions == 1
        )[0]

        if len(attack_indices):
            np.add.at(
                node_attack_counts,
                source_ids[attack_indices],
                1,
            )

            np.add.at(
                node_attack_counts,
                destination_ids[attack_indices],
                1,
            )

        # Aggregate ALL uploaded flow rows by directed communication pair first.
        # Do not filter by the display-node shortlist before building the graph: doing
        # so can incorrectly produce zero visible edges even when the CSV contains
        # real communication.
        edge_map = {}

        for index in range(len(df)):
            src = int(source_ids[index])
            dst = int(destination_ids[index])
            key = (src, dst)

            if key not in edge_map:
                edge_map[key] = {
                    "source": nodes[src],
                    "destination": nodes[dst],
                    "source_id": src,
                    "destination_id": dst,
                    "total_flows": 0,
                    "attack_flows": 0,
                    "benign_flows": 0,
                    "max_probability": 0.0,
                }

            edge = edge_map[key]
            edge["total_flows"] += 1

            probability = float(probabilities[index])
            edge["max_probability"] = max(
                edge["max_probability"],
                probability,
            )

            if predictions[index] == 1:
                edge["attack_flows"] += 1
            else:
                edge["benign_flows"] += 1

        # Keep every attack node, then add endpoints from the busiest/riskiest
        # communication edges so the displayed topology always contains links.
        attack_node_ids = [
            index
            for index in range(len(nodes))
            if node_attack_counts[index] > 0
        ]

        edge_order = sorted(
            edge_map.values(),
            key=lambda edge: (
                edge["attack_flows"],
                edge["total_flows"],
            ),
            reverse=True,
        )

        edge_node_ids = []
        for edge in edge_order:
            edge_node_ids.extend([
                int(edge["source_id"]),
                int(edge["destination_id"]),
            ])
            if len(set(edge_node_ids)) >= 60:
                break

        degree_order = sorted(
            range(len(nodes)),
            key=lambda index: int(node_flow_counts[index]),
            reverse=True,
        )

        display_node_ids = list(
            dict.fromkeys(
                attack_node_ids
                + edge_node_ids
                + degree_order
            )
        )[:60]

        display_node_set = set(display_node_ids)

        # Only render links whose endpoints are in the compact displayed node set.
        # The summary still reports the full unique directed-edge count.
        graph_edges = [
            edge
            for edge in edge_map.values()
            if int(edge["source_id"]) in display_node_set
            and int(edge["destination_id"]) in display_node_set
        ]

        for edge in graph_edges:
            edge["attack_rate"] = round(
                edge["attack_flows"] / max(edge["total_flows"], 1),
                6,
            )
            edge["status"] = (
                "ATTACK" if edge["attack_flows"] > 0 else "NORMAL"
            )

        graph_edges.sort(
            key=lambda edge: (
                edge["attack_flows"],
                edge["total_flows"],
            ),
            reverse=True,
        )

        node_objects = []

        for node_id in display_node_ids:
            attack_flows = int(
                node_attack_counts[node_id]
            )

            total_flows = int(
                node_flow_counts[node_id]
            )

            incident_edges = [
                edge
                for edge in graph_edges
                if (
                    edge["source_id"] == node_id
                    or edge["destination_id"] == node_id
                )
            ]

            max_probability = max(
                [
                    edge["max_probability"]
                    for edge in incident_edges
                ],
                default=0.0,
            )

            node_objects.append(
                {
                    "id": nodes[node_id],
                    "ip": nodes[node_id],
                    "ip_address": nodes[node_id],
                    "flows": total_flows,
                    "total_flows": total_flows,
                    "attack_flows": attack_flows,
                    "attack_flow_count": attack_flows,
                    "attack_rate": round(
                        attack_flows
                        / max(total_flows, 1),
                        6,
                    ),
                    "risk_score": round(
                        max_probability,
                        6,
                    ),
                    "risk": (
                        "HIGH"
                        if attack_flows > 0
                        else "NORMAL"
                    ),
                    "status": (
                        "ATTACK"
                        if attack_flows > 0
                        else "NORMAL"
                    ),
                }
            )

        # Explicit attack paths based on model predictions.
        predicted_attack_networks = []

        for edge in graph_edges:
            if edge["attack_flows"] <= 0:
                continue

            predicted_attack_networks.append(
                {
                    "source": edge["source"],
                    "destination": edge["destination"],
                    "source_ip": edge["source"],
                    "destination_ip": edge["destination"],
                    "attack_flows": int(
                        edge["attack_flows"]
                    ),
                    "total_flows": int(
                        edge["total_flows"]
                    ),
                    "attack_rate": edge["attack_rate"],
                    "max_probability": edge[
                        "max_probability"
                    ],
                    "status": "ATTACK",
                }
            )

        # If labels are available, expose ground-truth attack paths
        # separately. This is deliberately not presented as model detection.
        ground_truth_attack_networks = []

        if actual_labels is not None:
            truth_edge_map = {}

            for index in range(len(df)):
                if actual_labels[index] != 1:
                    continue

                src = nodes[int(source_ids[index])]
                dst = nodes[int(destination_ids[index])]
                key = (src, dst)

                if key not in truth_edge_map:
                    truth_edge_map[key] = {
                        "source": src,
                        "destination": dst,
                        "attack_flows": 0,
                    }

                truth_edge_map[key]["attack_flows"] += 1

            ground_truth_attack_networks = sorted(
                truth_edge_map.values(),
                key=lambda item: item[
                    "attack_flows"
                ],
                reverse=True,
            )

        # --------------------------------------------------------
        # FLOW TABLE
        # --------------------------------------------------------


        flow_objects = []

        for index in range(
            min(len(df), 500)
        ):
            source_ip = str(
                df.iloc[index][source_column]
            ).strip()

            destination_ip = str(
                df.iloc[index][destination_column]
            ).strip()

            actual = None

            if actual_labels is not None:
                actual = (
                    "ATTACK"
                    if actual_labels[index] == 1
                    else "BENIGN"
                )

            category = None

            if category_column is not None:
                category = str(
                    df.iloc[index][category_column]
                )

            flow_objects.append(
                {
                    "flow_index": index + 1,
                    "source_ip": source_ip,
                    "destination_ip": destination_ip,
                    "prediction": predicted_labels[index],
                    "attack_probability": round(
                        float(
                            probabilities[index]
                        ),
                        6,
                    ),
                    "confidence": round(
                        (
                            float(
                                probabilities[index]
                            )
                            if predictions[index] == 1
                            else 1.0
                            - float(
                                probabilities[index]
                            )
                        ),
                        6,
                    ),
                    "actual_label": actual,
                    "attack_category": category,
                }
            )

        attack_count = int(
            np.sum(
                predictions == 1
            )
        )

        benign_count = int(
            np.sum(
                predictions == 0
            )
        )

        elapsed_ms = (
            time.perf_counter()
            - start_time
        ) * 1000

        # --------------------------------------------------------
        # SUMMARY
        # --------------------------------------------------------

        total_flow_count = int(len(df))

        summary = {
            "total_flows": total_flow_count,
            "total_nodes": int(len(nodes)),
            "total_edges": int(len(edge_map)),
            "detected_attacks": attack_count,
            "benign_flows": benign_count,
            "detected_benign": benign_count,
            "attack_rate": round(
                (
                    attack_count
                    / total_flow_count
                )
                if total_flow_count
                else 0.0,
                6,
            ),
            "processing_time_ms": 0.0,
        }

        # --------------------------------------------------------
        # RESULT
        # --------------------------------------------------------

        result = {
            "status": "SUCCESS",
            "filename": filename,

            "total_flows": total_flow_count,
            "original_flows": int(
                original_flow_count
            ),
            "truncated": truncated,

            "total_nodes": int(len(nodes)),
            "total_edges": int(len(edge_map)),

            "detected_attacks": attack_count,
            "detected_benign": benign_count,
            "benign_flows": benign_count,

            "attack_rate": summary[
                "attack_rate"
            ],

            "threshold": self.threshold,

            "inference_time_ms": 0.0,
            "processing_time_ms": 0.0,

            "labels_available": (
                label_column is not None
            ),

            "label_column": (
                str(label_column)
                if label_column is not None
                else None
            ),

            "category_column": (
                str(category_column)
                if category_column is not None
                else None
            ),

            "summary": summary,

            "metrics": metrics,

            "confusion_matrix": (
                {
                    "true_negative": metrics["true_negative"],
                    "false_positive": metrics["false_positive"],
                    "false_negative": metrics["false_negative"],
                    "true_positive": metrics["true_positive"],
                    "tn": metrics["true_negative"],
                    "fp": metrics["false_positive"],
                    "fn": metrics["false_negative"],
                    "tp": metrics["true_positive"],
                }
                if metrics is not None
                else None
            ),

            "categories": categories,

            "high_risk_nodes": high_risk_nodes,

            "attack_networks": (
                predicted_attack_networks
            ),

            "predicted_attack_networks": (
                predicted_attack_networks
            ),

            "ground_truth_attack_networks": (
                ground_truth_attack_networks
            ),

            "graph": {
                "nodes": node_objects,
                "edges": graph_edges,
            },

            "topology": {
                "nodes": node_objects,
                "edges": graph_edges,
            },

            "flows": flow_objects,

            "model": {
                "name": "TemporalEdgeGNN",
                "type": "Edge-Aware Graph Neural Network",
                "node_features": 12,
                "edge_features": 15,
                "embedding_dimension": 64,
                "classifier": "64 → 32 → 1",
                "dropout": 0.3,
                "threshold": self.threshold,
            },

            "warnings": [],
        }

        elapsed_ms = (
            time.perf_counter()
            - start_time
        ) * 1000

        result["inference_time_ms"] = round(
            elapsed_ms,
            3,
        )

        result["processing_time_ms"] = round(
            elapsed_ms,
            3,
        )

        result["summary"][
            "processing_time_ms"
        ] = round(
            elapsed_ms,
            3,
        )


        if truncated:
            result["warnings"].append(
                "The uploaded file exceeded 200,000 flows. "
                "Only the first 200,000 flows were evaluated."
            )

        if label_column is None:
            result["warnings"].append(
                "No ground-truth label column was found. "
                "Classification metrics are not available."
            )

        if category_column is None:
            result["warnings"].append(
                "No attack category column was found. "
                "Category-wise analysis is not available."
            )

        return result

    def evaluate(
        self,
        file_content,
        filename,
    ):
        return self.evaluate_csv(
            file_content,
            filename,
        )


enterprise_evaluator = EnterpriseEvaluator()
