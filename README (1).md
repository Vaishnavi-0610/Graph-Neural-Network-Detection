# Edge-Aware GNN for Network Intrusion Detection

> A graph-based cybersecurity research and monitoring system for enterprise network intrusion detection, chronological network analysis, unseen attack-category evaluation, controlled lateral-movement evaluation, and cyber-SOC visualization.

---

## 1. Project Overview

Traditional network intrusion detection systems often analyze network flows independently. However, enterprise network activity is naturally connected: devices communicate with other devices, servers interact with clients, and suspicious behavior may appear as a sequence of communications rather than as a single isolated flow.

This project models enterprise network activity as a **directed graph** and uses an **Edge-Aware Graph Neural Network (GNN)** to classify network communication flows as:

- `BENIGN`
- `ATTACK`

The project uses the **CICIDS2017** intrusion-detection dataset and represents network communication using:

- **Nodes** → IP addresses / hosts
- **Edges** → network flows between hosts
- **Node features** → communication statistics of hosts
- **Edge features** → characteristics of individual network flows

The project also provides a complete cyber-SOC interface for inspecting the network, running flow detection, evaluating enterprise CSV files, exploring chronological graph evolution, analyzing suspicious communication paths, and reviewing research results.

### Main components

1. Enterprise activity represented as a graph
2. Edge-Aware Graph Neural Network
3. Chronological graph-snapshot evaluation
4. Unseen attack-category evaluation
5. Controlled synthetic lateral-movement benchmark
6. Enterprise CSV evaluation
7. Dynamic network visualization
8. Suspicious communication-path visualization
9. Cyber-SOC frontend
10. Research analytics and model documentation

> **Important:** The lateral-movement component is synthetic and non-executing. It does not perform real attacks, exploit systems, or generate live malicious traffic.

---

# 2. Research Objectives

The project is based on four research objectives.

## Objective 1 — Model Enterprise Activity as a Graph

Represent enterprise network communication as a graph where:

- IP addresses are nodes
- Network flows are directed edges
- Node-level communication statistics describe hosts
- Edge-level flow statistics describe individual communications

### Status

**Complete**

---

## Objective 2 — Simulate or Collect Lateral Movement Data

Create a controlled benchmark containing labelled internal host-to-host communication sequences representing lateral-movement-style behavior.

The benchmark:

- Uses synthetic network-flow records
- Uses private internal IP addresses
- Creates directed multi-hop communication paths
- Contains labelled benign and movement flows
- Does not execute attacks
- Does not generate live malicious traffic

### Status

**Complete**

---

## Objective 3 — Train a Graph Neural Network

Train an Edge-Aware GNN using CICIDS2017 network activity.

The model learns:

- Host communication representations
- Graph neighborhood information
- Flow-level characteristics
- Relationships between communicating hosts

### Status

**Complete**

---

## Objective 4 — Evaluate Unseen / Zero-Day-Style Generalization

Evaluate whether the trained detector can generalize to attack categories that were not present during training.

The evaluation includes:

- Chronological test evaluation
- Unseen CICIDS2017 attack categories
- Controlled synthetic lateral-movement evaluation

This is described as a **zero-day-style / unseen-category evaluation**.

It should **not** be interpreted as proof of real-world zero-day detection.

### Status

**Complete as an experimental evaluation**

---

# 3. High-Level System Architecture

```text
                         CICIDS2017
                              |
                              v
                    Data Preprocessing
                              |
                              v
                       Network Flows
                              |
                              v
                     Graph Construction
                       /             \
                      /               \
                     v                 v
             Node Features       Edge Features
                12 features         15 features
                     \                 /
                      \               /
                       v             v
                    Edge-Aware GNN
                           |
                           v
                    Node Embeddings
                           |
                           v
                     Edge Classifier
                           |
                           v
                    Attack Probability
                           |
                           v
                 +---------------------+
                 | Detection Threshold  |
                 |        0.67          |
                 +---------------------+
                    /               \
                   v                 v
               BENIGN              ATTACK
```

The backend exposes the trained model through APIs, while the frontend provides a cyber-SOC interface.

