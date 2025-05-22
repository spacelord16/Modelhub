"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ModelSearchBar } from "@/components/dashboard/ModelSearchBar";
import { ModelGrid } from "@/components/dashboard/ModelGrid";
import { ModelMetricsChart } from "@/components/dashboard/ModelMetricsChart";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-models");

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Model Hub Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your deep learning models
          </p>
        </div>
        <Button size="lg">Upload New Model</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Models</CardTitle>
            <CardDescription>Your uploaded models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Deployments</CardTitle>
            <CardDescription>Models in production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Downloads</CardTitle>
            <CardDescription>Community usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2k</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Model Management</CardTitle>
            <ModelSearchBar onSearch={setSearchQuery} />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="my-models">My Models</TabsTrigger>
              <TabsTrigger value="shared">Shared With Me</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            <TabsContent value="my-models">
              <ModelGrid filter={searchQuery} category="my-models" />
            </TabsContent>
            <TabsContent value="shared">
              <ModelGrid filter={searchQuery} category="shared" />
            </TabsContent>
            <TabsContent value="favorites">
              <ModelGrid filter={searchQuery} category="favorites" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Model accuracy over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ModelMetricsChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest model updates and deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Activity items will be populated here */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Badge>Update</Badge>
                  <span>BERT-base model updated to v2.1</span>
                </div>
                <span className="text-muted-foreground">2h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
