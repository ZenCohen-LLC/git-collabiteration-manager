# Secure Setup Guide

This guide walks you through setting up the required third-party services and configuring them securely for the Collabiteration SaaS platform.

## Table of Contents
1. [Overview](#overview)
2. [Required Services](#required-services)
3. [Service Setup Instructions](#service-setup-instructions)
4. [Environment Configuration](#environment-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

## Overview

The Collabiteration SaaS platform requires several third-party services for:
- **Hosting & Deployment**: Vercel
- **Database & Real-time**: Supabase
- **CDN & Caching**: Cloudflare
- **Error Tracking**: Sentry

All sensitive credentials are managed through environment variables and should NEVER be committed to the repository.

## Required Services

### 1. Vercel (Hosting)
- **Purpose**: Host API, serve widget, manage deployments
- **Cost**: Free tier sufficient for development
- **Required**: Yes

### 2. Supabase (Database)
- **Purpose**: PostgreSQL database, real-time subscriptions, authentication
- **Cost**: Free tier includes 500MB database
- **Required**: Yes

### 3. Cloudflare (CDN)
- **Purpose**: Cache widget assets, improve global performance
- **Cost**: Free tier sufficient
- **Required**: Optional (can use Vercel's CDN initially)

### 4. Sentry (Monitoring)
- **Purpose**: Error tracking, performance monitoring
- **Cost**: Free tier includes 5K errors/month
- **Required**: Recommended

## Service Setup Instructions

### Vercel Setup

1. **Create Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Get API Token**
   - Go to Account Settings → Tokens
   - Create new token with name "collabiteration-deploy"
   - Copy token immediately (shown only once)

3. **Link Repository**
   - Import git-collabiteration-manager repository
   - Configure build settings later

### Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: "collabiteration-prod"
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users

2. **Collect Credentials**
   - Go to Settings → API
   - Copy:
     - Project URL (safe to expose)
     - `anon` public key (safe to expose)
     - `service_role` secret key (KEEP SECRET!)

3. **Database Access**
   - Go to Settings → Database
   - Copy connection string
   - Note the connection pooler details

### Cloudflare Setup

1. **Create Account**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Sign up for free account

2. **Add Domain** (if you have one)
   - Add your domain
   - Update nameservers as instructed

3. **Create API Token**
   - Go to My Profile → API Tokens
   - Create Custom Token
   - Permissions: Zone → Cache Purge → Edit
   - Copy token

### Sentry Setup

1. **Create Account**
   - Go to [sentry.io](https://sentry.io)
   - Sign up for free account

2. **Create Projects**
   
   **Widget Project:**
   - Click "Create Project"
   - Platform: JavaScript (Browser)
   - Project Name: "collabiteration-widget"
   - Copy DSN

   **API Project:**
   - Click "Create Project"
   - Platform: Node.js
   - Project Name: "collabiteration-api"
   - Copy DSN

3. **Create Auth Token**
   - Go to Settings → Account → API → Auth Tokens
   - Create New Token
   - Name: "collabiteration-deployment"
   - Scopes:
     - `project:releases`
     - `org:read`
     - `project:write`
   - Copy token

## Environment Configuration

### Local Development Setup

1. **Create `.env.local` file** in project root:
```bash
# Copy from .env.example
cp .env.example .env.local
```

2. **Fill in your credentials**:
```bash
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare (optional initially)
CLOUDFLARE_API_TOKEN=your-token-here
CLOUDFLARE_ZONE_ID=your-zone-id

# Sentry
SENTRY_DSN_WIDGET=https://abc123@o123456.ingest.sentry.io/1234567
SENTRY_DSN_API=https://def456@o123456.ingest.sentry.io/7654321
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE2OTY...

# Vercel
VERCEL_TOKEN=your-vercel-token
```

3. **Verify setup**:
```bash
npm run verify-setup
```

### Production Configuration

1. **In Vercel Dashboard**:
   - Go to Project → Settings → Environment Variables
   - Add each variable from `.env.local`
   - Select "Production" environment

2. **Secure Values**:
   - Use different API keys for production
   - Enable "Encrypted" for sensitive values
   - Set up environment-specific variables

## Security Best Practices

### API Key Management
1. **Never commit keys** - Use `.env.local` (gitignored)
2. **Rotate regularly** - Quarterly for production
3. **Use least privilege** - Minimal required permissions
4. **Monitor usage** - Set up alerts for unusual activity

### Access Control
1. **Enable 2FA** on all service accounts
2. **Use team accounts** where possible
3. **Audit access logs** monthly
4. **Remove unused tokens** immediately

### Data Protection
1. **Encrypt sensitive data** in database
2. **Use HTTPS everywhere** (enforced by Vercel)
3. **Implement rate limiting** on APIs
4. **Log security events** to Sentry

### Development Practices
1. **Separate environments** - Dev/Staging/Prod
2. **Use different keys** per environment
3. **Automate security scans** in CI/CD
4. **Review dependencies** for vulnerabilities

## Troubleshooting

### Common Issues

#### "Missing environment variables"
- Ensure `.env.local` exists
- Check variable names match exactly
- Run `npm run verify-setup`

#### "Invalid API key"
- Verify key is copied correctly (no spaces)
- Check key hasn't expired
- Ensure using correct environment

#### "Connection refused"
- Check service is active
- Verify URL is correct
- Check network/firewall settings

#### "Rate limit exceeded"
- Implement caching
- Check for loops in code
- Upgrade service tier if needed

### Debug Commands

```bash
# Test Supabase connection
npm run test:supabase

# Test Sentry integration
npm run test:sentry

# Check all services
npm run test:services
```

### Getting Help

1. **Check service status pages**:
   - [status.vercel.com](https://status.vercel.com)
   - [status.supabase.com](https://status.supabase.com)
   - [cloudflarestatus.com](https://www.cloudflarestatus.com)
   - [status.sentry.io](https://status.sentry.io)

2. **Review documentation**:
   - Service-specific docs
   - This setup guide
   - GitHub issues

3. **Contact support**:
   - Use service support channels
   - Post in GitHub discussions
   - Check Stack Overflow

---

Remember: Security is not optional. Take time to properly configure each service and follow best practices.