```text
                         Backend API
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
   Flow Detection      Network Graph      Evaluation APIs
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                       Cyber-SOC UI
                              |
        +---------+-----------+-----------+----------+
        |         |           |           |          |
        v         v           v           v          v
    Dashboard Detection Enterprise Dynamic Analytics
                              |
                              v
                       Research Results
                              |
                              v
                     Lateral Movement
```

---

# 4. Dataset

## CICIDS2017

The main dataset used in this project is **CICIDS2017**, a network intrusion-detection dataset containing benign and malicious network traffic.

The project processes multiple CICIDS2017 CSV files covering different days and attack scenarios.

The raw data contains network-flow information such as:

- Source IP
- Destination IP
- Source Port
- Destination Port
- Protocol
- Timestamp
- Flow duration
- Packet statistics
- Byte statistics
- Forward/backward traffic statistics
- Labels
- Attack categories

The preprocessing pipeline removes formatting inconsistencies such as leading spaces in column names.

Example:

```python
df.columns = df.columns.str.strip()
```

---

# 5. Dataset Processing

The combined processed dataset contains approximately:

```text
Total flows:       2,829,385
Unique IP nodes:      19,129
```

The dataset is split chronologically rather than randomly.

This is important because a chronological split better represents a situation where a model learns from earlier traffic and is evaluated on later traffic.

---

## 5.1 Training Split

```text
Time:
<= 2017-07-04 23:59:59

Flows:
975,562

Benign:
961,727

Attack:
13,835
```

Training attack categories:

```text
FTP-Patator
SSH-Patator
```

---

## 5.2 Validation Split

```text
Time:
2017-07-05 to 2017-07-06

Flows:
1,150,625

Benign:
896,686

Attack:
253,939
```

Validation includes categories such as:

```text
DoS GoldenEye
DoS Hulk
DoS Slowhttptest
DoS slowloris
Heartbleed
Infiltration
Web Attack – Brute Force
SQL Injection
XSS
```

---

## 5.3 Test Split

```text
Flows:
703,198

Benign:
414,275

Attack:
288,923
```

Test attack categories:

```text
DDoS
PortScan
Bot
```

These attack categories were not present in the training split.

This creates an unseen-category generalization setting.

---

# 6. Graph Representation

The network is represented as a **directed graph**.

```text
Source IP ----------------------> Destination IP
             Network Flow
```

For example:

```text
192.168.10.15
       |
       | network flow
       v
192.168.10.50
```

The source and destination IP addresses become graph nodes.

The network flow becomes a directed edge.

---

# 7. Node Features

Each graph node contains 12 features describing the communication behavior of a host.

```text
1.  Outgoing flow count
2.  Incoming flow count
3.  Unique outgoing destinations
4.  Unique incoming sources
5.  Total outgoing flow duration
6.  Total incoming flow duration
7.  Outgoing forward packets
8.  Incoming forward packets
9.  Outgoing forward bytes
10. Incoming forward bytes
11. Mean outgoing packet size
12. Mean incoming packet size
```

These features provide a behavioral representation of each network host.

---

# 8. Edge Features

Each network flow is represented using 15 model features.

These features describe characteristics of individual communication flows.

The same edge-feature representation is used consistently for:

- Training
- Validation
- Testing
- Individual inference
- Enterprise evaluation

---

# 9. Feature Normalization

The project uses training-only statistics for normalization.

The general preprocessing pipeline is:

```text
Raw Feature
    |
    v
NaN / Inf handling
    |
    v
Log transformation
    |
    v
Training mean / standard deviation
    |
    v
Standardized feature
```

The normalization statistics are learned from the training data and reused for validation, test, and inference.

This avoids calculating normalization parameters from evaluation data.

---

# 10. Graph Context

The training graph contains:

```text
Original training flows:
975,562

Unique directed source-destination pairs:
62,538
```

The graph context is used by the GNN to create node representations based on communication relationships.

Important saved graph artifacts include:

```text
train_context_edge_index.npy
train_context_edge_features.npy
train_context_edge_time.npy
train_context_flow_id.npy
```

---

