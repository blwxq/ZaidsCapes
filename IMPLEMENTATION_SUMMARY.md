# Website Implementation Summary

## Overview
This document summarizes the comprehensive updates made to connect the website to the Discord bot, update the color scheme, and enhance the cape builder with Pixlr-like features.

## ✅ Completed Changes

### 1. Flask Backend API (`website/api.py`)
- Created Flask backend that connects to Discord bot's data files
- API endpoints for:
  - `/api/stats` - Real-time statistics from Discord bot
  - `/api/tickets` - Ticket list from Discord channels
  - `/api/user/<user_id>/points` - User points from points system
  - `/api/user/<user_id>/purchases` - Purchase history
  - `/api/quota/moderation/<user_id>` - Moderation quota status
  - `/api/quota/evmd/<user_id>` - EVMD quota status
- Discord OAuth authentication structure (ready for implementation)
- Role-based access control using:
  - Cape Staff Role ID: `1411341010293751951`
  - Discord Moderation Role: Name-based check
  - Moderation Admin Role ID: `1411690716010254447`
  - EVMD Role ID: `1414307847738757120`

### 2. Updated Color Scheme (`website/styles.css`)
- Changed from generic RGB theme to logo color scheme:
  - **Crimson Red**: `#C71585` (deep crimson red from logo)
  - **Teal/Turquoise**: `#00CED1` (vibrant teal from logo)
  - **Metallic Gold**: `#FFD700` (bright gold from logo)
  - **Dark Orange/Red**: `#CD5C5C` (dark red-orange from logo)
- Added glow effects for each color:
  - `--crimson-red-glow: rgba(199, 21, 133, 0.8)`
  - `--teal-glow: rgba(0, 206, 209, 0.8)`
  - `--gold-glow: rgba(255, 215, 0, 0.8)`
  - `--dark-orange-glow: rgba(205, 92, 92, 0.8)`
- Updated background gradients and particle effects to use new colors
- Glowing animations instead of RGB cycling

### 3. Enhanced Cape Builder (`website/enhanced_cape_builder.js`)
- **Magic Tool (Magic Wand)**:
  - Color-based selection with tolerance control
  - Flood fill algorithm for contiguous selection
  - Global selection option for non-contiguous areas
  - Visual selection outline

- **Image Handling**:
  - Image upload and caching
  - Image scaling (scaleX, scaleY)
  - Image rotation and positioning
  - Layer-based image management

- **Advanced Shapes**:
  - Rectangle, Circle, Triangle
  - Star (5-pointed)
  - Polygon (custom number of sides)
  - Stroke and fill options
  - Rotation and transformation

- **Filters** (Pixlr-like):
  - Blur (adjustable radius)
  - Brightness (adjustable level)
  - Contrast (adjustable level)
  - Saturation
  - Hue shift
  - Grayscale
  - Sepia
  - Invert
  - Emboss

- **Additional Features**:
  - Undo/Redo system (up to 50 history states)
  - Zoom controls (zoom in/out, reset, center)
  - Pan controls
  - Keyboard shortcuts (Ctrl+Z, Ctrl+S, Ctrl+E, etc.)
  - Touch support for mobile devices
  - Layer opacity and blend modes
  - Selection management

### 4. Dashboard API Integration (`website/dashboard.js`)
- Updated `fetchStats()` to connect to real Flask API
- Updated `fetchTickets()` to get real tickets from Discord
- Added `fetchUserPoints()` method
- Error handling with fallback to demo data
- Real-time data refresh every 30 seconds

## 🔧 Configuration Required

### Environment Variables (`.env`)
Add these to your `.env` file:
```env
FLASK_SECRET_KEY=your-secret-key-here
DISCORD_CLIENT_ID=your-discord-oauth-client-id
DISCORD_CLIENT_SECRET=your-discord-oauth-client-secret
DISCORD_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

### Running the Flask API
```bash
cd website
python api.py
```

The API will run on `http://localhost:5000`

### Updating HTML Files
To use the enhanced cape builder, update `cape-builder.html`:
```html
<script src="enhanced_cape_builder.js"></script>
```

## 📋 Remaining Tasks

### 1. Complete Discord OAuth Integration
- Implement full OAuth2 flow in `api.py`
- Add session management
- Implement role-based access checks for API endpoints
- Add authentication middleware

### 2. Connect to Discord Bot Directly
The current API reads from JSON files. For real-time data:
- Use Discord.py bot instance in Flask (requires async integration)
- Or use webhooks/HTTP endpoints from bot to Flask
- Or implement a shared database/Redis cache

