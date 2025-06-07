'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, ShieldCheck, BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { ModelApproval } from '@/components/admin/ModelApproval';
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';
import { EmergencyControls } from '@/components/admin/EmergencyControls';
import { apiClient } from '@/lib/api';

interface PlatformStats {
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
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/analytics/dashboard');
      setStats(response.data.platform_stats);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setError('Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, models, and monitor platform health</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Emergency
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <>
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_users}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.active_users_today} active today
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_models}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.models_uploaded_today} uploaded today
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{stats.pending_approvals}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.approved_models_today} approved today
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Emergency Disabled</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats.emergency_disabled_count}</div>
                      <p className="text-xs text-muted-foreground">
                        Models disabled for safety
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Platform Analytics */}
                <PlatformAnalytics />
              </>
            )}
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="models">
            <ModelApproval />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyControls />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}