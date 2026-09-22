import os
import pickle
import time

import numpy as np
import torch

from models.model import TemporalEdgeGNN


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")


class InferenceEngine:
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

        self.node_features = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "node_features_normalized.npy",
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

        self.context_edge_index = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "train_context_edge_index.npy",
            )
        )

        self.context_edge_features = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "train_context_edge_features.npy",
            )
        )

        self.context_edge_time = np.load(
            os.path.join(
                ARTIFACTS_DIR,
                "train_context_edge_time.npy",
            )
        )

        with open(
            os.path.join(
                ARTIFACTS_DIR,
                "node_mapping.pkl",
            ),
            "rb",
        ) as file:
            self.node_mapping = pickle.load(file)

        threshold_path = os.path.join(
            ARTIFACTS_DIR,
            "best_detection_threshold.npy",
        )

        self.threshold = float(
            np.asarray(
                np.load(threshold_path)
            ).reshape(-1)[0]
        )

        self.node_embeddings = self._compute_node_embeddings()

    def _compute_node_embeddings(self):
        x = torch.tensor(
            self.node_features,
            dtype=torch.float32,
            device=self.device,
        )

        edge_index = torch.tensor(
            self.context_edge_index,
            dtype=torch.long,
            device=self.device,
        )

        edge_features = torch.tensor(
            self.context_edge_features,
            dtype=torch.float32,
            device=self.device,
        )

        with torch.no_grad():
            embeddings = self.model.encode_nodes(
                x,
                edge_index,
                edge_features,
            )

        return embeddings

    def _normalize_edge_features(self, features):
        features = np.asarray(
            features,
            dtype=np.float32,
        )

        if features.shape != (15,):
            raise ValueError(
                "Exactly 15 flow features are required."
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

        features = np.log1p(features)

        std = np.where(
            self.edge_feature_std == 0,
            1.0,
            self.edge_feature_std,
        )

        features = (
            features - self.edge_feature_mean
        ) / std

        features = np.nan_to_num(
            features,
            nan=0.0,
            posinf=0.0,
            neginf=0.0,
        )

        return features.astype(np.float32)

    def detect_flow(
        self,
        source_ip,
        destination_ip,
        flow_features,
    ):
        start_time = time.perf_counter()

        if source_ip not in self.node_mapping:
            return {
                "status": "UNKNOWN_SOURCE",
                "prediction": None,
                "message": f"Source IP '{source_ip}' is not present in the training graph.",
            }

        if destination_ip not in self.node_mapping:
            return {
                "status": "UNKNOWN_DESTINATION",
                "prediction": None,
                "message": f"Destination IP '{destination_ip}' is not present in the training graph.",
            }

        source_node = self.node_mapping[source_ip]
        destination_node = self.node_mapping[destination_ip]

        normalized_features = self._normalize_edge_features(
            flow_features
        )

        edge_index = torch.tensor(
            [
                [source_node],
                [destination_node],
            ],
            dtype=torch.long,
            device=self.device,
        )

        edge_features = torch.tensor(
            normalized_features.reshape(1, 15),
            dtype=torch.float32,
            device=self.device,
        )

        with torch.no_grad():
            source_embedding = self.node_embeddings[
                source_node
            ].unsqueeze(0)

            destination_embedding = self.node_embeddings[
                destination_node
            ].unsqueeze(0)

            edge_input = torch.cat(
                [
                    source_embedding,
                    destination_embedding,
                    edge_features,
                ],
                dim=1,
            )

            logits = self.model.edge_classifier(
                edge_input
            ).squeeze(1)

            probability = torch.sigmoid(
                logits
            ).item()

        prediction = (
            "ATTACK"
            if probability >= self.threshold
            else "BENIGN"
        )

        inference_time = (
            time.perf_counter() - start_time
        ) * 1000

        confidence = (
            probability
            if prediction == "ATTACK"
            else 1.0 - probability
        )

        return {
            "status": "SUCCESS",
            "prediction": prediction,
            "attack_probability": round(
                probability,
                6,
            ),
            "confidence": round(
                confidence,
                6,
            ),
            "threshold": self.threshold,
            "source_ip": source_ip,
            "destination_ip": destination_ip,
            "inference_time_ms": round(
                inference_time,
                3,
            ),
        }


engine = InferenceEngine()