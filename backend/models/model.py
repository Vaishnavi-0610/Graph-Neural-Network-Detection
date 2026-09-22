import torch
import torch.nn as nn


class EdgeAwareGNNLayer(nn.Module):
    def __init__(self, node_in, edge_in, hidden):
        super().__init__()

        self.node_linear = nn.Linear(node_in, hidden)
        self.edge_linear = nn.Linear(edge_in, hidden)

        self.update = nn.Sequential(
            nn.Linear(hidden * 2, hidden),
            nn.ReLU(),
            nn.LayerNorm(hidden),
        )

    def forward(self, x, edge_index, edge_features):
        source = edge_index[0]
        destination = edge_index[1]

        messages = (
            self.node_linear(x[source])
            + self.edge_linear(edge_features)
        )

        aggregated = torch.zeros(
            x.size(0),
            messages.size(1),
            device=x.device,
            dtype=messages.dtype,
        )

        aggregated.index_add_(
            0,
            destination,
            messages,
        )

        node_transformed = self.node_linear(x)

        return self.update(
            torch.cat(
                [node_transformed, aggregated],
                dim=1,
            )
        )


class TemporalEdgeGNN(nn.Module):
    def __init__(
        self,
        node_features=12,
        edge_features=15,
        hidden=64,
    ):
        super().__init__()

        self.layer1 = EdgeAwareGNNLayer(
            node_features,
            edge_features,
            hidden,
        )

        self.layer2 = EdgeAwareGNNLayer(
            hidden,
            edge_features,
            hidden,
        )

        self.edge_classifier = nn.Sequential(
            nn.Linear(hidden * 2 + edge_features, 64),
            nn.ReLU(),
            nn.Dropout(0.3),

            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),

            nn.Linear(32, 1),
        )

    def encode_nodes(
        self,
        x,
        edge_index,
        edge_features,
    ):
        x = self.layer1(
            x,
            edge_index,
            edge_features,
        )

        x = self.layer2(
            x,
            edge_index,
            edge_features,
        )

        return x

    def classify_edges(
        self,
        node_embeddings,
        edge_index,
        edge_features,
    ):
        source = edge_index[0]
        destination = edge_index[1]

        source_embedding = node_embeddings[source]
        destination_embedding = node_embeddings[destination]

        edge_input = torch.cat(
            [
                source_embedding,
                destination_embedding,
                edge_features,
            ],
            dim=1,
        )

        return self.edge_classifier(edge_input).squeeze(1)

    def forward(
        self,
        x,
        edge_index,
        edge_features,
    ):
        node_embeddings = self.encode_nodes(
            x,
            edge_index,
            edge_features,
        )

        logits = self.classify_edges(
            node_embeddings,
            edge_index,
            edge_features,
        )

        return logits