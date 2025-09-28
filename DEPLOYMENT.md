# Deployment Guide - Vercel

This guide explains how to deploy the Kontracts application to Vercel with both frontend and backend components.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Neon PostgreSQL database (or any PostgreSQL provider)
4. **OpenAI API Key**: For AI-powered features

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration

### 2. Configure Environment Variables

In your Vercel project dashboard, go to **Settings → Environment Variables** and add:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters

# OpenAI Integration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Environment
NODE_ENV=production
```

**Important Notes:**
- `SESSION_SECRET` should be a strong, random string (minimum 32 characters)
- Use your actual Neon database connection string for `DATABASE_URL`
- Add your OpenAI API key for document processing features

### 3. Deploy

1. Vercel will automatically deploy on every push to main branch
2. The build process will:
   - Install dependencies
   - Build the React frontend using Vite
   - Set up the serverless API functions
3. Your app will be available at `https://your-project-name.vercel.app`

## File Structure for Vercel

```
├── api/                    # Serverless functions
│   └── index.ts           # Main API handler
├── client/                # React frontend
│   ├── dist/             # Built frontend (auto-generated)
│   └── src/              # Source code
├── server/               # Backend logic
├── shared/               # Shared types and schemas
├── vercel.json          # Vercel configuration
└── .vercelignore        # Files to ignore during deployment
```

## API Routes

After deployment, your API will be available at:
- `https://your-app.vercel.app/api/dashboard/stats`
- `https://your-app.vercel.app/api/contracts`
- `https://your-app.vercel.app/api/documents/upload`
- `https://your-app.vercel.app/api/compliance/*`
- And all other endpoints defined in your routes

## Frontend Routes

The React SPA will handle client-side routing:
- `https://your-app.vercel.app/` - Dashboard
- `https://your-app.vercel.app/contracts` - Contract management
- `https://your-app.vercel.app/documents` - Document upload
- `https://your-app.vercel.app/compliance` - Compliance schedules

## Configuration Files

### `vercel.json`
- Configures the build process
- Sets up routing between frontend and API
- Defines serverless function settings

### `api/index.ts`
- Entry point for all API requests
- Handles CORS configuration
- Imports and registers all routes

### `.vercelignore`
- Excludes unnecessary files from deployment
- Reduces deployment size and time

## Database Setup

1. **Neon Database** (Recommended):
   ```bash
   # Install Neon CLI (optional)
   npm install -g @neondatabase/cli

   # Or use Neon dashboard to create database
   ```

2. **Run Migrations**:
   ```bash
   # Push schema to database
   npm run db:push
   ```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Session encryption key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ✅ |
| `NODE_ENV` | Environment (auto-set to 'production') | ✅ |

## Features Available After Deployment

✅ **Contract Management**
- Create, read, update, delete contracts
- Search and filter contracts
- Contract validation

✅ **Document Processing**
- Upload PDF, Word, Excel files
- AI-powered data extraction
- Document storage and retrieval

✅ **Compliance Calculations**
- ASC842 lease accounting schedules
- IFRS16 compliance calculations
- Present value calculations

✅ **AI Recommendations**
- Contract optimization suggestions
- Compliance alerts
- Risk management insights

✅ **Journal Entry Automation**
- Automated accounting entries
- Customizable entry templates
- Audit trail

## Troubleshooting

### Build Errors
```bash
# Test build locally
npm run vercel-build

# Check for TypeScript errors
npm run check
```

### API Issues
- Check environment variables are set correctly
- Verify database connection string
- Check Vercel function logs in dashboard

### Frontend Issues
- Ensure all routes are working in SPA mode
- Check browser console for errors
- Verify API base URL is correct

### Database Issues
```bash
# Test database connection
npm run db:push

# Check database logs in Neon dashboard
```

## Performance Optimization

1. **Serverless Function Limits**:
   - Max execution time: 30 seconds (can be increased)
   - Memory limit: 1024MB default
   - Cold start optimization

2. **Frontend Optimization**:
   - Code splitting enabled via Vite
   - Static asset optimization
   - Gzip compression

3. **Database Optimization**:
   - Connection pooling via Neon
   - Query optimization
   - Index usage

## Security Considerations

✅ **Environment Variables**: Stored securely in Vercel
✅ **CORS Configuration**: Restricted to your domain
✅ **Session Security**: Encrypted sessions
✅ **Input Validation**: Zod schema validation
✅ **File Upload Security**: Type and size validation

## Monitoring and Logs

- **Vercel Dashboard**: View deployment logs and function invocations
- **Real-time Logs**: Monitor API requests and errors
- **Analytics**: Track usage and performance metrics

## Custom Domain (Optional)

1. Go to Vercel project settings
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

Your Kontracts application is now ready for production use on Vercel! 🚀