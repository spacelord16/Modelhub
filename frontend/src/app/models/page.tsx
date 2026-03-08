"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Model, apiClient } from "../../lib/api";

const FRAMEWORKS = ["All", "sklearn", "pytorch", "tensorflow", "onnx", "keras", "jax"];
const TASKS = ["All", "classification", "regression", "nlp", "computer vision", "audio", "other"];

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [framework, setFramework] = useState("All");
  const [taskType, setTaskType] = useState("All");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await apiClient.getModels({
          framework: framework !== "All" ? framework : undefined,
          task_type: taskType !== "All" ? taskType : undefined,
        });
        setModels(data);
      } catch (err) {
        setError("Failed to fetch models");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [framework, taskType]);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Models</h1>
        <Link
          href="/upload"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + Upload Model
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {FRAMEWORKS.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {TASKS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No models found</p>
          <p className="text-gray-400 text-sm">
            {search || framework !== "All" || taskType !== "All"
              ? "Try adjusting your search or filters"
              : "Be the first to upload a model!"}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="text-sm text-gray-400 mb-4">{filtered.length} model{filtered.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((model) => {
              const latestVersion = model.versions[0];
              const canPredict = latestVersion && ["joblib", "pkl", "pickle", "onnx"].includes(latestVersion.format.toLowerCase());

              return (
                <Link
                  key={model.id}
                  href={`/models/${model.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 p-6 flex flex-col"
                >
                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                        {model.name}
                      </h2>
                      {canPredict && (
                        <span className="shrink-0 ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                          Try It
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                      {model.framework}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      {model.task_type}
                    </span>
                    {model.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Performance badge */}
                  {latestVersion?.performance_metrics?.accuracy && (
                    <div className="mb-4">
                      <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2.5 py-1 rounded-md">
                        Accuracy: {(latestVersion.performance_metrics.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Footer stats */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                    <span>v{model.current_version} · {latestVersion?.size_mb.toFixed(1)} MB</span>
                    <span>📥 {model.downloads} · ⭐ {model.likes}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
