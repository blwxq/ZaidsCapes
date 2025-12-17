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

## 📁 Project Structure

```
website/
├── api.py                      # Flask backend API server
├── index.html                  # Landing page
├── dashboard.html              # Dashboard with tickets & stats
├── cape-builder.html           # Cape builder with Pixlr integration
├── styles.css                  # Main styles (RGB theme)
├── dashboard.css               # Dashboard-specific styles
├── cape-builder.css            # Cape builder styles
├── script.js                   # Main page scripts
├── dashboard.js                # Dashboard functionality
├── dashboard_cape_history.js   # Cape history display
├── pixlr-integration.js        # Pixlr editor integration
├── auth.js                     # Authentication system
├── image_id_resolver.py        # Image ID resolution utility
├── requirements.txt            # Python dependencies
├── START_ALL.bat               # Windows start script
├── INSTALL_DEPENDENCIES.bat    # Dependency installer
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- Discord bot running (for real-time stats)
- `.env` file with required tokens (see Configuration)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd website
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   Or on Windows: Double-click `INSTALL_DEPENDENCIES.bat`

3. **Configure environment:**
   Create a `.env` file in the parent directory with:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   ROBLOX_API_KEY=your_roblox_api_key
   CREATOR_ID=your_roblox_creator_id
   ```

4. **Start the server:**
   ```bash
   python api.py
   ```
   
   Or on Windows: Double-click `START_ALL.bat`

5. **Access the website:**
   - Main site: http://localhost:5000
   - Dashboard: http://localhost:5000/dashboard.html
   - Cape Builder: http://localhost:5000/cape-builder.html

## 🔑 Default Login

- **Username:** `admin`
- **Password:** `123`

**⚠️ IMPORTANT:** Change these credentials before deploying to production!

## 📋 Requirements

See `requirements.txt` for full list. Main dependencies:

- Flask >= 3.0.0
- Flask-CORS >= 4.0.0
- discord.py >= 2.3.0
- requests
- aiohttp
- python-dotenv

## 🔧 Configuration

### Port

Default port is `5000`. To change it, edit `api.py`:

```python
app.run(debug=True, port=5000, host='0.0.0.0')
```

### Authentication

To change default login credentials, edit `website/auth.js`:

```javascript
if (username === 'admin' && password === '123') {
    // Change these values
}
```

### Server Configuration

The website fetches stats from server ID `1239943702336766004` by default. To change it, edit `api.py`:

```python
MAIN_GUILD_ID = 1239943702336766004
```

## 📊 API Endpoints

- `GET /api/stats` - Get bot statistics
- `GET /api/tickets` - Get ticket list  
- `GET /api/capes/history` - Get cape history
- `GET /api/capes/history?username=USERNAME` - Filter by username
- `POST /api/upload-cape` - Upload cape to Roblox
- `GET /api/cape-status/<asset_id>` - Check cape upload status

## 🎨 Cape Builder

The cape builder integrates Pixlr X editor:

1. Navigate to `/cape-builder.html`
2. Edit your cape in the embedded Pixlr editor
3. Export from Pixlr (File → Export → PNG)
4. Upload the exported file via the upload button
5. Get your Asset ID and Image ID from Roblox

The image ID is automatically resolved using Roblox's Thumbnails API.

## 🔒 Security Notes

- **Change default credentials** in production
- Store sensitive tokens in `.env` file (never commit to Git)
- Use HTTPS in production environments
- Set `FLASK_SECRET_KEY` in `.env` for secure sessions
- Review and update CORS settings for production

## 🐛 Troubleshooting

### Port 5000 already in use
Change the port in `api.py` or close the conflicting process:
```python
app.run(debug=True, port=8080, host='0.0.0.0')  # Use port 8080
```

### Stats showing 0
- Ensure Discord bot is running
- Check that `DISCORD_TOKEN` is set correctly in `.env`
- Verify bot has access to the configured guild

### Cape upload not working
- Verify `ROBLOX_API_KEY` and `CREATOR_ID` are set in `.env`
- Check console logs for detailed error messages
- Ensure API key has asset upload permissions

### Dependencies missing
```bash
pip install flask flask-cors aiohttp discord.py python-dotenv requests
```

### Import errors
Make sure you're running from the `website/` directory and that the parent directory contains the bot files (for cape_generation imports).

## 📝 Development

### Running in Debug Mode

The server runs in debug mode by default. For production:

```python
app.run(debug=False, port=5000, host='0.0.0.0')
```

### Testing

1. Start the Discord bot (`python bot.py`)
2. Start the website server (`python api.py`)
3. Open http://localhost:5000
4. Login with default credentials
5. Test all features

## 📄 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, contact the repository owner.

---

**Made with ❤️ for Zaid's Capes**

