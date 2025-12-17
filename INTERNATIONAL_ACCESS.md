# 🌍 Making Website Accessible Internationally

## Option 1: Using ngrok (Easiest - Free)

### Step 1: Install ngrok
Download from: https://ngrok.com/download

### Step 2: Start Your Server
```bash
cd website
python start_server.py
```

### Step 3: Create ngrok Tunnel
```bash
ngrok http 8000
```

This will give you a public URL like:
```
https://abc123.ngrok-free.app
```

**Anyone in the world can access your website using this URL!**

### Step 4: Update Discord OAuth Redirect URI
In your Discord Developer Portal:
1. Go to your application
2. OAuth2 → Redirects
3. Add: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`
4. Save

### Step 5: Update Flask API Redirect URI
In `website/api.py`, update:
```python
DISCORD_REDIRECT_URI = 'https://your-ngrok-url.ngrok-free.app/api/auth/callback'
```

**Note:** Free ngrok URLs change every time you restart. For permanent URL:
- Sign up for ngrok account (free)
- Get authtoken
- Run: `ngrok authtoken YOUR_TOKEN`
- Use: `ngrok http 8000 --domain=your-domain.ngrok.app`

---

## Option 2: Using Cloudflare Tunnel (Free, Permanent)

### Step 1: Install cloudflared
```bash
# Windows
winget install --id Cloudflare.cloudflared
```

### Step 2: Start Server
```bash
cd website
python start_server.py
```

### Step 3: Create Tunnel
```bash
cloudflared tunnel --url http://localhost:8000
```

This gives you a permanent public URL!

---

## Option 3: Deploy to VPS/Cloud (Best for Production)

### Popular Options:
1. **Heroku** - Easy deployment
2. **Railway** - Free tier available
3. **Render** - Free tier available
4. **DigitalOcean** - $5/month
5. **AWS/GCP/Azure** - More complex but powerful

### Quick Deploy Example (Railway):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

---

## Option 4: Use Your Own Domain (Professional)

### Step 1: Get a Domain
- Namecheap, Google Domains, etc.

### Step 2: Point DNS to Your Server
- A record pointing to your server IP
- Or use Cloudflare (free) for DNS + CDN

### Step 3: Setup Reverse Proxy (nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 4: Get SSL Certificate (Let's Encrypt - Free)
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🔥 Recommended: ngrok for Testing

**Quick Start:**
```bash
# Terminal 1 - Start server
cd website
python start_server.py

# Terminal 2 - Start ngrok
ngrok http 8000
```

**Copy the https:// URL and share it!** 🌍

---

## 🔒 Important Notes

1. **Security:** When exposing publicly, make sure:
   - API endpoints are protected
   - Discord OAuth is properly configured
   - Rate limiting is enabled

2. **Firewall:** Make sure port 8000 is open (or use ngrok/Cloudflare Tunnel which bypasses this)

3. **OAuth Redirect URI:** Must match exactly in Discord Developer Portal

4. **HTTPS:** Required for Discord OAuth. ngrok/Cloudflare provide HTTPS automatically.

---

## ✅ Quick Checklist

- [ ] Server running on port 8000
- [ ] ngrok/Cloudflare Tunnel started
- [ ] Discord OAuth redirect URI updated
- [ ] Flask API redirect URI updated
- [ ] Test login from different location

**You're ready to share your website worldwide!** 🚀

