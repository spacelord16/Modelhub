#!/bin/bash

# Railway Deployment Script for Model Hub Backend
# This script helps deploy the backend from a monorepo structure

set -e

echo "🚂 Railway Deployment Script for Model Hub Backend"
echo "=================================================="

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    echo "📦 Install Railway CLI first:"
    echo "   npm install -g @railway/cli"
    echo "   or"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Dockerfile.prod" ]; then
    echo "❌ Not in backend directory. Changing to backend..."
    cd ../backend || {
        echo "❌ Backend directory not found. Make sure you're in the project root."
        exit 1
    }
fi

echo "📁 Current directory: $(pwd)"
echo "🔍 Checking required files..."

# Check required files
required_files=("Dockerfile.prod" "requirements.txt" "railway.json" "app/main.py")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "🔑 Step 1: Generate secret key"
echo "Run this command and copy the output:"
echo "python ../generate_secret.py"
echo ""
read -p "Press Enter when you have your secret key ready..."

echo ""
echo "🚂 Step 2: Login to Railway"
railway login

echo ""
echo "📦 Step 3: Link to project (if not already linked)"
echo "If this is your first time deploying, you'll need to link to your Railway project:"
railway link

echo ""
echo "🗄️  Step 4: Add PostgreSQL database"
echo "Make sure you have added a PostgreSQL database in your Railway dashboard:"
echo "Dashboard → New → Database → PostgreSQL"
echo ""
read -p "Press Enter when database is ready..."

echo ""
echo "⚙️  Step 5: Set environment variables"
echo "Setting up environment variables..."

# Set essential environment variables
railway variables set ENVIRONMENT=production
railway variables set PROJECT_NAME="Model Hub API"
railway variables set API_V1_STR="/api/v1"
railway variables set PORT=8000
railway variables set UPLOAD_DIR="/app/uploads"
railway variables set MAX_UPLOAD_SIZE=100
railway variables set ACCESS_TOKEN_EXPIRE_MINUTES=30

echo "✅ Basic environment variables set"
echo ""
echo "🔐 Now set your secret key and CORS origins:"
echo "railway variables set SECRET_KEY='your-generated-secret-key-here'"
echo "railway variables set BACKEND_CORS_ORIGINS='[\"https://your-frontend.vercel.app\",\"http://localhost:3000\"]'"
echo ""
echo "📄 The DATABASE_URL will be automatically set when you add PostgreSQL"
echo ""
read -p "Press Enter when you've set SECRET_KEY and BACKEND_CORS_ORIGINS..."

echo ""
echo "🚀 Step 6: Deploy!"
echo "Deploying backend to Railway..."

# Deploy with explicit docker configuration
railway up --detach

echo ""
echo "🎉 Deployment initiated!"
echo "📊 Check your deployment status:"
echo "   railway status"
echo "📝 View logs:"
echo "   railway logs"
echo "🌐 Get your deployment URL:"
echo "   railway domain"
echo ""
echo "✅ Next steps:"
echo "1. Wait for deployment to complete"
echo "2. Get your Railway URL with: railway domain"
echo "3. Update your Vercel frontend with the backend URL"
echo "4. Test your API at: https://your-url.railway.app/health"
echo ""
echo "Happy deploying! 🚀" 