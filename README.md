# 🌟 Zaid's Capes - Website Dashboard

A futuristic, RGB-themed website dashboard for managing cape requests, tickets, and bot statistics.

## ✨ Features

- **🎨 Futuristic RGB Design** - Animated gradients, neon glows, dark theme
- **🔐 Simple Authentication** - Username/password login system
- **🎫 Ticket Management** - View and manage pending/completed tickets
- **📊 Real-time Stats** - Live bot statistics (members, tickets, revenue)
- **🎨 Cape Builder** - Integrated Pixlr editor for cape creation
- **📈 Cape History** - View all generated capes
- **📱 Fully Responsive** - Works on all devices

## 📁 File Structure

```
website/
├── api.py                  # Flask backend API server
├── index.html             # Landing page
├── dashboard.html         # Dashboard with tickets & stats
├── cape-builder.html      # Cape builder with Pixlr integration
├── styles.css             # Main styles (RGB theme)
├── dashboard.css          # Dashboard-specific styles
├── cape-builder.css       # Cape builder styles
├── script.js              # Main page scripts
├── dashboard.js           # Dashboard functionality
├── dashboard_cape_history.js  # Cape history display
├── pixlr-integration.js   # Pixlr editor integration
├── auth.js                # Authentication system
├── requirements.txt       # Python dependencies
├── START_ALL.bat         # Windows start script
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Discord bot running (for real-time stats)
- `.env` file with `DISCORD_TOKEN` set

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   python api.py
   ```
   Or on Windows: Double-click `START_ALL.bat`

3. **Access the website:**
   - Main site: http://localhost:5000
   - Dashboard: http://localhost:5000/dashboard.html
   - Cape Builder: http://localhost:5000/cape-builder.html

### Default Login

- **Username:** `admin`
- **Password:** `123`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the parent directory with:

```env
DISCORD_TOKEN=your_bot_token_here
ROBLOX_API_KEY=your_roblox_api_key
CREATOR_ID=your_roblox_creator_id
```

### Port Configuration

Default port is `5000`. To change it, edit `api.py`:

```python
app.run(debug=True, port=5000, host='0.0.0.0')
```

## 📊 API Endpoints

- `GET /api/stats` - Get bot statistics
- `GET /api/tickets` - Get ticket list
- `GET /api/capes/history` - Get cape history
- `POST /api/upload-cape` - Upload cape to Roblox
- `GET /api/cape-status/<asset_id>` - Check cape upload status

## 🎨 Cape Builder

The cape builder integrates Pixlr X editor directly in the page:

1. Navigate to `/cape-builder.html`
2. Edit your cape in the embedded Pixlr editor
3. Export from Pixlr (File → Export → PNG)
4. Upload the exported file
5. Get your Asset ID and Image ID from Roblox

## 🔒 Security Notes

- Change default admin credentials in production
- Store sensitive tokens in `.env` file (not in code)
- Use HTTPS in production
- Set `FLASK_SECRET_KEY` in `.env` for sessions

## 🐛 Troubleshooting

**Port 5000 already in use:**
- Change the port in `api.py` or close the conflicting process

**Stats showing 0:**
- Ensure Discord bot is running
- Check that `DISCORD_TOKEN` is set in `.env`

**Cape upload not working:**
- Verify `ROBLOX_API_KEY` and `CREATOR_ID` are set
- Check console logs for error messages

**Dependencies missing:**
```bash
pip install flask flask-cors aiohttp discord.py python-dotenv requests
```

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contact the owner for contributions.

---

**Made with ❤️ for Zaid's Capes**
