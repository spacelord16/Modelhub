"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricsData {
  accuracy: number[];
  loss: number[];
  labels: string[];
}

export function ModelMetricsChart() {
  const [metricsData, setMetricsData] = useState<MetricsData>({
    accuracy: [],
    loss: [],
    labels: [],
  });

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchMetrics = async () => {
      // Simulated metrics data
      const dummyData: MetricsData = {
        accuracy: [0.85, 0.87, 0.89, 0.9, 0.91, 0.92, 0.92],
        loss: [0.45, 0.4, 0.35, 0.32, 0.3, 0.29, 0.29],
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      };
      setMetricsData(dummyData);
    };

    fetchMetrics();
  }, []);

  const chartData: ChartData<"line"> = {
    labels: metricsData.labels,
    datasets: [
      {
        label: "Accuracy",
        data: metricsData.accuracy,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
      },
      {
        label: "Loss",
        data: metricsData.loss,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.0,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
