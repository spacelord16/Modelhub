"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { ModelSearchBar } from "../../components/dashboard/ModelSearchBar";
import { ModelGrid } from "../../components/dashboard/ModelGrid";
import { ModelMetricsChart } from "../../components/dashboard/ModelMetricsChart";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, Model, Deployment } from "../../lib/api";
import {
  Upload,
  Rocket,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  BarChart,
  Zap,
} from "lucide-react";

interface DashboardStats {
  totalModels: number;
  activeDeployments: number;
  totalDownloads: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: "upload" | "deployment" | "update";
  message: string;
  timestamp: string;
  badge: string;
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-models");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalModels: 0,
    activeDeployments: 0,
    totalDownloads: 0,
    recentActivity: [],
  });
  const [models, setModels] = useState<Model[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user's models and deployments in parallel
      const [modelsData, deploymentsData] = await Promise.all([
        apiClient.getModels(),
        apiClient.getDeployments(),
      ]);

      setModels(modelsData);
      setDeployments(deploymentsData.deployments || []);

      // Calculate stats
      const totalDownloads = modelsData.reduce(
        (sum, model) => sum + (model.downloads || 0),
        0
      );
      const activeDeployments = (deploymentsData.deployments || []).filter(
        (d: Deployment) => d.status === "running"
      ).length;

      // Generate recent activity
      const recentActivity = generateRecentActivity(
        modelsData,
        deploymentsData.deployments || []
      );

      setStats({
        totalModels: modelsData.length,
        activeDeployments,
        totalDownloads,
        recentActivity,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (
    models: Model[],
    deployments: Deployment[]
  ): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Add recent model uploads
    models.slice(0, 3).forEach((model, index) => {
      activities.push({
        id: `model-${model.id}`,
        type: "upload",
        message: `Uploaded ${model.name}`,
        timestamp: model.created_at,
        badge: "Upload",
      });
    });

    // Add recent deployments
    deployments.slice(0, 2).forEach((deployment, index) => {
      activities.push({
        id: `deployment-${deployment.id}`,
        type: "deployment",
        message: `Deployed ${deployment.name}`,
        timestamp: deployment.created_at,
        badge: "Deploy",
      });
    });

    // Sort by timestamp and take the 5 most recent
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 5);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "Upload":
        return "default";
      case "Deploy":
        return "secondary";
      case "Update":
        return "outline";
      default:
        return "default";
    }
  };

  // Show onboarding for new users
  const isNewUser = stats.totalModels === 0 && stats.activeDeployments === 0;

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Model Hub! 👋</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Hi {user?.full_name || "there"}! Let's get you started with your
            first model.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You're all set up! Follow the steps below to upload your first
              model and start deploying.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card
              className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/upload")}
            >
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                1. Upload Your Model
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by uploading your first machine learning model
              </p>
              <Button className="w-full">
                Upload Model <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Rocket className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                2. Deploy Your Model
              </h3>
              <p className="text-muted-foreground mb-4">
                Turn your model into a live API endpoint
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Next
              </Button>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Monitor & Scale</h3>
              <p className="text-muted-foreground mb-4">
                Track performance and scale your deployments
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </Card>
          </div>

          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Ready to Get Started? 🚀
                </h3>
                <p className="text-blue-700">
                  Upload your first model and see it appear in your dashboard
                  instantly!
                </p>
              </div>
              <Button size="lg" onClick={() => router.push("/upload")}>
                Upload First Model
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.full_name || "User"}! 🎯
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your models and deployments
          </p>
        </div>
        <Button size="lg" onClick={() => router.push("/upload")}>
          <Upload className="mr-2 h-4 w-4" />
          Upload New Model
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModels}</div>
            <p className="text-xs text-muted-foreground">
              Models in your library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Deployments
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeployments}</div>
            <p className="text-xs text-muted-foreground">
              Running in production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Downloads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">Community usage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Models</CardTitle>
                <ModelSearchBar onSearch={setSearchQuery} />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="my-models">
                    My Models ({stats.totalModels})
                  </TabsTrigger>
                  <TabsTrigger value="deployments">
                    Deployments ({stats.activeDeployments})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="my-models">
                  <ModelGrid filter={searchQuery} category="my-models" />
                </TabsContent>
                <TabsContent value="deployments">
                  <div className="space-y-4">
                    {deployments.length === 0 ? (
                      <div className="text-center py-8">
                        <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          No deployments yet
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Deploy your first model to see it here
                        </p>
                        <Button
                          onClick={() => router.push("/deployments/create")}
                        >
                          Create Deployment
                        </Button>
                      </div>
                    ) : (
                      deployments.map((deployment) => (
                        <div
                          key={deployment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold">{deployment.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {deployment.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              deployment.status === "running"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {deployment.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates from your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No recent activity
                  </p>
                ) : (
                  stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant={getBadgeVariant(activity.badge)}>
                          {activity.badge}
                        </Badge>
                        <span className="text-sm">{activity.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {stats.totalModels > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/upload")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Another Model
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/deployments/create")}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Create Deployment
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/deployments")}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  View All Deployments
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
