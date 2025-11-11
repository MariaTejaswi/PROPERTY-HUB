# Deployment Guide

This guide covers deploying the PropertyHub application to Vercel.

## Prerequisites

- Vercel account (free tier is sufficient)
- MongoDB Atlas account with a database
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare for Deployment

### Backend Preparation

1. **Ensure vercel.json exists** in the `server` directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

2. **Update package.json** in `server` directory to include start script:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Frontend Preparation

1. **Create vercel.json** in the `client` directory:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

2. **Update package.json** in `client` directory:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## Step 2: Deploy Backend

### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Navigate to server directory**:
```bash
cd server
```

3. **Login to Vercel**:
```bash
vercel login
```

4. **Deploy**:
```bash
vercel --prod
```

5. **Configure environment variables** when prompted or via dashboard:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A strong random string (generate with `openssl rand -base64 32`)
   - `NODE_ENV` - Set to `production`
   - `PORT` - Set to `5000` (Vercel will override this)

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Set **Root Directory** to `server`
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
6. Click "Deploy"

### After Backend Deployment

Your backend will be available at: `https://your-project-name.vercel.app`

## Step 3: Deploy Frontend

1. **Update frontend API URL**:

Edit `client/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

Or update during deployment in Vercel dashboard.

2. **Deploy via Vercel Dashboard**:
   - Click "Add New Project" again
   - Import the same repository
   - Set **Root Directory** to `client`
   - Add environment variable:
     - `REACT_APP_API_URL=https://your-backend-url.vercel.app`
   - Click "Deploy"

Your frontend will be available at: `https://your-frontend-name.vercel.app`

## Step 4: Configure CORS

Update `server/server.js` to allow your frontend domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-name.vercel.app'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

Redeploy the backend after this change.

## Step 5: Database Configuration

### MongoDB Atlas Setup

1. **Whitelist IP Addresses**:
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for Vercel's dynamic IPs

2. **Connection String**:
   - Ensure your connection string is in the format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

3. **Test Connection**:
   - Check Vercel deployment logs
   - Look for "MongoDB Connected" message

## Step 6: Verify Deployment

1. **Test Backend**:
```bash
curl https://your-backend-url.vercel.app/api/health
```

2. **Test Frontend**:
   - Open `https://your-frontend-name.vercel.app`
   - Try logging in with test account:
     - Email: `landlord@test.com`
     - Password: `Test123!`

3. **Check Logs**:
   - Go to Vercel dashboard
   - Select your project
   - Click "Logs" to view runtime logs

## Step 7: Seed Production Database (Optional)

If you want to populate your production database with test data:

1. **Update seed script** to use production MongoDB URI temporarily
2. **Run locally**:
```bash
cd server
node seeds/seedDatabase.js
```
3. **Revert to development URI** in your local .env

⚠️ **Warning**: Only seed a fresh database. This will overwrite existing data.

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
- **Solution**: Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Verify `MONGODB_URI` environment variable is correct
- Check MongoDB Atlas cluster status

### Issue: "CORS error"
- **Solution**: Add your frontend URL to CORS configuration in `server/server.js`
- Ensure `credentials: true` is set in CORS options

### Issue: "JWT token invalid"
- **Solution**: Ensure `JWT_SECRET` is the same across all backend instances
- Clear browser cookies and login again

### Issue: File uploads not working
- **Solution**: Vercel's serverless functions have a 50MB limit
- Consider using cloud storage (AWS S3, Cloudinary) for production
- Update file upload logic to use cloud provider

### Issue: Functions timing out
- **Solution**: Vercel free tier has 10-second timeout
- Optimize database queries
- Use indexes in MongoDB
- Consider upgrading to Pro plan for 60-second timeout

## Environment Variables Summary

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/propertyhub
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=production
PORT=5000
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

## Security Checklist

- ✅ Strong JWT_SECRET (32+ characters, random)
- ✅ MongoDB Atlas IP whitelist configured
- ✅ CORS restricted to your frontend domain
- ✅ NODE_ENV set to production
- ✅ Sensitive data in environment variables (not in code)
- ✅ MongoDB connection string uses authentication
- ✅ HTTPS enabled (automatic with Vercel)

## Performance Optimization

1. **Enable Compression**:
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Add Database Indexes**:
```javascript
// In model files
propertySchema.index({ landlord: 1, status: 1 });
paymentSchema.index({ tenant: 1, status: 1 });
```

3. **Cache Static Assets**:
   - Vercel automatically caches static files
   - No additional configuration needed

4. **Optimize Images**:
   - Use WebP format for property images
   - Implement lazy loading
   - Consider using an image CDN (Cloudinary, imgix)

## Monitoring

1. **Vercel Analytics**:
   - Enable in Vercel dashboard
   - Track page views and performance

2. **Error Tracking**:
   - Consider integrating Sentry for error monitoring
   - Add to both frontend and backend

3. **Uptime Monitoring**:
   - Use UptimeRobot or similar service
   - Monitor both frontend and backend endpoints

## Custom Domain (Optional)

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   - Update CORS configuration with new domain
   - Update `REACT_APP_API_URL` if backend has custom domain

## Backup Strategy

1. **MongoDB Atlas Backups**:
   - Automatic with M10+ clusters
   - Manual exports for M0 (free tier)

2. **Database Export**:
```bash
mongodump --uri="mongodb+srv://..." --out=backup
```

3. **Restore**:
```bash
mongorestore --uri="mongodb+srv://..." backup/
```

## Cost Estimate (Vercel Free Tier)

- **Frontend Hosting**: Free (100GB bandwidth)
- **Backend Hosting**: Free (100GB bandwidth, 100 hours compute)
- **MongoDB Atlas**: Free (M0, 512MB storage)
- **Total**: $0/month for small-scale usage

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database seeded with initial data (if needed)
- [ ] Test user accounts created
- [ ] CORS configured for production domain
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Strong JWT_SECRET generated
- [ ] Deployment tested on mobile and desktop
- [ ] All API endpoints tested
- [ ] File upload limits appropriate
- [ ] Error handling tested
- [ ] 404 page works
- [ ] Authentication flow works
- [ ] Password reset works (if implemented)
- [ ] Email notifications work (if implemented)

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- MongoDB Atlas support: https://docs.atlas.mongodb.com/
- Raise an issue in the repository

---

**Last Updated**: November 7, 2025
