import { useState } from "react";
import { predictFlow } from "../services/api";

function useDetection() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detect = async (flowData) => {
    setLoading(true);
    setError("");

    try {
      const data = await predictFlow(flowData);
      setResult(data);
      return data;
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to connect to detection API.";

      setError(message);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError("");
  };

  return {
    result,
    loading,
    error,
    detect,
    reset,
  };
}

export default useDetection;