### 3. Complete Ticket Integration
- Fetch tickets directly from Discord channels via bot
- Display Discord user information (avatar, username)
- Show ticket status (pending, completed, awaiting-payment)
- Connect ticket actions to Discord bot commands

### 4. User Points Display
- Add user points card to dashboard
- Show points in ticket listings
- Display points leaderboard

### 5. Quota System Integration
- Display moderation quota status for authorized users
- Display EVMD quota status for authorized users
- Show quota progress bars and charts

### 6. Complete Cape Builder UI
- Add filter control panel to HTML
- Add magic tool tolerance slider
- Add image upload button
- Complete properties panel for all layer types
- Add shape controls (sides, rotation, etc.)

### 7. CSS Color Updates
- Update remaining CSS classes to use new color scheme
- Add glow effects to buttons and interactive elements
- Update navigation and modals with new colors
- Test color contrast for accessibility

### 8. Mobile Responsiveness
- Test enhanced cape builder on mobile
- Adjust touch controls
- Optimize canvas rendering for mobile devices

## 🎨 Color Scheme Reference

### Primary Colors
- **Crimson Red**: `#C71585` - Used for accents, highlights
- **Teal**: `#00CED1` - Primary brand color, buttons, links
- **Gold**: `#FFD700` - Premium features, special highlights
- **Dark Orange**: `#CD5C5C` - Secondary accents, warnings

### Background
- **Dark Base**: `#0a0a0f`
- **Darker Base**: `#050508`
- **Purple Accent**: `#1a0a2e`

### Usage Examples
```css
/* Glowing button */
background: linear-gradient(135deg, var(--teal), var(--crimson-red));
box-shadow: 0 0 30px var(--teal-glow);

/* Gold accent */
color: var(--gold);
text-shadow: 0 0 10px var(--gold-glow);
```

## 🔐 Role-Based Access

### Authorized Roles
1. **Cape Staff** (Role ID: `1411341010293751951`)
   - Access to cape builder
   - View all tickets
   - Manage cape requests

2. **Discord Moderation** (Role Name: "discord moderation")
   - View moderation quota
   - Access moderation dashboard

3. **Moderation Admin** (Role ID: `1411690716010254447`)
   - Full moderation access
   - Quota management

4. **EVMD** (Role ID: `1414307847738757120`)
   - View EVMD quota
   - Access EVMD dashboard

## 📊 API Endpoints

### Stats
- `GET /api/stats` - Returns real-time statistics

### Tickets
- `GET /api/tickets` - List all tickets
- `GET /api/tickets/<id>` - Get specific ticket

### User Data
- `GET /api/user/<user_id>/points` - Get user points
- `GET /api/user/<user_id>/purchases` - Get purchase history

### Quota
- `GET /api/quota/moderation/<user_id>` - Moderation quota status
- `GET /api/quota/evmd/<user_id>` - EVMD quota status

### Authentication
- `GET /api/auth/login` - Initiate Discord OAuth
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/me` - Get current user

## 🚀 Next Steps

1. **Set up Discord OAuth Application**:
   - Go to https://discord.com/developers/applications
   - Create OAuth2 application
   - Add redirect URI: `http://localhost:5000/api/auth/callback`
   - Copy Client ID and Client Secret to `.env`

2. **Test API Connection**:
   - Start Flask API: `python website/api.py`
   - Open dashboard in browser
   - Check browser console for API errors

3. **Integrate Enhanced Cape Builder**:
   - Update `cape-builder.html` to use `enhanced_cape_builder.js`
   - Test all features (magic tool, filters, shapes, etc.)
   - Add UI controls for new features

4. **Connect to Real Discord Data**:
   - Modify bot to expose data via HTTP endpoints
   - Or use webhooks to push updates to Flask API
   - Or implement shared database/Redis

5. **Style Polish**:
   - Update all CSS to use new color scheme
   - Add glow effects throughout
   - Test on different screen sizes

## 📝 Notes

- The Flask API currently reads from JSON files in the bot's data directory
- For production, consider using a database or direct bot integration
- Discord OAuth needs to be fully implemented for secure authentication
- The enhanced cape builder needs UI controls added to HTML
- All role IDs are hardcoded - consider making them configurable

## 🐛 Known Issues

- Flask API doesn't connect to bot in real-time (reads files only)
- Discord OAuth not fully implemented
- Some cape builder features need UI controls
- Color scheme not applied to all CSS classes yet
- Mobile responsiveness needs testing

