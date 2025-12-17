"""
Example Flask Backend API for Dashboard
Connect this to your Discord bot's database to provide real-time data
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Load data from your bot's JSON files
DATA_DIR = "../"  # Path to your bot's data files

def load_ticket_data():
    """Load tickets from your bot's ticket system"""
    try:
        ticket_file = os.path.join(DATA_DIR, "ticket_data.json")
        if os.path.exists(ticket_file):
            with open(ticket_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading tickets: {e}")
    return {}

def load_quota_data():
    """Load quota data from moderation quota system"""
    try:
        quota_file = os.path.join(DATA_DIR, "moderation_quota_data.json")
        if os.path.exists(quota_file):
            with open(quota_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading quota: {e}")
    return {}

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get real-time statistics"""
    try:
        ticket_data = load_ticket_data()
        quota_data = load_quota_data()
        
        # Count pending tickets
        pending_count = 0
        completed_count = 0
        if isinstance(ticket_data, dict):
            for ticket_id, ticket in ticket_data.items():
                if isinstance(ticket, dict):
                    status = ticket.get('status', '').lower()
                    if 'pending' in status or 'awaiting' in status:
                        pending_count += 1
                    elif 'completed' in status or 'closed' in status:
                        completed_count += 1
        
        # Calculate other stats
        stats = {
            'pendingTickets': pending_count,
            'completedTickets': completed_count,
            'onlineUsers': 1234,  # Replace with actual bot member count
            'botUptime': '99.9%',  # Calculate from bot start time
            'capesGenerated': 234,  # Count from cape generation logs
            'revenue': '$1,234'  # Calculate from payment data
        }
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    """Get list of pending tickets"""
    try:
        ticket_data = load_ticket_data()
        tickets = []
        
        if isinstance(ticket_data, dict):
            for ticket_id, ticket in ticket_data.items():
                if isinstance(ticket, dict):
                    status = ticket.get('status', '').lower()
                    if 'pending' in status or 'awaiting' in status:
                        tickets.append({
                            'id': ticket_id,
                            'type': ticket.get('type', 'support'),
                            'user': ticket.get('user', 'Unknown'),
                            'description': ticket.get('description', 'No description'),
                            'timestamp': ticket.get('created_at', datetime.now().isoformat()),
                            'urgent': ticket.get('urgent', False)
                        })
        
        # Sort by timestamp (newest first)
        tickets.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return jsonify(tickets)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ticket/<ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    """Get specific ticket details"""
    try:
        ticket_data = load_ticket_data()
        if ticket_id in ticket_data:
            return jsonify(ticket_data[ticket_id])
        return jsonify({'error': 'Ticket not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ticket/<ticket_id>/complete', methods=['POST'])
def complete_ticket(ticket_id):
    """Mark ticket as completed"""
    try:
        ticket_file = os.path.join(DATA_DIR, "ticket_data.json")
        if os.path.exists(ticket_file):
            with open(ticket_file, 'r', encoding='utf-8') as f:
                ticket_data = json.load(f)
            
            if ticket_id in ticket_data:
                ticket_data[ticket_id]['status'] = 'completed'
                ticket_data[ticket_id]['completed_at'] = datetime.now().isoformat()
                
                with open(ticket_file, 'w', encoding='utf-8') as f:
                    json.dump(ticket_data, f, indent=4)
                
                return jsonify({'success': True})
        
        return jsonify({'error': 'Ticket not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting API server on http://localhost:5000")
    print("Make sure CORS is enabled for your frontend!")
    app.run(debug=True, port=5000)

