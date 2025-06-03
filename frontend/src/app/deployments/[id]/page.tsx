"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  Deployment,
  DeploymentMetrics,
  DeploymentLog,
} from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deploymentId = parseInt(params.id as string);

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "metrics" | "logs" | "settings"
  >("overview");

  // Prediction test state
  const [testPayload, setTestPayload] = useState<string>(
    '{"data": [1, 2, 3, 4, 5]}'
  );
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  useEffect(() => {
    if (deploymentId) {
      fetchDeployment();
      fetchMetrics();
      fetchLogs();
    }
  }, [deploymentId]);

  const fetchDeployment = async () => {
    try {
      const data = await apiClient.getDeployment(deploymentId);
      setDeployment(data);
    } catch (err) {
      setError("Failed to fetch deployment");
      console.error(err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await apiClient.getDeploymentMetrics(deploymentId);
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await apiClient.getDeploymentLogs(deploymentId, 50);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      setError(null);
      await apiClient.deploymentAction(deploymentId, action);
      // Refresh deployment data
      await fetchDeployment();
      await fetchMetrics();
    } catch (err) {
      console.error(`Failed to ${action} deployment:`, err);
      setError(`Failed to ${action} deployment`);
    }
  };

  const handlePrediction = async () => {
    try {
      setPredictionLoading(true);
      setPredictionResult(null);

      const payload = JSON.parse(testPayload);
      const result = await apiClient.predict(deploymentId, payload);
      setPredictionResult(result);
    } catch (err: any) {
      setPredictionResult({ error: err.message || "Prediction failed" });
    } finally {
      setPredictionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      running: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      building: "bg-blue-100 text-blue-800",
      deploying: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      stopped: "bg-gray-100 text-gray-800",
      updating: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!deployment) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Deployment not found
            </h1>
            <Link
              href="/deployments"
              className="mt-4 inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
            >
              Back to Deployments
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/deployments"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ← Back to Deployments
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {deployment.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {deployment.description || "No description"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(deployment.status)}
              {deployment.status === "running" && (
                <button
                  onClick={() => handleAction("stop")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Stop
                </button>
              )}
              {deployment.status === "stopped" && (
                <button
                  onClick={() => handleAction("start")}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Start
                </button>
              )}
              <button
                onClick={() => handleAction("restart")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Restart
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "metrics", label: "Metrics" },
              { id: "logs", label: "Logs" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </h3>
                  <div className="mt-2">
                    {getStatusBadge(deployment.status)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Requests
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {deployment.request_count}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg Response Time
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {deployment.avg_response_time
                      ? `${deployment.avg_response_time}ms`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Replicas
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {metrics?.current_replicas || deployment.min_replicas}
                  </p>
                </div>
              </div>

              {/* Configuration */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Configuration
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Deployment Type
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {deployment.deployment_type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      CPU Limit
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {deployment.cpu_limit} cores
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Memory Limit
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {deployment.memory_limit} MB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Auto-scaling
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {deployment.auto_scale_enabled ? "Enabled" : "Disabled"}
                    </dd>
                  </div>
                  {deployment.endpoint_url && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Endpoint URL
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        <a
                          href={deployment.endpoint_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500"
                        >
                          {deployment.endpoint_url}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Test Prediction */}
              {deployment.status === "running" && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Test Prediction
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Request Payload (JSON)
                      </label>
                      <textarea
                        value={testPayload}
                        onChange={(e) => setTestPayload(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder='{"data": [1, 2, 3, 4, 5]}'
                      />
                    </div>
                    <div>
                      <button
                        onClick={handlePrediction}
                        disabled={predictionLoading}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                      >
                        {predictionLoading ? "Testing..." : "Test Prediction"}
                      </button>
                    </div>
                    {predictionResult && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Response
                        </label>
                        <pre className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm overflow-x-auto">
                          {JSON.stringify(predictionResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                {metrics ? (
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Request Count
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.request_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Avg Response Time
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.avg_response_time
                          ? `${metrics.avg_response_time}ms`
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Current Replicas
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.current_replicas}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        CPU Usage
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.cpu_usage ? `${metrics.cpu_usage}%` : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Memory Usage
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.memory_usage
                          ? `${metrics.memory_usage}%`
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Last Request
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.last_request_at
                          ? formatDate(metrics.last_request_at)
                          : "Never"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No metrics available
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Deployment Logs
                  </h3>
                  <button
                    onClick={fetchLogs}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded"
                      >
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            log.log_level === "ERROR"
                              ? "bg-red-100 text-red-800"
                              : log.log_level === "WARNING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {log.log_level}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {log.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(log.created_at)}
                            {log.component && ` • ${log.component}`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No logs available
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Deployment Settings
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Update deployment configuration (feature coming soon)
                </p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-red-600 font-medium mb-2">Danger Zone</h4>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this deployment? This action cannot be undone."
                        )
                      ) {
                        apiClient.deleteDeployment(deploymentId).then(() => {
                          router.push("/deployments");
                        });
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Delete Deployment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
