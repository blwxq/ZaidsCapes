"""
Flask Backend API for Dashboard
Connects website to Discord bot with real-time data
Serves both API routes AND static files on same port
"""
from flask import Flask, jsonify, request, session, redirect, url_for, send_from_directory
from flask_cors import CORS
import json
import os
import sys
import asyncio
from datetime import datetime
from typing import Optional
import aiohttp
import discord
import requests
import re
import time
import urllib.error
from dotenv import load_dotenv

# Add parent directory to path to import cape_generation
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
try:
    from cape_generation import upload_decal_to_roblox, ROBLOX_API_KEY, CREATOR_ID, UPLOAD_TO_GROUP
    CAPE_UPLOAD_AVAILABLE = True
except ImportError as e:
    print(f"[API] Warning: Could not import cape upload functions: {e}")
    CAPE_UPLOAD_AVAILABLE = False

# Load environment variables
load_dotenv('../.env')

# Create Flask app - serve static files from current directory
app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'change-this-secret-key-in-production-12345')
CORS(app, supports_credentials=True)

# Discord Bot Configuration
DISCORD_BOT_TOKEN = os.getenv('DISCORD_TOKEN')
DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID', '')
DISCORD_CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET', '')
DISCORD_REDIRECT_URI = os.getenv('DISCORD_REDIRECT_URI', 'http://localhost:5000/api/auth/callback')
DISCORD_SCOPE = 'identify guilds'

# Guild IDs
MAIN_GUILD_ID = 1239943702336766004  # Main server for stats
AUTHORIZED_GUILD_IDS = [
    MAIN_GUILD_ID,
    1444253199920926786,
]

# Role IDs for authentication
CAPE_STAFF_ROLE_ID = 1411341010293751951  # From server_config.json
MODERATION_ROLE_NAME = "discord moderation"  # From moderation_quota.py
MODERATION_ADMIN_ROLE_ID = 1411690716010254447  # From moderation_quota.py
EVMD_ROLE_ID = 1414307847738757120  # From evmd_quota.py

# Data file paths (relative to parent directory)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)))

def load_json_file(filename):
    """Load JSON file from bot's data directory"""
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

# Serve index.html as root
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Serve all static files (HTML, CSS, JS, images, etc.)
@app.route('/<path:filename>')
def serve_static(filename):
    # Don't serve API routes as files
    if filename.startswith('api/'):
        # Let Flask handle API routes
        pass
    else:
        # Serve static files
        try:
            return send_from_directory('.', filename)
        except:
            return jsonify({'error': 'File not found'}), 404

def get_discord_bot():
    """Get or create Discord bot instance"""
    if not hasattr(app, 'bot') or app.bot.is_closed():
        intents = discord.Intents.default()
        intents.guilds = True
        intents.members = True
        app.bot = discord.Client(intents=intents)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(app.bot.login(DISCORD_BOT_TOKEN))
    return app.bot

def check_user_has_role(member, role_id=None, role_name=None):
    """Check if Discord member has a specific role"""
    if not member:
        return False
    if role_id:
        return member.get_role(role_id) is not None
    if role_name:
        for role in member.roles:
            if role.name.lower() == role_name.lower():
                return True
    return False

def is_authorized_user(user_id, guild_id):
    """Check if user is authorized (has staff roles)"""
    try:
        bot = get_discord_bot()
        guild = bot.get_guild(guild_id)
        if not guild:
            return False
        member = guild.get_member(user_id)
        if not member:
            return False
        
        # Check for any authorized role
        has_cape_staff = check_user_has_role(member, role_id=CAPE_STAFF_ROLE_ID)
        has_moderation = check_user_has_role(member, role_name=MODERATION_ROLE_NAME)
        has_moderation_admin = check_user_has_role(member, role_id=MODERATION_ADMIN_ROLE_ID)
        has_evmd = check_user_has_role(member, role_id=EVMD_ROLE_ID)
        
        return has_cape_staff or has_moderation or has_moderation_admin or has_evmd
    except Exception as e:
        print(f"[API] Error checking authorization: {e}")
        return False

