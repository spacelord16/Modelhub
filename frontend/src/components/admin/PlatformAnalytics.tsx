"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Activity,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface AnalyticsDashboard {
  platform_stats: {
    total_users: number;
    active_users_today: number;
    total_models: number;
    models_uploaded_today: number;
    total_downloads: number;
    downloads_today: number;
    pending_approvals: number;
    approved_models_today: number;
    rejected_models_today: number;
    emergency_disabled_count: number;
  };
  recent_activities: Array<{
    activity_type: string;
    count: number;
    last_occurrence: string;
  }>;
  top_models: Array<{
    model_name: string;
    downloads: number;
    views: number;
    likes: number;
    owner_username: string;
  }>;
  user_growth: Array<{
    date: string;
    count: number;
  }>;
  model_growth: Array<{
    date: string;
    count: number;
  }>;
}

export function PlatformAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/analytics/dashboard");
      setAnalytics(response.data);
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading analytics...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <span className="text-gray-500">Failed to load analytics data</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recent_activities
                .slice(0, 5)
                .map((activity, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm capitalize">
                      {activity.activity_type.replace("_", " ")}
                    </span>
                    <Badge variant="outline">{activity.count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Models</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.top_models.slice(0, 5).map((model, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate">
                      {model.model_name}
                    </span>
                    <Badge variant="outline">{model.downloads}</Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    by {model.owner_username}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Trends</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">User Growth (30d)</span>
                  <span className="text-sm font-medium">
                    {analytics.user_growth[0]?.count || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (analytics.platform_stats.total_users / 1000) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Model Growth (30d)</span>
                  <span className="text-sm font-medium">
                    {analytics.model_growth[0]?.count || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (analytics.platform_stats.total_models / 500) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>Key metrics and system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Total Downloads</div>
                  <div className="text-2xl font-bold">
                    {analytics.platform_stats.total_downloads.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600">
                    +{analytics.platform_stats.downloads_today} today
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Active Users</div>
                  <div className="text-2xl font-bold">
                    {analytics.platform_stats.active_users_today}
                  </div>
                  <div className="text-xs text-gray-500">
                    of {analytics.platform_stats.total_users} total
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Models Approved Today:</span>
                    <span className="font-medium text-green-600">
                      {analytics.platform_stats.approved_models_today}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Models Rejected Today:</span>
                    <span className="font-medium text-red-600">
                      {analytics.platform_stats.rejected_models_today}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Approvals:</span>
                    <span className="font-medium text-yellow-600">
                      {analytics.platform_stats.pending_approvals}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency Disabled:</span>
                    <span className="font-medium text-red-600">
                      {analytics.platform_stats.emergency_disabled_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Recent platform activities (last 7 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recent_activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium capitalize">
                        {activity.activity_type.replace("_", " ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        Last:{" "}
                        {new Date(
                          activity.last_occurrence
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.count} times</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
