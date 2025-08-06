# K App Deployment Guide

## Production Deployment Options

### Option 1: Frontend + Backend on Same Server (Recommended)

This setup serves both your React app and API backend from the same domain, avoiding CORS issues.

**Server Structure:**
```
your-domain.com/          → React app (static files)
your-domain.com/api/      → API backend (proxied to localhost:3000)
```

**Steps:**
1. Build the React app: `npm run build:prod`
2. Deploy built files to `/var/www/K/dist/`
3. Run your API backend on `localhost:3000`
4. Use the provided `nginx.conf` configuration
5. Users can use `/api` as the API URL in settings

### Option 2: Frontend Only (Users Configure Their Own Backend)

Deploy only the React app, users configure their own backend URLs.

**Steps:**
1. Build the React app: `npm run build:prod`
2. Deploy built files to `/var/www/K/dist/`
3. Remove/disable the `/api/` location block in nginx.conf
4. Users enter their backend URLs in Settings (e.g., `https://their-backend.com`)

### Option 3: Separate Domains

Deploy frontend and backend on different domains.

**Frontend:** `https://k-app.com`
**Backend:** `https://k-api.com`

**Additional nginx config for backend server:**
```nginx
# Add to your API server nginx config
add_header Access-Control-Allow-Origin https://k-app.com;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
```

## API Configuration for Users

### Default Settings:
- **Development:** `http://localhost:3000`
- **Production (same server):** `/api`
- **Production (custom):** Users configure in Settings

### Example API URLs Users Might Use:
- Local backend: `http://localhost:3000`
- Same domain: `/api`
- Remote backend: `https://api.example.com`
- Custom port: `https://example.com:8080`

## Backend Requirements

Your API backend should:
1. Handle CORS headers if on different domain
2. Support HTTPS in production
3. Be accessible from the configured URL
4. Implement all endpoints as per API_TECHNICAL_SPECIFICATIONS.md

## SSL Certificate Setup

### Using Let's Encrypt (Recommended):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Using Custom Certificate:
Update the nginx.conf SSL paths:
```nginx
ssl_certificate /path/to/your/certificate.crt;
ssl_certificate_key /path/to/your/private.key;
```

## Deployment Commands

```bash
# Build for production
npm run build:prod

# Deploy (run deploy.sh)
./deploy.sh

# Or manual deployment:
sudo cp -r dist/* /var/www/K/dist/
sudo systemctl reload nginx
```

## Monitoring & Logs

```bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check API backend logs
pm2 logs  # if using PM2
journalctl -f -u your-api-service  # if using systemd
```