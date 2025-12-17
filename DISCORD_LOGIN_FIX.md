# 🔧 Discord Login Fix - Step by Step

## ✅ **FIXED!** Here's what changed:

### **Problem:** 
404 error when clicking Discord login button

### **Solution:**
The Flask API server now serves **both** static files AND API routes on the same port!

---

## 🚀 **How to Use:**

### **Option 1: Easy Way (Recommended)**

Just run:
```bash
cd website
python api.py
```

Or double-click: **`START_ALL.bat`**

This serves:
- ✅ Static files (HTML, CSS, JS)
- ✅ API routes (`/api/*`)
- ✅ Everything on port **5000**

**Open:** `http://localhost:5000`

---

## 🔑 **Setup Discord OAuth:**

### **Step 1: Get Discord App Credentials**

1. Go to: https://discord.com/developers/applications
2. Click **"New Application"** or select existing
3. Go to **"OAuth2"** tab
4. Copy your **Client ID** and **Client Secret**

### **Step 2: Add Redirect URI**

1. In Discord Developer Portal → OAuth2
2. Scroll to **"Redirects"**
3. Click **"Add Redirect"**
4. Add: `http://localhost:5000/api/auth/callback`
5. Click **"Save Changes"**

### **Step 3: Add to `.env` file**

Edit `.env` in the **root directory** (not website folder):
```env
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:5000/api/auth/callback
FLASK_SECRET_KEY=some_random_secret_key_12345
```

**Important:** 
- Replace `your_client_id_here` with your actual Client ID
- Replace `your_client_secret_here` with your actual Client Secret
- The `FLASK_SECRET_KEY` can be any random string

---

## ✅ **Test It:**

1. Start server: `python api.py`
2. Open: `http://localhost:5000/dashboard.html`
3. Click **"Login with Discord"**
4. Should redirect to Discord
5. Authorize the app
6. Should redirect back to dashboard (logged in!)

---

## 🌍 **For International Access:**

When using ngrok or deploying:

1. Update `.env`:
   ```env
   DISCORD_REDIRECT_URI=https://your-ngrok-url.ngrok-free.app/api/auth/callback
   ```

2. Update Discord Redirect URI to match

3. Restart server

---

## 🔍 **Troubleshooting:**

**Error: "Discord OAuth not configured"**
→ Check `.env` file has `DISCORD_CLIENT_ID` set

**Error: "Invalid redirect_uri"**
→ Make sure redirect URI in Discord matches exactly (including http/https)

**Still 404?**
→ Make sure you're using `python api.py` (not `start_server.py`)
→ Check that port 5000 is not already in use

**Everything works now!** 🎉