# 11. Edge-Aware Graph Neural Network

The primary model is implemented as:

```text
TemporalEdgeGNN
```

For accurate methodological description, the project should be described as:

> **Edge-Aware Graph Neural Network with chronological graph-snapshot evaluation**

The model uses chronological information to organize graph snapshots and evaluate the network over time.

However, edge timestamps are not directly used as a temporal message-passing mechanism inside the GNN.

Therefore, the project does **not** claim to implement a fully temporal GNN architecture.

---

# 12. GNN Architecture

The model contains two Edge-Aware GNN message-passing layers.

```text
Node Features: 12
Edge Features: 15
        |
        v
+-------------------------+
| Edge-Aware GNN Layer 1 |
+-------------------------+
        |
        v
Hidden Dimension: 64
        |
        v
+-------------------------+
| Edge-Aware GNN Layer 2 |
+-------------------------+
        |
        v
64-D Node Embeddings
        |
        v
Edge Classifier
```

---

## 12.1 Layer 1

Input:

```text
Node features = 12
Edge features = 15
```

Output:

```text
Hidden representation = 64
```

The layer combines:

- transformed node information
- transformed edge information
- graph neighborhood aggregation

---

## 12.2 Layer 2

Input:

```text
Node representation = 64
Edge features = 15
```

Output:

```text
64-dimensional node embedding
```

---

# 13. Message Passing

For each directed communication:

```text
Source Node
     |
     +------ Edge Features
     |
     v
Destination Node
```

The model constructs messages from:

```text
Node representation
+
Edge representation
```

Messages are aggregated at destination nodes.

The implementation uses indexed aggregation to combine information from connected flows.

This allows the representation of a host to depend on the communication structure around it.

---

# 14. Edge Classification

After generating node embeddings, the model classifies individual edges.

For each flow:

```text
Source embedding       = 64
Destination embedding  = 64
Edge features          = 15
```

These are concatenated:

```text
64 + 64 + 15 = 143 dimensions
```

The edge classifier is:

```text
143
 |
 v
64
 |
 v
32
 |
 v
1
```

The final output is converted into an attack probability using a sigmoid function.

---

# 15. Model Configuration

```text
Framework:       PyTorch
Device:          CPU
Parameters:      35,137

Node input:      12
Edge input:      15
Hidden size:     64

Classifier:
143 → 64 → 32 → 1

Activation:
ReLU

Normalization:
LayerNorm

Dropout:
0.3
```

---

# 16. Training Configuration

The model was trained using:

```text
Optimizer:       Adam
Learning rate:   0.001
Weight decay:    0.0001
Epochs:          10
Gradient clip:   1.0
Positive weight: 4.0
```

The training data is highly imbalanced because benign traffic is much larger than attack traffic.

The training process therefore uses:

```text
All attack samples
+
4 × attack count in benign samples
```

This results in an approximate training subset of:

```text
Attack: 20%
Benign: 80%
```

---

# 17. Detection Threshold

The selected detection threshold is:

```text
0.67
```

The model produces an attack probability.

Example:

```text
Attack probability = 0.73

0.73 >= 0.67
```

Prediction:

```text
ATTACK
```

If:

```text
Attack probability < 0.67
```

the prediction is:

```text
BENIGN
```

The threshold was selected using validation performance.

---

# 18. Final CICIDS2017 Test Results

The final test evaluation produced:

```text
Accuracy:     99.68%
Precision:    99.89%
Recall:       99.32%
F1 Score:     99.60%
ROC-AUC:      99.76%
PR-AUC:       99.74%
```

These values are based on the chronological CICIDS2017 test split.

---

# 19. Test Confusion Matrix

```text
                         Predicted
                    BENIGN       ATTACK

Actual BENIGN      413,968          307

Actual ATTACK        1,969      286,954
```

Therefore:

```text
TN = 413,968
FP = 307
FN = 1,969
TP = 286,954
```

---

# 20. Unseen Attack-Category Evaluation

The training split contains:

```text
FTP-Patator
SSH-Patator
```

The test split contains:

```text
DDoS
PortScan
Bot
```

The test attack categories were not present in training.

