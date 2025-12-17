# 🚀 Website Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` (if exists)
   - Or set these in parent directory `.env`:
     - `DISCORD_TOKEN` - Your Discord bot token
     - `ROBLOX_API_KEY` - Roblox Open Cloud API key
     - `CREATOR_ID` - Your Roblox creator ID

3. **Start the server:**
   ```bash
   python api.py
   ```
   
   Or on Windows: Double-click `START_ALL.bat`

4. **Access the website:**
   - Main: http://localhost:5000
   - Dashboard: http://localhost:5000/dashboard.html
   - Cape Builder: http://localhost:5000/cape-builder.html

## Default Login

- Username: `admin`
- Password: `123`

**⚠️ Change these in production!**

## Requirements

- Python 3.8+
- Flask & Flask-CORS
- Discord bot running (for stats)
- Roblox API credentials (for cape uploads)

See `requirements.txt` for full list.

