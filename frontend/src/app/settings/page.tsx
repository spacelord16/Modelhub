"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Token is stored in localStorage by the API client (not exposed via useAuth)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchMaskedKey();
  }, [user]);

  const fetchMaskedKey = async () => {
    const res = await fetch(`${API_URL}/users/me/api-key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMaskedKey(data.api_key || null);
    setRevealedKey(null);
  };

  const generateKey = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`${API_URL}/users/me/api-key`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRevealedKey(data.api_key);
    setMaskedKey(data.api_key.slice(0, 8) + "..." + data.api_key.slice(-4));
    setMessage({ text: "New API key generated! Copy it now — it won't be shown again in full.", type: "success" });
    setLoading(false);
  };

  const revokeKey = async () => {
    if (!confirm("Revoke your API key? Any apps using it will stop working.")) return;
    setLoading(true);
    await fetch(`${API_URL}/users/me/api-key`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMaskedKey(null);
    setRevealedKey(null);
    setMessage({ text: "API key revoked.", type: "success" });
    setLoading(false);
  };

  const copyKey = async () => {
    const keyToCopy = revealedKey || maskedKey;
    if (!keyToCopy) return;
    await navigator.clipboard.writeText(keyToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayKey = revealedKey || maskedKey;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      {/* API Key Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">API Key</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Use this key to authenticate API requests without logging in. Pass it as the{" "}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">X-API-Key</code> header.
        </p>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}>
            {message.text}
          </div>
        )}

        {/* Key display */}
        {displayKey ? (
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-lg text-sm font-mono break-all">
                {displayKey}
              </code>
              <button
                onClick={copyKey}
                className="shrink-0 px-4 py-2.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {!revealedKey && (
              <p className="text-xs text-gray-400 mt-2">Key is masked. Generate a new one to see the full value.</p>
            )}
          </div>
        ) : (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-500 dark:text-gray-400">
            No API key yet. Generate one below.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={generateKey}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {displayKey ? "Regenerate Key" : "Generate Key"}
          </button>
          {displayKey && (
            <button
              onClick={revokeKey}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
            >
              Revoke Key
            </button>
          )}
        </div>
      </div>

      {/* Usage example */}
      {displayKey && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to use it</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Run inference on a model:</p>
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">
{`curl -X POST https://your-api/api/v1/models/1/predict \\
  -H "X-API-Key: ${revealedKey || maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"input": [[5.1, 3.5, 1.4, 0.2]]}'`}
              </pre>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Download a model:</p>
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">
{`curl -O -H "X-API-Key: ${revealedKey || maskedKey}" \\
  https://your-api/api/v1/models/1/download`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