This provides an experimental setting for evaluating generalization to unseen attack categories.

---

# 21. Unseen Category Results

## DDoS

```text
Total flows:     128,027
Detected:        128,024
Missed:                3

Recall:           99.9977%
```

---

## PortScan

```text
Total flows:     158,930
Detected:        158,930
Missed:                0

Recall:          100%
```

---

## Bot

```text
Total flows:       1,966
Detected:              0
Missed:            1,966

Recall:              0%
```

---

# 22. Interpretation of Unseen Category Results

The model generalizes strongly to the DDoS and PortScan categories in the current test evaluation.

However, the Bot category is not detected in this evaluation.

This demonstrates an important research finding:

> Strong generalization to some unseen attack categories does not guarantee generalization to every unseen attack category.

The Bot result is therefore retained as a limitation of the current model rather than being hidden.

---

# 23. Chronological Network Evaluation

The project converts chronological network events into sequential graph snapshots.

Supported window sizes include:

```text
5 minutes
10 minutes
15 minutes
```

The default analysis uses 5-minute windows.

The processed data contains approximately:

```text
Training snapshots:     197
Validation snapshots:   201
Test snapshots:          98
```

Each snapshot represents the communication topology observed during a specific time interval.

---

# 24. Dynamic Network Graph

The frontend contains a **Dynamic Network** page.

It allows users to inspect how communication topology changes over time.

The visualization includes:

- Current graph snapshot
- Nodes
- Directed communication edges
- Newly appearing links
- Chronological snapshots
- Timeline
- Playback controls
- Snapshot navigation

Visual encoding:

```text
RED      → suspicious / attack-related
CYAN     → new communication
GREY     → normal communication
```

The graph uses directional paths to preserve source-to-destination communication.

---

# 25. Suspicious Communication Paths

The Dynamic Network page also provides a:

```text
SUSPICIOUS PATHS
```

view.

Suspicious paths are derived from predicted attack edges rather than being manually hardcoded.

The system preserves communication direction:

```text
Source
  |
  v
Destination
  |
  v
Next destination
  |
  v
Next destination
```

This allows connected suspicious communication sequences to be inspected.

The project intentionally uses the term:

> **Suspicious communication path**

instead of claiming that every detected path represents confirmed lateral movement.

---

# 26. Lateral Movement Simulation

To explicitly address Research Objective 2, the project contains a controlled synthetic lateral-movement benchmark.

Benchmark size:

```text
Scenarios:        12
Benchmark flows:  240
Movement flows:   120
Nodes:             60
```

The simulator uses private internal IP addresses such as:

```text
10.42.1.1
10.42.1.2
10.42.1.3
10.42.1.4
```

A typical movement scenario follows a multi-hop pattern:

```text
Host A
  |
  v
Host B
  |
  v
Host C
  |
  v
Host D
```

---

# 27. Lateral Movement Scenarios

The benchmark contains 12 controlled scenarios.

```text
SC-01
10.42.1.1 → 10.42.1.2 → 10.42.1.3 → 10.42.1.4

SC-02
10.42.2.1 → 10.42.2.2 → 10.42.2.3 → 10.42.2.4

SC-03
10.42.3.1 → 10.42.3.2 → 10.42.3.3 → 10.42.3.4

SC-04
10.42.4.1 → 10.42.4.2 → 10.42.4.3 → 10.42.4.4

SC-05
10.42.5.1 → 10.42.5.2 → 10.42.5.3 → 10.42.5.4

SC-06
10.42.6.1 → 10.42.6.2 → 10.42.6.3 → 10.42.6.4

SC-07
10.42.7.1 → 10.42.7.2 → 10.42.7.3 → 10.42.7.4

SC-08
10.42.8.1 → 10.42.8.2 → 10.42.8.3 → 10.42.8.4

SC-09
10.42.9.1 → 10.42.9.2 → 10.42.9.3 → 10.42.9.4

SC-10
10.42.10.1 → 10.42.10.2 → 10.42.10.3 → 10.42.10.4

SC-11
10.42.11.1 → 10.42.11.2 → 10.42.11.3 → 10.42.11.4

SC-12
10.42.12.1 → 10.42.12.2 → 10.42.12.3 → 10.42.12.4
```

