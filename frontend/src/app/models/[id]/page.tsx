"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Model, apiClient } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

export default function ModelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try It state
  const [inputText, setInputText] = useState("[[5.1, 3.5, 1.4, 0.2]]");
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.getModel(Number(id))
      .then(setModel)
      .catch(() => setError("Model not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePredict = async () => {
    if (!user) { router.push("/login"); return; }
    setPredicting(true);
    setResult(null);
    setPredictError(null);
    try {
      const parsed = JSON.parse(inputText);
      const res = await apiClient.predictModel(Number(id), parsed);
      setResult(res);
    } catch (e: any) {
      setPredictError(e.response?.data?.detail || e.message || "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  if (error || !model) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-red-500 text-lg">{error || "Model not found"}</p>
      <Link href="/models" className="text-indigo-600 hover:underline">← Back to models</Link>
    </div>
  );

  const latestVersion = model.versions[0];
  const supportsPredict = latestVersion && ["joblib", "pkl", "pickle", "onnx"].includes(latestVersion.format.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <Link href="/models" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
        ← All Models
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{model.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              v{model.current_version} · {model.framework} · {model.task_type}
            </p>
          </div>
          <div className="flex gap-2">
            {model.paper_url && (
              <a href={model.paper_url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                📄 Paper
              </a>
            )}
            {model.github_url && (
              <a href={model.github_url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                ⌥ GitHub
              </a>
            )}
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-5">{model.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {model.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span>📥 {model.downloads} downloads</span>
          <span>⭐ {model.likes} likes</span>
          <span>📋 {model.license}</span>
          {latestVersion && <span>💾 {latestVersion.size_mb.toFixed(2)} MB</span>}
        </div>
      </div>

      {/* Try It — only shown for supported formats when logged in */}
      {supportsPredict && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Try It</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Paste a JSON array of input rows. Each row is a list of feature values.
            {!user && <span className="text-indigo-500"> <Link href="/login" className="underline">Log in</Link> to run predictions.</span>}
          </p>

          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Input (JSON)</label>
          <textarea
            className="w-full h-24 font-mono text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="flex gap-3 mt-3">
            <button
              onClick={handlePredict}
              disabled={predicting || !user}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {predicting ? "Running..." : "Run Prediction"}
            </button>
            <button
              onClick={() => { setResult(null); setPredictError(null); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>

          {/* Result */}
          {predictError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
              {predictError}
            </div>
          )}
          {result && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Result</label>
              <pre className="bg-gray-900 text-green-400 text-sm p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Version history */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Versions</h2>
        <div className="space-y-3">
          {model.versions.map((v) => (
            <div key={v.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div>
                <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">v{v.version}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{v.format} · {v.size_mb.toFixed(2)} MB</span>
                {v.changelog && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.changelog}</p>}
              </div>
              <span className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
