"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Download, Star, GitFork, ArrowUpRight } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
  framework: "PyTorch" | "TensorFlow";
  category: string;
  version: string;
  downloads: number;
  stars: number;
  forks: number;
  tags: string[];
}

interface ModelGridProps {
  filter: string;
  category: "my-models" | "shared" | "favorites";
}

export function ModelGrid({ filter, category }: ModelGridProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchModels = async () => {
      setLoading(true);
      try {
        // Simulated API response
        const dummyModels: Model[] = [
          {
            id: "1",
            name: "BERT-Base",
            description:
              "Pre-trained BERT model for natural language processing",
            framework: "PyTorch",
            category: "NLP",
            version: "2.1.0",
            downloads: 1200,
            stars: 45,
            forks: 12,
            tags: ["NLP", "Production Ready"],
          },
          {
            id: "2",
            name: "ResNet-50",
            description: "Deep residual network for image classification",
            framework: "TensorFlow",
            category: "Computer Vision",
            version: "1.0.0",
            downloads: 800,
            stars: 32,
            forks: 8,
            tags: ["Computer Vision", "Production Ready"],
          },
          // Add more dummy models as needed
        ];

        setModels(dummyModels);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
      setLoading(false);
    };

    fetchModels();
  }, [category]);

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(filter.toLowerCase()) ||
      model.description.toLowerCase().includes(filter.toLowerCase()) ||
      model.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">Loading models...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {filteredModels.map((model) => (
        <Card key={model.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {model.name}
                  <Badge variant="outline">{model.version}</Badge>
                </CardTitle>
                <CardDescription>{model.description}</CardDescription>
              </div>
              <Badge variant="secondary">{model.framework}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {model.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {model.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {model.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    {model.forks}
                  </span>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