These paths are synthetic and are used only for controlled evaluation.

---

# 28. Lateral Movement Evaluation

The existing trained GNN is evaluated against the synthetic benchmark.

Important characteristics:

```text
No retraining
No live attack
No exploitation
No real lateral movement
No live malicious traffic
```

The existing model is directly evaluated on the new benchmark.

This makes it possible to observe how the model behaves when presented with a different communication pattern.

---

# 29. Lateral Movement Results

Current evaluation:

```text
Benchmark flows:     240
Movement flows:      120

TP:                    3
FN:                  117
TN:                  120
FP:                    0
```

Metrics:

```text
Accuracy:            51.25%
Precision:          100.00%
Recall:               2.50%
F1 Score:             4.88%
```

The detector identified:

```text
3 / 120
```

labelled movement flows.

---

# 30. Interpretation of Lateral Movement Results

The result indicates that the current detector has **limited generalization to the synthetic lateral-movement category**.

The precision for detected movement predictions is 100%, but the recall is only 2.50%.

Therefore, the current model should not be described as successfully detecting real-world lateral movement.

Instead, the benchmark provides a useful research finding:

> A model trained on one network-flow distribution may not automatically generalize to a substantially different synthetic internal movement pattern.

---

# 31. Enterprise CSV Evaluation

The system supports evaluation of an external enterprise-style CSV without retraining the model.

The enterprise evaluator uses the same:

```text
12 node features
15 edge features
Training normalization statistics
Detection threshold = 0.67
```

The evaluator can provide:

- Total flows
- Total nodes
- Graph edges
- Detected attacks
- Predicted benign flows
- Predicted attack rate
- Processing time
- Confusion matrix when labels are available
- High-risk nodes
- Predicted attack networks
- Ground-truth attack networks
- Attack-category analysis when categories are available

---

# 32. Enterprise Evaluation Workflow

```text
Enterprise CSV
      |
      v
Column validation
      |
      v
Flow preprocessing
      |
      v
Node construction
      |
      v
12 Node Features
      |
      v
15 Edge Features
      |
      v
Training normalization
      |
      v
Existing trained GNN
      |
      v
Attack Probability
      |
      v
Threshold = 0.67
      |
      v
Enterprise Results
```

The model is not retrained during enterprise evaluation.

---

# 33. Backend

The backend is implemented using Python, FastAPI, and Uvicorn.

Important backend components include:

```text
backend/app.py
backend/models/model.py
backend/services/
backend/artifacts/
```

---

# 34. Backend API

Main endpoints include:

```text
GET  /
GET  /health
GET  /model-info
GET  /features

GET  /verified-flow
POST /predict

GET  /network-graph
GET  /network-node/{ip_address}
GET  /network-metadata
GET  /refresh-network-metadata

POST /evaluate-enterprise

GET  /dynamic-network

GET  /lateral-movement-evaluation
```

---

# 35. Important API Endpoints

## Health Check

```text
GET /health
```

Used by the frontend to verify backend and model availability.

Example:

```json
{
  "status": "healthy",
  "model": "TemporalEdgeGNN",
  "framework": "PyTorch",
  "device": "CPU",
  "inference_ready": true
}
```

---

## Flow Prediction

```text
POST /predict
```

Used to classify an individual network flow.

The response contains information such as:

- Prediction
- Attack probability
- Confidence
- Detection threshold
- Source IP
- Destination IP
- Inference time

---

## Network Graph

```text
GET /network-graph
```

Returns network graph information used by the frontend.

The graph contains:

- Network nodes
- Communication edges
- Critical networks
- Attack-related networks

---

## Dynamic Network

```text
GET /dynamic-network
```

Returns chronological graph snapshots.

Parameters include:

```text
window_minutes
max_snapshots
max_nodes
```

---

## Lateral Movement Evaluation

```text
GET /lateral-movement-evaluation
```

Runs the controlled synthetic benchmark using the existing trained model.

---

# 36. Frontend