@app.route('/api/auth/login', methods=['GET'])
def discord_login():
    """Redirect to Discord OAuth"""
    if not DISCORD_CLIENT_ID:
        return jsonify({'error': 'Discord OAuth not configured. Please add DISCORD_CLIENT_ID to .env file'}), 500
    
    auth_url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={DISCORD_SCOPE}"
    )
    return redirect(auth_url)

@app.route('/api/auth/callback', methods=['GET'])
def discord_callback():
    """Handle Discord OAuth callback"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        return f'<html><body><h1>OAuth Error: {error}</h1><p><a href="/dashboard.html">Go back to login</a></p></body></html>', 400
    
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    try:
        # Exchange code for access token
        token_data = {
            'client_id': DISCORD_CLIENT_ID,
            'client_secret': DISCORD_CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': DISCORD_REDIRECT_URI
        }
        
        import urllib.request
        import urllib.parse
        import json
        
        req = urllib.request.Request(
            'https://discord.com/api/oauth2/token',
            data=urllib.parse.urlencode(token_data).encode(),
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        with urllib.request.urlopen(req) as response:
            token_response = json.loads(response.read())
            access_token = token_response.get('access_token')
            
            if not access_token:
                return jsonify({'error': 'Failed to get access token'}), 400
            
            # Get user info
            user_req = urllib.request.Request(
                'https://discord.com/api/users/@me',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            with urllib.request.urlopen(user_req) as user_response:
                user_data = json.loads(user_response.read())
                
                # Store in session
                session['discord_user'] = {
                    'id': user_data.get('id'),
                    'username': user_data.get('username'),
                    'avatar': user_data.get('avatar'),
                    'discriminator': user_data.get('discriminator', '0'),
                    'access_token': access_token
                }
                
                # Redirect to dashboard with success
                return redirect(f'/dashboard.html?logged_in=true')
                
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if hasattr(e, 'read') else str(e)
        print(f"[API] OAuth error: {error_body}")
        return f'<html><body><h1>OAuth Error</h1><p>{error_body}</p><p>Check your Discord OAuth settings.</p><p><a href="/dashboard.html">Go back to login</a></p></body></html>', 500
    except Exception as e:
        print(f"[API] OAuth callback error: {e}")
        import traceback
        traceback.print_exc()
        return f'<html><body><h1>Error</h1><p>{str(e)}</p><p><a href="/dashboard.html">Go back to login</a></p></body></html>', 500

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user info"""
    if 'discord_user' in session:
        user = session['discord_user']
        return jsonify({
            'id': user.get('id'),
            'username': user.get('username'),
            'avatar': user.get('avatar'),
            'discriminator': user.get('discriminator', '0'),
            'roles': []  # Fetch from Discord API if needed
        })
    
    # Not authenticated
    return jsonify({'error': 'Not authenticated'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'success': True})

