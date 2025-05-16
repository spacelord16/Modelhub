"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ApiTest() {
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get(
          `${apiUrl.replace("/api/v1", "")}/health`
        );
        setApiStatus("success");
        setMessage(JSON.stringify(response.data, null, 2));
      } catch (err) {
        setApiStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    testConnection();
  }, [apiUrl]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Backend API URL:</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded">{apiUrl}</pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Health Check Status:
          {apiStatus === "loading" && (
            <span className="ml-2 text-blue-500">Loading...</span>
          )}
          {apiStatus === "success" && (
            <span className="ml-2 text-green-500">Connected!</span>
          )}
          {apiStatus === "error" && (
            <span className="ml-2 text-red-500">Failed to connect</span>
          )}
        </h2>

        {apiStatus === "success" && (
          <div className="mt-2">
            <h3 className="font-medium">Response:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-green-600 dark:text-green-400">
              {message}
            </pre>
          </div>
        )}

        {apiStatus === "error" && (
          <div className="mt-2">
            <h3 className="font-medium">Error:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-red-600">
              {error}
            </pre>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            If connected successfully: Proceed with implementing more features
          </li>
          <li>
            If connection failed: Check that your backend server is running
          </li>
        </ul>
      </div>
    </div>
  );
}
