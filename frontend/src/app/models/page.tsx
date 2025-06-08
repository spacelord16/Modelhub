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
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Available Models
      </h1>

      {models.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            No models found
          </div>
          <p className="text-gray-400 dark:text-gray-500">
            Upload your first model to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Model Title */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {model.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                  {model.description}
                </p>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {model.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Accuracy Badge */}
                {model.versions[0]?.model_metadata?.accuracy && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded-md font-medium inline-block">
                    Accuracy:{" "}
                    {(model.versions[0].model_metadata.accuracy * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                )}
              </div>

              {/* Model Info Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Framework:</span>
                  <br />
                  <span className="text-gray-700 dark:text-gray-300">
                    {model.framework}
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Task:</span>
                  <br />
                  <span className="text-gray-700 dark:text-gray-300">
                    {model.task_type}
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Version:</span>
                  <br />
                  <span className="text-gray-700 dark:text-gray-300">
                    {model.current_version}
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Size:</span>
                  <br />
                  <span className="text-gray-700 dark:text-gray-300">
                    {model.versions[0]?.size_mb.toFixed(2)} MB
                  </span>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-500 dark:text-gray-400">
                  📥 {model.downloads} downloads
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ⭐ {model.average_rating.toFixed(1)} ({model.likes} likes)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
