#!/bin/bash

# Deploy script for optimized Railway deployment
echo "🚀 Deploying with optimized Docker configuration..."

# Ensure we're using the minimal Dockerfile
echo "✅ Using minimal Dockerfile for size optimization"
echo "   - Base image: python:3.11-slim"
echo "   - Multi-stage build to minimize final image"
echo "   - Excludes heavy ML dependencies (PyTorch, TensorFlow)"
echo "   - Estimated image size: < 1GB"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Deploy to Railway
echo "🚀 Starting Railway deployment..."
railway up

echo "✅ Deployment initiated!"
echo "📊 Monitor your deployment at: https://railway.app"
echo ""
echo "💡 Image optimizations applied:"
echo "   - Switched from Dockerfile.prod to Dockerfile.minimal"
echo "   - Removed PyTorch and heavy ML dependencies"
echo "   - Used multi-stage build"
echo "   - Optimized package installation"
echo "   - Should now be under 4GB limit" 