import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});


export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};


export const getModelInfo = async () => {
  const response = await api.get("/model-info");
  return response.data;
};


export const getFeatures = async () => {
  const response = await api.get("/features");
  return response.data;
};


export const getVerifiedFlow = async () => {
  const response = await api.get("/verified-flow");
  return response.data;
};


export const getNetworkGraph = async (
  limit = 24
) => {
  const response = await api.get(
    "/network-graph",
    {
      params: {
        limit,
      },
    }
  );

  return response.data;
};


export const getNetworkNode = async (
  ipAddress
) => {
  const response = await api.get(
    `/network-node/${encodeURIComponent(
      ipAddress
    )}`
  );

  return response.data;
};


export const refreshNetworkMetadata = async () => {
  const response = await api.post(
    "/refresh-network-metadata"
  );

  return response.data;
};


export const predictFlow = async (
  flowData
) => {
  const response = await api.post(
    "/predict",
    flowData
  );

  return response.data;
};

export const getDynamicNetwork = async (
  windowMinutes = 5,
  maxSnapshots = 200,
  maxNodes = 60
) => {
  const response = await api.get(
    "/dynamic-network",
    {
      params: {
        window_minutes: windowMinutes,
        max_snapshots: maxSnapshots,
        max_nodes: maxNodes,
      },
    }
  );

  return response.data;
};


export const evaluateEnterprise = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/evaluate-enterprise",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
    }
  );

  return response.data;
};

export default api;
