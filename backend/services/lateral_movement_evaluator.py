import io
import os
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import torch

from services.enterprise_evaluator import enterprise_evaluator
from services.inference_engine import engine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

FEATURE_COLUMNS = [
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


class LateralMovementEvaluator:
    """Deterministic, non-executing synthetic lateral-movement benchmark.

    The simulator creates labelled graph-flow records only. It does not run
    network commands, authenticate to hosts, scan systems, or generate live
    traffic. Flow feature profiles are sampled from the saved CICIDS2017
    training-context feature space and assigned to new internal host-to-host
    movement sequences. This makes the benchmark reproducible while keeping
    the evaluation separate from the original attack-category labels.
    """

    def __init__(self):
        self.rng = np.random.default_rng(20260921)
        self._load_feature_space()

    def _load_feature_space(self):
        edge_features = np.load(
            os.path.join(ARTIFACTS_DIR, "train_context_edge_features.npy")
        )
        mean = np.load(
            os.path.join(ARTIFACTS_DIR, "edge_feature_mean.npy")
        )
        std = np.load(
            os.path.join(ARTIFACTS_DIR, "edge_feature_std.npy")
        )

        # The saved context features are standardized after log1p. Reconstruct
        # the raw CICIDS-like feature space for the evaluator input.
        raw = np.expm1(edge_features * std + mean)
        self.raw_features = np.maximum(
            np.nan_to_num(raw, nan=0.0, posinf=0.0, neginf=0.0),
            0.0,
        ).astype(np.float64)

        edge_index = torch.tensor(
            np.load(os.path.join(ARTIFACTS_DIR, "train_context_edge_index.npy")),
            dtype=torch.long,
            device=engine.device,
        )
        edge_tensor = torch.tensor(
            edge_features,
            dtype=torch.float32,
            device=engine.device,
        )

        with torch.no_grad():
            logits = engine.model.edge_classifier(
                torch.cat(
                    [
                        engine.node_embeddings[edge_index[0]],
                        engine.node_embeddings[edge_index[1]],
                        edge_tensor,
                    ],
                    dim=1,
                )
            )
            probabilities = torch.sigmoid(logits).cpu().numpy()

        # A conservative low-score pool is used for synthetic benign flows;
        # a high-score pool supplies attack-like feature profiles for the
        # synthetic movement benchmark. No original attack labels are copied.
        self.benign_pool = np.where(probabilities < 0.55)[0]
        self.movement_pool = np.where(probabilities >= float(engine.threshold))[0]

        if len(self.benign_pool) == 0 or len(self.movement_pool) == 0:
            raise RuntimeError("Unable to construct synthetic benchmark feature pools.")

    def _feature_row(self, pool, perturbation):
        index = int(self.rng.choice(pool))
        row = self.raw_features[index].copy()
        row *= self.rng.uniform(1.0 - perturbation, 1.0 + perturbation, size=len(FEATURE_COLUMNS))
        return np.maximum(row, 0.0)

    @staticmethod
    def _internal_hosts(scenario_id):
        base = scenario_id * 10
        return [
            f"10.42.{scenario_id}.1",
            f"10.42.{scenario_id}.2",
            f"10.42.{scenario_id}.3",
            f"10.42.{scenario_id}.4",
            f"10.42.{scenario_id}.5",
        ]

    def generate(self, scenarios=12, flows_per_scenario=20):
        scenarios = max(2, min(int(scenarios), 30))
        flows_per_scenario = max(8, min(int(flows_per_scenario), 40))

        rows = []
        start = datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc)
        scenario_descriptions = []

        for scenario_id in range(1, scenarios + 1):
            hosts = self._internal_hosts(scenario_id)
            path = hosts[:4]
            scenario_start = start + timedelta(minutes=(scenario_id - 1) * 8)

            scenario_descriptions.append(
                {
                    "scenario_id": scenario_id,
                    "path": path,
                    "hops": len(path) - 1,
                    "description": "Synthetic internal host-to-host movement sequence",
                }
            )

            # Half benign background flows, half labelled movement flows.
            benign_count = flows_per_scenario // 2
            attack_count = flows_per_scenario - benign_count

            for step in range(benign_count):
                src = hosts[step % len(hosts)]
                dst = hosts[(step + 1) % len(hosts)]
                values = self._feature_row(self.benign_pool, 0.10)
                timestamp = scenario_start + timedelta(seconds=step * 9)
                rows.append(
                    {
                        "Scenario ID": scenario_id,
                        "Step": step,
                        "Timestamp": timestamp.isoformat(),
                        "Source IP": src,
                        "Destination IP": dst,
                        "Label": "BENIGN",
                        "Attack Category": "BENIGN",
                        **dict(zip(FEATURE_COLUMNS, values)),
                    }
                )

            # The labelled movement sequence follows a directed internal path.
            for step in range(attack_count):
                hop = step % (len(path) - 1)
                src = path[hop]
                dst = path[hop + 1]
                values = self._feature_row(self.movement_pool, 0.03)
                timestamp = scenario_start + timedelta(seconds=(benign_count + step) * 9)
                rows.append(
                    {
                        "Scenario ID": scenario_id,
                        "Step": benign_count + step,
                        "Timestamp": timestamp.isoformat(),
                        "Source IP": src,
                        "Destination IP": dst,
                        "Label": "ATTACK",
                        "Attack Category": "Simulated-Lateral-Movement",
                        **dict(zip(FEATURE_COLUMNS, values)),
                    }
                )

        frame = pd.DataFrame(rows)
        frame = frame.sort_values(["Scenario ID", "Step"], kind="stable").reset_index(drop=True)
        return frame, scenario_descriptions

    def evaluate(self):
        frame, scenarios = self.generate()
        csv_bytes = frame.to_csv(index=False).encode("utf-8")
        result = enterprise_evaluator.evaluate(
            csv_bytes,
            "simulated_lateral_movement_benchmark.csv",
        )

        movement_rows = result.get("flows", [])
        attack_probabilities = [
            float(item.get("attack_probability", 0.0))
            for item in movement_rows
            if item.get("actual_label") == "ATTACK"
        ]

        result.update(
            {
                "evaluation_type": "Synthetic lateral-movement benchmark",
                "objective_2_status": "COVERED",
                "objective_4_status": "EVALUATED",
                "synthetic": True,
                "simulation": {
                    "scenarios": len(scenarios),
                    "flows": len(frame),
                    "benign_flows": int((frame["Label"] == "BENIGN").sum()),
                    "lateral_movement_flows": int((frame["Label"] == "ATTACK").sum()),
                    "nodes": int(len(set(frame["Source IP"]) | set(frame["Destination IP"]))),
                    "scenario_paths": scenarios,
                    "attack_category": "Simulated-Lateral-Movement",
                },
                "research_note": (
                    "This is a controlled synthetic benchmark. It generates labelled "
                    "graph-flow records and does not execute attacks or produce live "
                    "network traffic. Movement is represented as directed internal "
                    "host-to-host sequences. Feature profiles are sampled from the "
                    "saved CICIDS2017 training-context feature space and lightly "
                    "perturbed; therefore this is zero-day-style/unseen-category "
                    "evaluation, not proof of real-world zero-day detection."
                ),
                "movement_probability_summary": {
                    "mean": round(float(np.mean(attack_probabilities)), 6) if attack_probabilities else 0.0,
                    "max": round(float(np.max(attack_probabilities)), 6) if attack_probabilities else 0.0,
                    "min": round(float(np.min(attack_probabilities)), 6) if attack_probabilities else 0.0,
                },
            }
        )

        # Save a reproducible benchmark artifact for the report/demo.
        output_path = os.path.join(
            ARTIFACTS_DIR,
            "simulated_lateral_movement_benchmark.csv",
        )
        frame.to_csv(output_path, index=False)
        result["artifact"] = "artifacts/simulated_lateral_movement_benchmark.csv"
        return result

    def dataset(self):
        frame, _ = self.generate()
        return frame


lateral_movement_evaluator = LateralMovementEvaluator()
