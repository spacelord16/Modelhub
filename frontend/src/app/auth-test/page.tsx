"use client";

import { useState } from "react";
import axios from "axios";

export default function AuthTest() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus("Registering...");
    setRegisterError(null);

    try {
      const response = await axios.post(`${apiUrl}/auth/register`, {
        email: registerEmail,
        username: registerUsername,
        password: registerPassword,
        full_name: "Test User",
      });

      setRegisterStatus("Registration successful!");
      console.log("Registration response:", response.data);
    } catch (error) {
      setRegisterError(
        axios.isAxiosError(error)
          ? error.response?.data?.detail || error.message
          : "Unknown error occurred"
      );
      setRegisterStatus(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus("Logging in...");
    setLoginError(null);
    setToken(null);

    try {
      // Need to use FormData for OAuth2 password flow
      const formData = new FormData();
      formData.append("username", loginUsername);
      formData.append("password", loginPassword);

      const response = await axios.post(`${apiUrl}/auth/login`, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      setLoginStatus("Login successful!");
      setToken(response.data.access_token);
      console.log("Login response:", response.data);
    } catch (error) {
      setLoginError(
        axios.isAxiosError(error)
          ? error.response?.data?.detail || error.message
          : "Unknown error occurred"
      );
      setLoginStatus(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Authentication Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Register</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Register
            </button>
          </form>

          {registerStatus && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              {registerStatus}
            </div>
          )}

          {registerError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              Error: {registerError}
            </div>
          )}
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Login
            </button>
          </form>

          {loginStatus && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              {loginStatus}
            </div>
          )}

          {loginError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              Error: {loginError}
            </div>
          )}

          {token && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Access Token:</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                {token}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
