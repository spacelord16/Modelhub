"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    framework: "",
    version: "1.0.0",
    format: "",
    task_type: "",
    license: "MIT",
    paper_url: "",
    github_url: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !modelFile ||
      !formData.name ||
      !formData.description ||
      !formData.framework
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value);
        }
      });

      // Add tags as JSON string
      submitData.append("tags", JSON.stringify(tags));

      // Add model file
      submitData.append("model_file", modelFile);

      // Add empty model metadata
      submitData.append("model_metadata", JSON.stringify({}));

      await apiClient.uploadModel(submitData);
      router.push("/models");
    } catch (err) {
      console.error(err);
      setError(
        "Failed to upload model. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Model</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Model Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="framework" className="block text-sm font-medium">
              Framework *
            </label>
            <select
              id="framework"
              name="framework"
              value={formData.framework}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
              required
            >
              <option value="">Select a framework</option>
              <option value="pytorch">PyTorch</option>
              <option value="tensorflow">TensorFlow</option>
              <option value="onnx">ONNX</option>
              <option value="huggingface">Hugging Face</option>
            </select>
          </div>

          <div>
            <label htmlFor="format" className="block text-sm font-medium">
              Format *
            </label>
            <select
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
              required
            >
              <option value="">Select a format</option>
              <option value="pt">PyTorch (.pt)</option>
              <option value="pth">PyTorch (.pth)</option>
              <option value="saved_model">TensorFlow SavedModel</option>
              <option value="h5">Keras (.h5)</option>
              <option value="onnx">ONNX (.onnx)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="version" className="block text-sm font-medium">
              Version *
            </label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
              required
            />
          </div>

          <div>
            <label htmlFor="task_type" className="block text-sm font-medium">
              Task Type *
            </label>
            <select
              id="task_type"
              name="task_type"
              value={formData.task_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
              required
            >
              <option value="">Select a task type</option>
              <option value="image_classification">Image Classification</option>
              <option value="object_detection">Object Detection</option>
              <option value="segmentation">Segmentation</option>
              <option value="nlp">Natural Language Processing</option>
              <option value="generative">Generative</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
              placeholder="Add a tag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="px-3 py-1 bg-gray-200 rounded-full flex items-center gap-1 dark:bg-gray-700"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="license" className="block text-sm font-medium">
              License *
            </label>
            <input
              type="text"
              id="license"
              name="license"
              value={formData.license}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="paper_url" className="block text-sm font-medium">
              Paper URL
            </label>
            <input
              type="url"
              id="paper_url"
              name="paper_url"
              value={formData.paper_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div>
            <label htmlFor="github_url" className="block text-sm font-medium">
              GitHub URL
            </label>
            <input
              type="url"
              id="github_url"
              name="github_url"
              value={formData.github_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        <div>
          <label htmlFor="model_file" className="block text-sm font-medium">
            Model File *
          </label>
          <input
            type="file"
            id="model_file"
            onChange={(e) => setModelFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full bg-white dark:bg-gray-800"
            required
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-800"
        >
          {loading ? "Uploading..." : "Upload Model"}
        </button>
      </form>
    </div>
  );
}
