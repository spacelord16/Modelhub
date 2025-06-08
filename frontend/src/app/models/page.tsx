"use client";

import { useEffect, useState } from "react";
import { Model, apiClient } from "../../lib/api";

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await apiClient.getModels();
        setModels(data);
      } catch (err) {
        setError("Failed to fetch models");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Models</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{model.name}</h2>
            <p className="text-gray-600 mb-4">{model.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap gap-1">
                {model.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {model.versions[0]?.model_metadata?.accuracy && (
                <div className="bg-green-50 text-green-800 text-sm px-3 py-1 rounded">
                  Accuracy:{" "}
                  {(model.versions[0].model_metadata.accuracy * 100).toFixed(1)}
                  %
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
              <span>Framework: {model.framework}</span>
              <span>Task: {model.task_type}</span>
              <span>Version: {model.current_version}</span>
              <span>Size: {model.versions[0]?.size_mb.toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{model.downloads} downloads</span>
              <span>
                ★ {model.average_rating.toFixed(1)} ({model.likes} likes)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
