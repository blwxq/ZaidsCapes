# 🚀 How to Start the Website Server

## ⚠️ Important: Install Dependencies First!

Before running the server, make sure all dependencies are installed:

1. **Run the installer:**
   - Double-click `INSTALL_DEPENDENCIES.bat`
   - OR run: `python -m pip install flask flask-cors`

2. **Start the server:**
   - Double-click `START_ALL.bat`

## 📋 Requirements

The website server needs these Python packages:
- `flask` - Web framework
- `flask-cors` - CORS support
- `aiohttp` - Async HTTP (usually already installed)
- `discord.py` - Discord API (usually already installed)
- `python-dotenv` - Environment variables (usually already installed)

## 🔧 Manual Installation

If you prefer to install manually:

```bash
python -m pip install flask flask-cors
```

## 🎯 Quick Start

1. Install dependencies (if not already installed)
2. Make sure your Discord bot is running (`python bot.py` from root folder)
3. Double-click `START_ALL.bat` to start the website
4. Open http://localhost:5000 in your browser

## ❌ Troubleshooting

**Error: "ModuleNotFoundError: No module named 'flask'"**
- Solution: Run `INSTALL_DEPENDENCIES.bat` or `python -m pip install flask flask-cors`

**Error: "Port 5000 already in use"**
- Solution: Close any other programs using port 5000, or change the port in `api.py`

**Stats/Tickets not showing:**
- Make sure the Discord bot is running first!
- The website needs the bot to provide real-time data