The frontend is built using:

```text
React
JavaScript
Tailwind CSS
Framer Motion
Lucide React
Vite
```

The interface uses a dark cyber-SOC design with:

- Black background
- Red threat indicators
- Cyan network indicators
- Technical typography
- Network topology visualizations
- Animated graph elements
- Responsive layout

---

# 37. Frontend Pages

## Dashboard

Displays:

- Overall model metrics
- System status
- Network topology
- Graph statistics
- Detection threshold
- Critical networks
- IP search

---

## Detection

Provides individual network-flow prediction.

Users can provide network-flow information and receive:

- Attack probability
- Prediction
- Confidence
- Threshold
- Inference time

---

## Enterprise Evaluation

Provides:

- CSV evaluation
- Network topology
- Attack predictions
- High-risk nodes
- Flow-level results
- Confusion matrix
- Category analysis

---

## Dynamic Network

Provides:

- Chronological graph snapshots
- Timeline
- Playback
- New communication links
- Suspicious communication paths
- Current topology

---

## Analytics

Provides:

- Accuracy
- Precision
- Recall
- F1
- ROC-AUC
- PR-AUC
- Confusion matrix
- Test distribution
- Unseen-category analysis
- Research interpretation

---

## Research Results

Provides a consolidated research view containing:

- Training attack categories
- Test attack categories
- Unseen-category evaluation
- Confusion matrix
- DDoS results
- PortScan results
- Bot limitation
- Research findings

---

## Lateral Movement

Provides the results for:

### Objective 2

Controlled lateral-movement simulation.

### Objective 4

Evaluation of the existing detector against the unseen movement benchmark.

The page displays:

- Number of scenarios
- Benchmark flows
- Movement flows
- Nodes
- TP
- TN
- FP
- FN
- Precision
- Recall
- F1
- Confusion matrix
- Communication paths
- Research limitation

---

## Model

Documents:

- GNN architecture
- Node features
- Edge features
- Message passing
- Edge classifier
- Training configuration
- Chronological evaluation methodology

---

## Settings

Provides application and system information.

---

# 38. Project Directory

A simplified structure is:

```text
GNN/
│
├── backend/
│   │
│   ├── app.py
│   │
│   ├── models/
│   │   └── model.py
│   │
│   ├── services/
│   │   ├── inference_engine.py
│   │   ├── inference_service.py
│   │   ├── dynamic_network.py
│   │   └── ...
│   │
│   ├── artifacts/
│   │   ├── best_temporal_edge_gnn.pt
│   │   ├── best_detection_threshold.npy
│   │   ├── node_mapping.pkl
│   │   ├── node features...
│   │   ├── train_context...
│   │   └── simulated_lateral_movement_benchmark.csv
│   │
│   └── ...
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── DetectionPanel.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EnterpriseEvaluation.jsx
│   │   │   ├── DynamicNetworkGraph.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── ResearchResults.jsx
│   │   │   ├── LateralMovement.jsx
│   │   │   ├── Model.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── README.md
└── RESEARCH_OBJECTIVES.md
```

---

# 39. Installation

## Backend Requirements

Recommended Python environment:

```text
Python 3.10+
```

Required packages include:

```text
torch
fastapi
uvicorn
numpy
pandas
scikit-learn
```

Install dependencies according to the backend dependency file included in the project.

---

## Frontend Requirements

Recommended:

```text
Node.js
npm
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

---

# 40. Running the Backend

From the project root:

```bash
uvicorn app:app --app-dir backend --reload
```

The backend should run at:

```text
http://127.0.0.1:8000
```

Verify it using:

```text
http://127.0.0.1:8000/health
```

Expected status:

```json
{
  "status": "healthy",
  "inference_ready": true
}
```

---

# 41. Running the Frontend

Open a second terminal.

Navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local URL, normally:

```text
http://localhost:5173
```

---

# 42. Recommended Startup Order

### Terminal 1 — Backend

```bash
uvicorn app:app --app-dir backend --reload
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the Vite URL in a browser.

---

# 43. Example Flow Inference

A verified PortScan flow from CICIDS2017 was tested using the trained model.

