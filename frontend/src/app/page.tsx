export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Deep Learning Model Hub
        </h1>
        <p className="text-center text-lg mb-8">
          An open-source platform for sharing, testing, and deploying deep
          learning models
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Cards */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Model Management
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Upload, share, and discover deep learning models
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Model Testing
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Test models online via interactive web UI
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Deployment
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Deploy models for live inference via REST API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
