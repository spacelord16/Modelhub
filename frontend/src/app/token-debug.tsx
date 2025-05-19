"use client";

import { useEffect, useState } from "react";

export default function TokenDebug() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleRefresh = () => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  };

  const handleClear = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const handleSetSampleToken = () => {
    const sampleToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDgzMjcxNDQsInN1YiI6IjEifQ.Sgyztmkc_Jt9qbL4VwkuesfAb9Zv-p8mp-kQfPnoRLU";
    localStorage.setItem("token", sampleToken);
    setToken(sampleToken);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Token Debug</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current Token:</h2>
        {token ? (
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
            {token}
          </pre>
        ) : (
          <p className="text-red-500">No token found in localStorage</p>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Token
        </button>
        <button
          onClick={handleSetSampleToken}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Set Sample Token
        </button>
      </div>
    </div>
  );
}