Example:

```text
Source IP:
172.16.0.1

Destination IP:
192.168.10.50

Source Port:
40620

Destination Port:
80

Protocol:
TCP
```

The model produced approximately:

```text
Attack probability:
73.31%

Threshold:
67.00%

Prediction:
ATTACK
```

This demonstrates inference on an unseen PortScan flow.

---

# 44. Network Statistics

The graph contains:

```text
Unique IP nodes:
19,129

Training context edges:
62,538
```

The frontend uses the graph context to visualize communication relationships.

Critical or attack-related networks are highlighted separately from normal networks.

---

# 45. Security and Ethical Considerations

This project is designed for academic and defensive cybersecurity research.

The system:

- Analyzes network-flow data
- Performs graph-based intrusion detection
- Evaluates machine-learning models
- Generates synthetic benchmark records
- Does not execute attacks
- Does not exploit real systems
- Does not perform unauthorized scanning
- Does not generate live malicious traffic

The lateral-movement component is specifically designed as a controlled synthetic evaluation.

---

# 46. Methodological Limitations

## 46.1 Synthetic Lateral Movement

The lateral-movement benchmark is synthetic.

Therefore:

```text
Synthetic benchmark
        ≠
Real enterprise lateral movement
```

Its results should not be interpreted as equivalent to real attack traffic.

---

## 46.2 Limited Lateral-Movement Recall

The current model achieves:

```text
Recall = 2.50%
```

on the synthetic lateral-movement benchmark.

Only:

```text
3 / 120
```

labelled movement flows were detected.

This indicates substantial domain shift between the CICIDS2017 training distribution and the synthetic movement benchmark.

---

## 46.3 Bot Generalization Limitation

The test evaluation shows:

```text
Bot recall = 0%
```

This demonstrates that unseen-category performance is not uniform across all attack types.

---

## 46.4 Temporal Architecture Limitation

The project uses chronological graph snapshots, but the current GNN does not directly use edge timestamps during message passing.

Therefore, the preferred description is:

> Edge-Aware GNN with chronological graph-snapshot evaluation

rather than:

> Fully Temporal GNN

---

## 46.5 Enterprise Domain Shift

External enterprise CSV files may have a different feature distribution from CICIDS2017.

Therefore, strong CICIDS2017 performance does not automatically imply identical performance on every enterprise network.

---

# 47. Research Contribution

The project combines multiple cybersecurity and machine-learning components into a single end-to-end system:

```text
Network Flow Data
        |
        v
Graph Representation
        |
        v
Edge-Aware GNN
        |
        v
Intrusion Detection
        |
        v
Chronological Graph Analysis
        |
        v
Unseen Attack Evaluation
        |
        v
Synthetic Lateral-Movement Benchmark
        |
        v
Enterprise Evaluation
        |
        v
Cyber-SOC Visualization
```

The contribution can be viewed in three parts.

### Machine Learning

Graph-based network intrusion detection using an Edge-Aware GNN.

### Cybersecurity Analysis

Network topology, suspicious communication paths, unseen-category analysis, and lateral-movement evaluation.

### Visualization

A complete cyber-SOC frontend for inspecting network and model behavior.

---

# 48. Research Findings

## Finding 1 — Graph Representation

Enterprise network activity can be represented as a directed graph using hosts as nodes and network flows as edges.

---

## Finding 2 — Strong CICIDS2017 Test Performance

The final chronological test evaluation achieved:

```text
Accuracy:  99.68%
Precision: 99.89%
Recall:    99.32%
F1:        99.60%
ROC-AUC:   99.76%
PR-AUC:    99.74%
```

---

## Finding 3 — Unseen DDoS and PortScan Generalization

The current model performs strongly on the unseen DDoS and PortScan categories:

```text
DDoS recall:
99.9977%

PortScan recall:
100%
```

---

## Finding 4 — Bot Limitation

The current model does not detect the Bot category in the test evaluation:

```text
Bot recall:
0%
```

This demonstrates that generalization is dependent on the characteristics of the unseen attack category.

---

## Finding 5 — Lateral-Movement Generalization Limitation

