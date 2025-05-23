# Backend Deployment Guide

This guide covers deploying the Model Hub FastAPI backend to various cloud platforms.

## 🚂 Railway Deployment (Recommended)

Railway is the easiest and most cost-effective option for getting started.

### Prerequisites

- GitHub account
- Your code pushed to GitHub repository

### Step-by-Step Deployment

1. **Create Railway Account**

   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub account
   - Authorize Railway to access your repositories

2. **Create New Project**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Modelhub` repository
   - Railway will auto-detect the Dockerfile

3. **Configure Build Settings**

   - Railway should automatically detect `backend/Dockerfile.prod`
   - If not, set:
     - Build Command: `docker build -f backend/Dockerfile.prod -t app backend/`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add PostgreSQL Database**

   - In project dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway will create a managed PostgreSQL instance
   - Database URL will be automatically available as `${{Postgres.DATABASE_URL}}`

5. **Set Environment Variables**

   ```bash
   # Database (Auto-provided by Railway)
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # JWT (CHANGE THESE!)
   SECRET_KEY=your-super-secret-key-change-this-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # CORS (Update with your Vercel frontend URL)
   BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:3000"]

   # App Config
   ENVIRONMENT=production
   PROJECT_NAME=Model Hub API
   API_V1_STR=/api/v1
   PORT=8000
   UPLOAD_DIR=/app/uploads
   MAX_UPLOAD_SIZE=100
   ```

6. **Deploy**

   - Railway will automatically build and deploy
   - You'll get a public URL like `https://your-app.railway.app`

7. **Update Frontend CORS**
   - Update your frontend's API base URL to point to Railway URL
   - Update Railway's CORS settings to allow your Vercel frontend domain

### Railway Costs

- **Free Tier**: $5 worth of usage per month
- **Pro Plan**: $20/month for higher limits
- **Resource usage**: ~$3-8/month for a small API + database

---

## 🎨 Render Deployment

Alternative option with similar ease of use.

### Steps

1. **Create Render Account**

   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**

   - New → Web Service
   - Connect GitHub repository
   - Configure:
     - Name: `modelhub-backend`
     - Environment: `Docker`
     - Dockerfile Path: `backend/Dockerfile.prod`
     - Build Command: (leave empty for Docker)
     - Start Command: (leave empty for Docker)

3. **Add PostgreSQL Database**

   - New → PostgreSQL
   - Create database
   - Note the connection details

4. **Set Environment Variables**
   - Same as Railway, but manually enter DATABASE_URL

### Render Costs

- **Free Tier**: Limited (services sleep after 15 min inactivity)
- **Paid**: $7/month for web service + $7/month for database

---

## ☁️ Google Cloud Run

For more advanced deployments with better scaling.

### Prerequisites

- Google Cloud account
- `gcloud` CLI installed

### Steps

1. **Setup Project**

   ```bash
   gcloud config set project YOUR_PROJECT_ID
   gcloud auth configure-docker
   ```

2. **Build and Push Image**

   ```bash
   cd backend
   docker build -f Dockerfile.prod -t gcr.io/YOUR_PROJECT_ID/modelhub-backend .
   docker push gcr.io/YOUR_PROJECT_ID/modelhub-backend
   ```

3. **Deploy to Cloud Run**

   ```bash
   gcloud run deploy modelhub-backend \
     --image gcr.io/YOUR_PROJECT_ID/modelhub-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8000
   ```

4. **Setup Cloud SQL PostgreSQL**
   ```bash
   gcloud sql instances create modelhub-db \
     --database-version=POSTGRES_13 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

### GCP Costs

- **Cloud Run**: Pay per request (~$0.40 per 1M requests)
- **Cloud SQL**: ~$7-15/month for small instance

---

## 🚀 AWS App Runner

AWS managed container service.

### Steps

1. **Create App Runner Service**

   - Go to AWS App Runner console
   - Create service
   - Source: Container registry
   - Connect to GitHub repository

2. **Configure Build**

   - Dockerfile: `backend/Dockerfile.prod`
   - Build command: Default
   - Start command: Default

3. **Setup RDS PostgreSQL**

   - Create RDS PostgreSQL instance
   - Configure security groups
   - Note connection details

4. **Environment Variables**
   - Same as other platforms
   - Use RDS connection string for DATABASE_URL

### AWS Costs

- **App Runner**: ~$25-50/month
- **RDS**: ~$15-30/month for small instance

---

## 🔄 Connecting Frontend to Backend

After deploying the backend, update your frontend:

1. **Update Frontend API URL**

   ```typescript
   // In frontend/src/lib/api.ts
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL ||
     "https://your-backend.railway.app/api/v1";
   ```

2. **Add Environment Variable to Vercel**

   - Go to Vercel project settings
   - Environment Variables
   - Add: `NEXT_PUBLIC_API_URL = https://your-backend.railway.app/api/v1`

3. **Update CORS in Backend**
   - Add your Vercel frontend URL to BACKEND_CORS_ORIGINS
   - Redeploy backend

---

## 📊 Monitoring and Maintenance

### Health Checks

All deployments include health checks at `/health` endpoint.

### Logs

- **Railway**: View in dashboard
- **Render**: View in dashboard
- **GCP**: `gcloud logs read`
- **AWS**: CloudWatch logs

### Database Migrations

```bash
# Run migrations (adjust for your platform)
# Railway: Use their terminal feature
# Others: Connect via CLI

alembic upgrade head
```

### Backups

- **Railway**: Automatic PostgreSQL backups
- **Render**: Automatic PostgreSQL backups
- **GCP/AWS**: Configure automated backups

---

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **CORS Errors**

   - Verify BACKEND_CORS_ORIGINS includes frontend URL
   - Check for trailing slashes
   - Ensure HTTPS/HTTP match

3. **File Upload Issues**

   - Check UPLOAD_DIR permissions
   - Verify MAX_UPLOAD_SIZE setting
   - Consider using cloud storage (S3) for production

4. **Memory/CPU Issues**
   - Monitor resource usage
   - Scale up if needed
   - Optimize database queries

### Debug Commands

```bash
# Check logs
curl https://your-backend.railway.app/health

# Test API
curl https://your-backend.railway.app/api/v1/

# Test database connection
# (Use platform-specific database client)
```

---

## 🔐 Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set up proper environment variables
- [ ] Review database security groups
- [ ] Enable logging and monitoring
- [ ] Regular security updates
- [ ] Backup strategy in place

---

## 💰 Cost Comparison

| Platform       | Free Tier       | Paid (Small)  | Best For            |
| -------------- | --------------- | ------------- | ------------------- |
| Railway        | $5/month credit | ~$10-15/month | MVP, Development    |
| Render         | Limited free    | ~$14/month    | Small production    |
| GCP Cloud Run  | Generous free   | ~$15-25/month | Scalable production |
| AWS App Runner | No free tier    | ~$40-80/month | Enterprise          |

**Recommendation**: Start with Railway for MVP, migrate to GCP/AWS as you scale.
