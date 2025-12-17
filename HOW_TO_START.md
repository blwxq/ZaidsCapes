# 🚀 How to Start the Website Server

## Option 1: Simple Server (Recommended - Works Immediately)

**Double-click:** `START_SERVER.bat`

Or run in terminal:
```bash
cd website
python start_server.py
```

This will:
- ✅ Start the server accessible to anyone on your network
- ✅ Show you the local and network URLs
- ✅ Make the website available at `http://your-ip:8000`

## Option 2: Using Python's Built-in Server

```bash
cd website
python -m http.server 8000 --bind 0.0.0.0
```

This makes it accessible at:
- Local: `http://localhost:8000`
- Network: `http://your-ip:8000`

## Option 3: With Flask API (For Full Features)

First install Flask:
```bash
pip install flask flask-cors
```

Then start:
```bash
cd website
python api.py
```

## 📱 Accessing from Other Devices

1. Make sure your device is on the **same network** (WiFi/LAN)
2. Find your computer's IP address:
   - Windows: Run `ipconfig` and look for "IPv4 Address"
   - The server script will show your IP automatically
3. On other devices, open: `http://YOUR_IP:8000`

## 🔧 Troubleshooting

**Port already in use?**
- Stop any other servers running on port 8000
- Or change PORT in `start_server.py` to another number (like 8080)

**Can't access from other devices?**
- Check Windows Firewall allows port 8000
- Make sure devices are on same network
- Try using `0.0.0.0` as the bind address

## 🎯 Quick Start

**Just double-click `START_SERVER.bat` and you're done!**

The server will show you all the URLs you can use.