The synthetic lateral-movement evaluation produced:

```text
TP:
3

FN:
117

Recall:
2.50%

F1:
4.88%
```

This demonstrates that the current model does not generalize strongly to the synthetic movement distribution.

---

# 49. Future Work

Potential future research directions include:

1. Use more realistic lateral-movement datasets.
2. Improve representation of multi-stage internal movement.
3. Investigate temporal message-passing architectures.
4. Add richer host behavioral features.
5. Investigate domain adaptation between datasets.
6. Improve generalization to rare attack categories.
7. Evaluate the system on additional enterprise network environments.
8. Investigate graph-level and path-level anomaly detection.
9. Explore online and streaming graph updates.
10. Evaluate robustness against changing network behavior.
11. Investigate calibration of attack probabilities.
12. Improve explainability of suspicious communication paths.
13. Investigate additional graph architectures such as GAT, GraphSAGE, or temporal graph models.
14. Evaluate the model using additional real-world enterprise traffic datasets.

---

# 50. Conclusion

This project presents a graph-based network intrusion detection system built around an Edge-Aware Graph Neural Network.

The system transforms network flows into a directed graph, learns node representations through edge-aware message passing, and classifies individual network flows using an edge classifier.

The project goes beyond basic binary intrusion detection by providing:

- Graph-based enterprise activity modeling
- Edge-Aware GNN training
- Chronological graph evaluation
- Dynamic network visualization
- Suspicious communication-path analysis
- Enterprise CSV evaluation
- Unseen attack-category evaluation
- Controlled lateral-movement simulation
- Research analytics
- Model documentation
- Cyber-SOC frontend

All four original research objectives are implemented:

```text
01  Model Enterprise Activity as a Graph
    COMPLETE

02  Simulate / Collect Lateral Movement Data
    COMPLETE

03  Train a Graph Neural Network
    COMPLETE

04  Evaluate Zero-Day-Style Generalization
    COMPLETE AS AN EXPERIMENTAL EVALUATION
```

The results also reveal important limitations. The model performs strongly on the CICIDS2017 chronological test evaluation, but generalization is not uniform across unseen attack categories and is limited on the synthetic lateral-movement benchmark.

These limitations are retained as part of the research findings.

---

# 51. Project Status

```text
[✓] Dataset preprocessing
[✓] Graph construction
[✓] Node feature engineering
[✓] Edge feature engineering
[✓] Chronological splitting
[✓] GNN training
[✓] Model checkpoint
[✓] Threshold selection
[✓] Test evaluation
[✓] Unseen-category evaluation
[✓] Enterprise CSV evaluation
[✓] Dynamic network visualization
[✓] Suspicious communication paths
[✓] Lateral-movement simulation
[✓] Objective 2 frontend
[✓] Objective 4 frontend
[✓] Research analytics
[✓] Model documentation
[✓] Cyber-SOC interface
[✓] Backend APIs
```

---

# 52. Key Results at a Glance

| Metric | Result |
|---|---:|
| CICIDS2017 Test Accuracy | **99.68%** |
| CICIDS2017 Test Precision | **99.89%** |
| CICIDS2017 Test Recall | **99.32%** |
| CICIDS2017 Test F1 | **99.60%** |
| ROC-AUC | **99.76%** |
| PR-AUC | **99.74%** |
| Graph Nodes | **19,129** |
| Training Context Edges | **62,538** |
| Detection Threshold | **0.67** |
| DDoS Recall | **99.9977%** |
| PortScan Recall | **100%** |
| Bot Recall | **0%** |
| Lateral-Movement Recall | **2.50%** |
| Lateral-Movement F1 | **4.88%** |

---

# 53. Disclaimer

This project is intended for **academic, research, and defensive cybersecurity purposes**.

The synthetic lateral-movement benchmark does not execute attacks or generate live malicious traffic.

The zero-day-style evaluation represents an experimental unseen-category generalization test and should not be interpreted as proof of real-world zero-day detection capability.

The reported results are specific to the datasets, preprocessing pipeline, model configuration, threshold, and evaluation methodology used in this project.

---
