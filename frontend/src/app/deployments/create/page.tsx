"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, Model } from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";

export default function CreateDeploymentPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    model_id: "",
    deployment_type: "container",
    cpu_limit: 1.0,
    memory_limit: 512,
    max_replicas: 3,
    min_replicas: 1,
    auto_scale_enabled: true,
    scale_up_threshold: 70,
    scale_down_threshold: 30,
    environment_vars: {} as Record<string, string>,
  });

  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
    [{ key: "", value: "" }]
  );

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const data = await apiClient.getModels();
      setModels(data);
    } catch (err) {
      setError("Failed to fetch models");
      console.error(err);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEnvVarChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);

    // Convert to object for form data
    const envVarsObj: Record<string, string> = {};
    newEnvVars.forEach(({ key, value }) => {
      if (key && value) {
        envVarsObj[key] = value;
      }
    });
    setFormData((prev) => ({
      ...prev,
      environment_vars: envVarsObj,
    }));
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index);
    setEnvVars(newEnvVars);

    // Update form data
    const envVarsObj: Record<string, string> = {};
    newEnvVars.forEach(({ key, value }) => {
      if (key && value) {
        envVarsObj[key] = value;
      }
    });
    setFormData((prev) => ({
      ...prev,
      environment_vars: envVarsObj,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const deploymentData = {
        ...formData,
        model_id: parseInt(formData.model_id),
      };

      await apiClient.createDeployment(deploymentData);
      router.push("/deployments");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create deployment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (modelsLoading) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Deploy Model
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Create a new deployment for your model
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Basic Information
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Basic deployment configuration
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Deployment Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      placeholder="my-model-deployment"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      placeholder="Description of this deployment"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="model_id"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Model *
                    </label>
                    <select
                      name="model_id"
                      id="model_id"
                      value={formData.model_id}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:text-white"
                    >
                      <option value="">Select a model</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.framework}) - v
                          {model.current_version}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="deployment_type"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Deployment Type
                    </label>
                    <select
                      name="deployment_type"
                      id="deployment_type"
                      value={formData.deployment_type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:text-white"
                    >
                      <option value="container">Container</option>
                      <option value="serverless">Serverless</option>
                      <option value="endpoint">Dedicated Endpoint</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Configuration */}
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Resources
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure CPU, memory, and scaling settings
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-3">
                    <label
                      htmlFor="cpu_limit"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      CPU Limit (cores)
                    </label>
                    <input
                      type="number"
                      name="cpu_limit"
                      id="cpu_limit"
                      min="0.1"
                      max="8"
                      step="0.1"
                      value={formData.cpu_limit}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <label
                      htmlFor="memory_limit"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Memory Limit (MB)
                    </label>
                    <input
                      type="number"
                      name="memory_limit"
                      id="memory_limit"
                      min="128"
                      max="8192"
                      value={formData.memory_limit}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <label
                      htmlFor="min_replicas"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Min Replicas
                    </label>
                    <input
                      type="number"
                      name="min_replicas"
                      id="min_replicas"
                      min="1"
                      max="5"
                      value={formData.min_replicas}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <label
                      htmlFor="max_replicas"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Max Replicas
                    </label>
                    <input
                      type="number"
                      name="max_replicas"
                      id="max_replicas"
                      min="1"
                      max="10"
                      value={formData.max_replicas}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Auto-scaling */}
                <div className="mt-6">
                  <div className="flex items-center">
                    <input
                      id="auto_scale_enabled"
                      name="auto_scale_enabled"
                      type="checkbox"
                      checked={formData.auto_scale_enabled}
                      onChange={handleInputChange}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="auto_scale_enabled"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      Enable auto-scaling
                    </label>
                  </div>

                  {formData.auto_scale_enabled && (
                    <div className="mt-4 grid grid-cols-6 gap-6">
                      <div className="col-span-3">
                        <label
                          htmlFor="scale_up_threshold"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Scale Up Threshold (% CPU)
                        </label>
                        <input
                          type="number"
                          name="scale_up_threshold"
                          id="scale_up_threshold"
                          min="0"
                          max="100"
                          value={formData.scale_up_threshold}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="col-span-3">
                        <label
                          htmlFor="scale_down_threshold"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Scale Down Threshold (% CPU)
                        </label>
                        <input
                          type="number"
                          name="scale_down_threshold"
                          id="scale_down_threshold"
                          min="0"
                          max="100"
                          value={formData.scale_down_threshold}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Environment Variables
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure environment variables for your deployment
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="space-y-4">
                  {envVars.map((envVar, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={envVar.key}
                          onChange={(e) =>
                            handleEnvVarChange(index, "key", e.target.value)
                          }
                          placeholder="Variable name"
                          className="block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={envVar.value}
                          onChange={(e) =>
                            handleEnvVarChange(index, "value", e.target.value)
                          }
                          placeholder="Value"
                          className="block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEnvVar(index)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEnvVar}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add Variable
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? "Deploying..." : "Deploy Model"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
