# 🚀 Model Hub Deployment Checklist

This checklist will guide you through deploying both the frontend and backend of your Model Hub project.

## ✅ Prerequisites Completed

- [x] Frontend deployed to Vercel and working
- [x] Backend code complete with FastAPI, authentication, models API
- [x] Docker configurations ready (development & production)
- [x] Database migrations created
- [x] Deployment configurations for multiple platforms
- [x] Security configurations in place

## 🎯 Next Steps: Backend Deployment

### Option 1: Railway (Recommended for MVP)

1. **Generate Production Secret Key**

   ```bash
   python generate_secret.py
   ```

   Copy the generated key for later use.

2. **Deploy to Railway**

   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create New Project → Deploy from GitHub repo
   - Select your `Modelhub` repository
   - Railway auto-detects `backend/Dockerfile.prod`

3. **Add PostgreSQL Database**

   - In Railway dashboard: New → Database → PostgreSQL
   - Database URL automatically available as `${{Postgres.DATABASE_URL}}`

4. **Configure Environment Variables**

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SECRET_KEY=[paste generated key from step 1]
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:3000"]
   ENVIRONMENT=production
   PROJECT_NAME=Model Hub API
   API_V1_STR=/api/v1
   PORT=8000
   UPLOAD_DIR=/app/uploads
   MAX_UPLOAD_SIZE=100
   ```

5. **Deploy & Get URL**
   - Railway builds and deploys automatically
   - Note your Railway URL (e.g., `https://your-app.railway.app`)

### Option 2: Alternative Platforms

Refer to `backend/DEPLOYMENT.md` for detailed instructions on:

- Render
- Google Cloud Run
- AWS App Runner

## 🔗 Connect Frontend to Backend

1. **Update Frontend Environment Variable**

   - Go to Vercel project settings
   - Environment Variables → Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
     ```

2. **Update Backend CORS**

   - In Railway (or your platform), update:
     ```
     BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app"]
     ```

3. **Redeploy Frontend**
   - Vercel automatically redeploys on environment variable changes
   - Or trigger manual redeploy

## 🧪 Testing Deployment

1. **Test Backend Health**

   ```bash
   curl https://your-backend.railway.app/health
   ```

2. **Test API Documentation**
   Visit: `https://your-backend.railway.app/api/v1/docs`

3. **Test Frontend Connection**
   - Visit your Vercel frontend URL
   - Try registering a new account
   - Try uploading a model
   - Check browser network tab for API calls

## 📊 Post-Deployment Tasks

### Database Setup

```bash
# SSH into Railway container or use their terminal
alembic upgrade head

# Create admin user (optional)
python create_admin.py
```

### Monitoring

- Set up Railway/Render monitoring
- Check logs regularly
- Monitor resource usage

### Security Checklist

- [ ] SECRET_KEY changed from default
- [ ] Strong database password set
- [ ] CORS properly configured
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] Environment variables set correctly
- [ ] No secrets committed to git

## 🚀 Production Optimizations

### Performance

- [ ] Enable gzip compression
- [ ] Set up CDN for static files (if needed)
- [ ] Configure database connection pooling
- [ ] Monitor response times

### Scaling

- [ ] Set up horizontal scaling rules
- [ ] Configure load balancing (for high traffic)
- [ ] Set up database read replicas (for high traffic)

### Backup Strategy

- [ ] Database backups configured
- [ ] File uploads backup strategy
- [ ] Environment variables documented

## 💰 Cost Monitoring

### Railway Costs

- Free tier: $5/month credit
- Expected cost: $10-15/month
- Monitor usage in dashboard

### Optimization Tips

- Use SQLite for development
- Clean up old logs
- Monitor database size
- Optimize image uploads

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Check BACKEND_CORS_ORIGINS includes frontend URL
   - Ensure no trailing slashes

2. **Database Connection Failed**

   - Verify DATABASE_URL format
   - Check if database service is running

3. **File Upload Issues**

   - Check UPLOAD_DIR permissions
   - Verify MAX_UPLOAD_SIZE setting

4. **Authentication Issues**
   - Verify SECRET_KEY is set
   - Check token expiration settings

### Debug Commands

```bash
# Check API health
curl https://your-backend.railway.app/health

# Check API endpoints
curl https://your-backend.railway.app/api/v1/

# View logs (Railway dashboard or CLI)
railway logs
```

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🎉 Success Metrics

Your deployment is successful when:

- ✅ Backend health check returns `{"status": "healthy"}`
- ✅ API docs accessible at `/api/v1/docs`
- ✅ Frontend can register/login users
- ✅ Frontend can upload and view models
- ✅ No CORS errors in browser console
- ✅ Database connections working

**Estimated deployment time: 30-60 minutes**

Ready to deploy? Start with generating your secret key! 🔐
