"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, DeploymentWithModel } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<DeploymentWithModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchDeployments();
  }, [filter]);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDeployments({
        status: filter || undefined,
        limit: 100,
      });
      setDeployments(response.deployments);
    } catch (err) {
      setError("Failed to fetch deployments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (deploymentId: number, action: string) => {
    try {
      await apiClient.deploymentAction(deploymentId, action);
      // Refresh the list
      fetchDeployments();
    } catch (err) {
      console.error(`Failed to ${action} deployment:`, err);
      setError(`Failed to ${action} deployment`);
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Model Deployments
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your deployed models and their endpoints
            </p>
          </div>
          <Link
            href="/deployments/create"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Deploy Model
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
              <option value="building">Building</option>
              <option value="deploying">Deploying</option>
              <option value="failed">Failed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Deployments List */}
        {deployments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No deployments
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by deploying your first model.
            </p>
            <div className="mt-6">
              <Link
                href="/deployments/create"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Deploy Model
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {deployments.map((deployment) => (
                <li key={deployment.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div>
                          <Link
                            href={`/deployments/${deployment.id}`}
                            className="text-lg font-medium text-primary-600 hover:text-primary-500"
                          >
                            {deployment.name}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Model: {deployment.model_name} (
                            {deployment.model_framework})
                          </p>
                          {deployment.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {deployment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(deployment.status)}
                        <div className="flex space-x-2">
                          {deployment.status === "stopped" && (
                            <button
                              onClick={() =>
                                handleAction(deployment.id, "start")
                              }
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Start
                            </button>
                          )}
                          {deployment.status === "running" && (
                            <button
                              onClick={() =>
                                handleAction(deployment.id, "stop")
                              }
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Stop
                            </button>
                          )}
                          {(deployment.status === "running" ||
                            deployment.status === "stopped") && (
                            <button
                              onClick={() =>
                                handleAction(deployment.id, "restart")
                              }
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Restart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="mr-2">Resources:</span>
                          {deployment.cpu_limit} CPU, {deployment.memory_limit}
                          MB RAM
                        </p>
                        {deployment.endpoint_url && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                            <span className="mr-2">Endpoint:</span>
                            <a
                              href={deployment.endpoint_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-500"
                            >
                              {deployment.endpoint_url.substring(0, 50)}...
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <span>Created {formatDate(deployment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