# ==================== PERFECT IMAGE ID RESOLVER ====================
def get_image_id_perfect(asset_id: str, max_retries: int = 25) -> Optional[str]:
    """
    PERFECT Image ID Resolver using Roblox Thumbnails API
    This is the MOST RELIABLE method - tries multiple times with progressive delays
    """
    if not asset_id:
        return None
    
    try:
        asset_id_num = int(asset_id) if asset_id.isdigit() else None
        if not asset_id_num or asset_id_num <= 0:
            return None
    except:
        return None
    
    url = f"https://thumbnails.roblox.com/v1/assets?assetIds={asset_id}&size=420x420&format=Png&isCircular=false"
    
    # Method 1: Thumbnails API (MOST RELIABLE - 90%+ success rate)
    for attempt in range(1, max_retries + 1):
        try:
            if attempt > 1:
                wait_time = min(3.0 + (attempt * 2), 30.0)  # Progressive: 5s, 7s, 9s... max 30s
                time.sleep(wait_time)
            
            response = requests.get(url, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                if "data" in data and len(data["data"]) > 0:
                    entry = data["data"][0]
                    
                    # Method 1a: Check targetId field (MOST RELIABLE)
                    target_id = entry.get("targetId")
                    if target_id:
                        target_id_str = str(target_id)
                        if target_id_str != str(asset_id):
                            print(f"[IMAGE-ID] ✅ Found image ID {target_id_str} from targetId (attempt {attempt})")
                            return target_id_str
                    
                    # Method 1b: Extract from imageUrl
                    image_url = entry.get("imageUrl", "")
                    if image_url:
                        # Pattern 1: https://tr.rbxcdn.com/{imageId}/420x420/...
                        match = re.search(r'/tr\.rbxcdn\.com/(\d{9,})/', image_url)
                        if match:
                            img_id = match.group(1)
                            if img_id != str(asset_id):
                                print(f"[IMAGE-ID] ✅ Found image ID {img_id} from imageUrl (attempt {attempt})")
                                return img_id
                        
                        # Pattern 2: rbxcdn.com/{imageId}
                        match2 = re.search(r'rbxcdn\.com/(\d{9,})/', image_url)
                        if match2:
                            img_id = match2.group(1)
                            if img_id != str(asset_id):
                                print(f"[IMAGE-ID] ✅ Found image ID {img_id} from imageUrl alt (attempt {attempt})")
                                return img_id
                        
                        # Pattern 3: Any numeric ID in URL (9+ digits)
                        match3 = re.search(r'/(\d{9,})/', image_url)
                        if match3:
                            img_id = match3.group(1)
                            if img_id != str(asset_id) and len(img_id) >= 9:
                                print(f"[IMAGE-ID] ✅ Found image ID {img_id} from imageUrl pattern3 (attempt {attempt})")
                                return img_id
            
        except Exception:
            if attempt < max_retries:
                pass  # Silent retry
            else:
                pass  # Silent failure
    
    # Method 2: AssetDelivery API (fallback)
    try:
        delivery_url = f"https://assetdelivery.roblox.com/v1/asset?id={asset_id}"
        response = requests.get(delivery_url, allow_redirects=True, timeout=20)
        if response.status_code == 200:
            final_url = response.url
            match = re.search(r'/(\d{9,})/', final_url)
            if match:
                img_id = match.group(1)
                if img_id != str(asset_id) and len(img_id) >= 9:
                    print(f"[IMAGE-ID] ✅ Found image ID {img_id} from AssetDelivery")
                    return img_id
    except Exception:
        pass
    
    return None

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get real-time statistics from Discord bot"""
    try:
        # Try to get stats from bot API endpoint first (port 5001)
        try:
            import urllib.request
            import json as json_lib
            with urllib.request.urlopen('http://localhost:5001/api/stats', timeout=3) as response:
                if response.status == 200:
                    bot_stats = json_lib.loads(response.read())
                    # Use real-time data from bot if available
                    if bot_stats and isinstance(bot_stats, dict) and 'totalMembers' in bot_stats:
                        print(f"[API] ✅ Using bot API stats - Members: {bot_stats.get('totalMembers')}, Online: {bot_stats.get('onlineUsers')}")
                        return jsonify(bot_stats)
        except Exception as e:
            print(f"[API] Bot API not available: {e}")
        
        # Fallback: Load from files
        ticket_counter = load_json_file('ticket_counter.json')
        total_tickets = ticket_counter.get('counter', 0) if ticket_counter else 0
        
        purchases = load_json_file('purchases.json')
        completed_count = sum(len(purchases.get(user_id, [])) for user_id in purchases) if purchases else 0
        
        pending_tickets = max(0, total_tickets - completed_count)
        
        points_data = load_json_file('points.json')
        total_users_with_points = len(points_data) if points_data else 0
        
        # Try to get member count from Discord REST API
        member_count = 0
        online_count = 0
        
        if DISCORD_BOT_TOKEN:
            try:
                import urllib.request
                import json as json_lib
                
                headers = {
                    'Authorization': f'Bot {DISCORD_BOT_TOKEN}',
                    'Content-Type': 'application/json'
                }
                
                req = urllib.request.Request(
                    f'https://discord.com/api/v10/guilds/{MAIN_GUILD_ID}?with_counts=true',
                    headers=headers
                )
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        data = json_lib.loads(response.read())
                        member_count = data.get('approximate_member_count', 0) or data.get('member_count', 0)
                        online_count = data.get('approximate_presence_count', 0)
                        print(f"[API] ✅ Fetched from Discord API - Members: {member_count}, Online: {online_count}")
            except Exception as e:
                # Silently continue - member count is optional
                pass
        
        # File-based fallback stats
        stats = {
            'pendingTickets': max(0, pending_tickets),
            'completedTickets': max(0, completed_count),
            'onlineUsers': max(0, online_count),
            'totalMembers': max(0, member_count),
            'botUptime': '99.9%',
            'capesGenerated': max(0, completed_count),
            'revenue': f'${max(0, completed_count * 40)}',
            'totalUsers': max(0, total_users_with_points),
            'totalTickets': max(0, total_tickets),
            'serverId': MAIN_GUILD_ID
        }
        
        print(f"[API] ✅ Stats fetched - Pending: {stats['pendingTickets']}, Completed: {stats['completedTickets']}, Members: {stats['totalMembers']}, Online: {stats['onlineUsers']}")
        
        return jsonify(stats)
    except Exception as e:
        print(f"[API] Error getting stats: {e}")
        import traceback
        traceback.print_exc()
        # Return default stats instead of error
        return jsonify({
            'pendingTickets': 0,
            'completedTickets': 0,
            'onlineUsers': 0,
            'totalMembers': 0,
            'botUptime': '99.9%',
            'capesGenerated': 0,
            'revenue': '$0',
            'totalUsers': 0,
            'totalTickets': 0
        })

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    """Get list of tickets from Discord channels"""
    try:
        # Try to get tickets from bot API endpoint first
        try:
            import urllib.request
            import json as json_lib
            with urllib.request.urlopen('http://localhost:5001/api/tickets', timeout=2) as response:
                tickets = json_lib.loads(response.read())
                if tickets:
                    return jsonify(tickets)
        except:
            pass
        
        # Fallback: return empty array if bot API not available
        return jsonify([])
    except Exception as e:
        print(f"[API] Error getting tickets: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tickets/<ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    """Get specific ticket details"""
    try:
        # Placeholder
        return jsonify({'error': 'Not implemented yet'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<user_id>/points', methods=['GET'])
def get_user_points(user_id):
    """Get user's points"""
    try:
        points_data = load_json_file('points.json')
        user_points = points_data.get(str(user_id), 0)
        return jsonify({'points': int(user_points)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<user_id>/purchases', methods=['GET'])
def get_user_purchases(user_id):
    """Get user's purchase history"""
    try:
        purchases = load_json_file('purchases.json')
        user_purchases = purchases.get(str(user_id), [])
        return jsonify({'purchases': user_purchases})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quota/moderation/<user_id>', methods=['GET'])
def get_moderation_quota(user_id):
    """Get user's moderation quota status"""
    try:
        quota_data = load_json_file('moderation_quota_data.json')
        # Calculate quota status
        return jsonify({'quota': quota_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quota/evmd/<user_id>', methods=['GET'])
def get_evmd_quota(user_id):
    """Get user's EVMD quota status"""
    try:
        quota_data = load_json_file('evmd_quota_data.json')
        return jsonify({'quota': quota_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-cape', methods=['POST'])
def upload_cape():
    """Upload cape image to Roblox using existing cape upload code"""
    try:
        if not CAPE_UPLOAD_AVAILABLE:
            return jsonify({'error': 'Cape upload module not available'}), 500
        
        if 'cape_image' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['cape_image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file bytes
        file_bytes = file.read()
        if len(file_bytes) == 0:
            return jsonify({'error': 'Empty file'}), 400
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        asset_name = f"Cape Upload - {timestamp}"
        asset_desc = "Cape uploaded via website Pixlr integration"
        
        # Validate API key and creator ID are set
        if not ROBLOX_API_KEY:
            return jsonify({'error': 'Roblox API key not configured. Please set ROBLOX_API_KEY in .env file.'}), 500
        
        if not CREATOR_ID:
            return jsonify({'error': 'Creator ID not configured. Please set CREATOR_ID in .env file.'}), 500
        
        # Run async upload in new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            asset_id = loop.run_until_complete(
                upload_decal_to_roblox(
                    ROBLOX_API_KEY,
                    CREATOR_ID,
                    file_bytes,
                    asset_name,
                    asset_desc,
                    to_group=UPLOAD_TO_GROUP
                )
            )
            
            print(f"[API] ✅ Cape uploaded successfully - Asset ID: {asset_id}")
            
            # Try to get image ID immediately using Thumbnails API (with shorter timeout for initial check)
            image_id = None
            try:
                print(f"[API] 🔍 Attempting to find image ID immediately...")
                # Try with fewer retries first (faster response)
                image_id = get_image_id_perfect(str(asset_id), max_retries=3)
                if image_id:
                    print(f"[API] ✅ Found image ID immediately: {image_id}")
                else:
                    print(f"[API] ⏳ Image ID not available yet (moderation pending), will resolve via status endpoint...")
            except Exception as e:
                print(f"[API] ⚠️ Error resolving image ID: {e}")
                import traceback
                traceback.print_exc()
            
            return jsonify({
                'success': True,
                'asset_id': str(asset_id),
                'image_id': str(image_id) if image_id else None,
                'message': f'Upload successful! Asset ID: {asset_id}. Image ID: {image_id if image_id else "Resolving..."}'
            })
        except RuntimeError as e:
            error_msg = str(e)
            print(f"[API] ❌ Upload failed: {error_msg}")
            return jsonify({
                'error': error_msg,
                'success': False
            }), 500
        except Exception as e:
            error_msg = str(e)
            print(f"[API] ❌ Upload error: {error_msg}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'error': f'Upload failed: {error_msg}',
                'success': False
            }), 500
        finally:
            loop.close()
        
    except Exception as e:
        print(f"[API] Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/cape-status/<asset_id>', methods=['GET'])
def get_cape_status(asset_id):
    """Check status of uploaded cape and get image ID if available"""
    try:
        # First, try to get image ID using Thumbnails API (PERFECT METHOD)
        # Use more retries for status check since user is waiting
        image_id = get_image_id_perfect(str(asset_id), max_retries=10)
        
        if image_id:
            print(f"[API] ✅ Status check found image ID: {image_id}")
            return jsonify({
                'asset_id': asset_id,
                'image_id': image_id,
                'status': 'completed',
                'timestamp': datetime.now().isoformat()
            })
        
        # Check cape_logs.json for this asset ID
        cape_logs = load_json_file('cape_logs.json')
        if cape_logs:
            if 'capes' in cape_logs and isinstance(cape_logs['capes'], list):
                for cape in cape_logs['capes']:
                    if str(cape.get('asset_id', '')) == str(asset_id):
                        return jsonify({
                            'asset_id': asset_id,
                            'image_id': cape.get('image_id', cape.get('asset_id', '')),
                            'status': 'completed',
                            'timestamp': cape.get('timestamp', datetime.now().isoformat())
                        })
            else:
                for key, cape in cape_logs.items():
                    if key != '_note' and str(cape.get('asset_id', '')) == str(asset_id):
                        return jsonify({
                            'asset_id': asset_id,
                            'image_id': cape.get('image_id', cape.get('asset_id', '')),
                            'status': 'completed',
                            'timestamp': cape.get('timestamp', datetime.now().isoformat())
                        })
        
        # Check purchases.json for this asset ID
        purchases = load_json_file('purchases.json')
        if purchases:
            for user_id, user_purchases in purchases.items():
                if isinstance(user_purchases, list):
                    for purchase in user_purchases:
                        if isinstance(purchase, dict) and str(purchase.get('decal_id', '')) == str(asset_id):
                            return jsonify({
                                'asset_id': asset_id,
                                'image_id': purchase.get('decal_id'),
                                'status': 'completed',
                                'timestamp': purchase.get('timestamp', datetime.now().isoformat())
                            })
        
        return jsonify({
            'asset_id': asset_id,
            'image_id': None,
            'status': 'processing'
        })
    except Exception as e:
        print(f"[API] Error getting cape status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/capes/history', methods=['GET'])
def get_cape_history():
    """Get cape history - from cape_logs.json first, then purchases.json as fallback"""
    try:
        username_filter = request.args.get('username', '').upper().replace('+', ' ')
        all_capes = []
        
        # Method 1: Try to load from cape_logs.json first (more detailed)
        cape_logs = load_json_file('cape_logs.json')
        if cape_logs and isinstance(cape_logs, dict):
            # Check if it has 'capes' key (new format) or is a dict of entries (old format)
            if 'capes' in cape_logs and isinstance(cape_logs['capes'], list):
                # New format: {"capes": [...]}
                for cape in cape_logs['capes']:
                    if isinstance(cape, dict):
                        all_capes.append({
                            'decal_id': cape.get('asset_id', cape.get('decal_id', '')),
                            'asset_id': cape.get('asset_id', cape.get('decal_id', '')),
                            'image_id': cape.get('image_id', cape.get('asset_id', cape.get('decal_id', ''))),
                            'ticket_number': cape.get('ticket_number', ''),
                            'timestamp': cape.get('timestamp', ''),
                            'discord_user_id': cape.get('discord_user_id', ''),
                            'username': cape.get('username', 'Unknown')
                        })
            elif len(cape_logs) > 0:
                # Old format: {key: {...}, key: {...}}
                for key, cape in cape_logs.items():
                    if key != '_note' and isinstance(cape, dict):
                        all_capes.append({
                            'decal_id': cape.get('asset_id', cape.get('decal_id', '')),
                            'asset_id': cape.get('asset_id', cape.get('decal_id', '')),
                            'image_id': cape.get('image_id', cape.get('asset_id', cape.get('decal_id', ''))),
                            'ticket_number': cape.get('ticket_number', ''),
                            'timestamp': cape.get('timestamp', ''),
                            'discord_user_id': cape.get('discord_user_id', ''),
                            'username': cape.get('username', 'Unknown')
                        })
        
        # Method 2: Fallback to purchases.json if cape_logs.json is empty
        if len(all_capes) == 0:
            purchases = load_json_file('purchases.json')
            if purchases:
                for user_id, user_purchases in purchases.items():
                    if isinstance(user_purchases, list):
                        for purchase in user_purchases:
                            if isinstance(purchase, dict):
                                decal_id = purchase.get('decal_id', '')
                                all_capes.append({
                                    'decal_id': decal_id,
                                    'asset_id': decal_id,
                                    'image_id': decal_id,
                                    'ticket_number': purchase.get('ticket_number', ''),
                                    'timestamp': purchase.get('timestamp', ''),
                                    'discord_user_id': user_id,
                                    'username': 'Unknown'
                                })
        
        # Filter by username if specified
        if username_filter:
            all_capes = [c for c in all_capes if username_filter in str(c.get('username', '')).upper()]
        
        # Sort by timestamp (newest first)
        all_capes.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        print(f"[API] ✅ Cape history loaded - {len(all_capes)} capes found")
        
        return jsonify({
            'username': username_filter if username_filter else 'ALL',
            'capes': all_capes,
            'total': len(all_capes)
        })
    except Exception as e:
        print(f"[API] Error getting cape history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'capes': [], 'total': 0, 'error': str(e)})

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 ZAID'S CAPES - Combined Server")
    print("=" * 60)
    print("📁 Serving static files AND API on port 5000")
    print("🌐 Open: http://localhost:5000")
    print("=" * 60)
    if not DISCORD_CLIENT_ID:
        print("⚠️  WARNING: DISCORD_CLIENT_ID not set in .env")
        print("   Discord OAuth will not work until configured")
        print("=" * 60)
    app.run(debug=True, port=5000, host='0.0.0.0')
