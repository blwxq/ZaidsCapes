// Dashboard Functionality
class Dashboard {
    constructor() {
        this.tickets = [];
        this.stats = {};
        this.init();
    }

    init() {
        // Wait for auth to initialize
        if (document.getElementById('dashboard') && document.getElementById('dashboard').style.display !== 'none') {
            this.loadData();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterTickets(btn.dataset.filter);
            });
        });
    }

    async loadData() {
        await Promise.all([
            this.loadStats(),
            this.loadTickets()
        ]);
        
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadStats();
            this.loadTickets();
        }, 30000);
    }

    async loadStats() {
        // Simulate API call - replace with real API
        const stats = await this.fetchStats();
        
        this.stats = stats;
        this.updateStatsDisplay(stats);
    }

    async fetchStats() {
        try {
            // Connect to real Flask API
            const response = await fetch('/api/stats', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Transform API response to dashboard format
            return {
                pendingTickets: data.pendingTickets || 0,
                completedTickets: data.completedTickets || 0,
                onlineUsers: data.onlineUsers || 0,
                totalMembers: data.totalMembers || 0,
                botUptime: data.botUptime || '99.9%',
                capesGenerated: data.capesGenerated || 0,
                revenue: data.revenue || '$0',
                totalUsers: data.totalUsers || 0,
                totalTickets: data.totalTickets || 0
            };
        } catch (error) {
            console.error('[Dashboard] Error fetching stats:', error);
            // Fallback to demo data on error
            return {
                pendingTickets: 0,
                completedTickets: 0,
                onlineUsers: 'N/A',
                botUptime: '99.9%',
                capesGenerated: 0,
                revenue: '$0'
            };
        }
    }

    updateStatsDisplay(stats) {
        const elements = {
            'pending-tickets': stats.pendingTickets || 0,
            'completed-tickets': stats.completedTickets || 0,
            'online-users': stats.onlineUsers > 0 ? stats.onlineUsers.toLocaleString() : 0,
            'total-members': stats.totalMembers > 0 ? stats.totalMembers.toLocaleString() : 0,
            'bot-uptime': stats.botUptime || '99.9%',
            'capes-generated': stats.capesGenerated || 0,
            'revenue': stats.revenue || '$0'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateValue(element, 0, value, 1000);
            }
        });
    }

    animateValue(element, start, end, duration) {
        const startValue = parseFloat(element.textContent) || 0;
        const endValue = typeof end === 'string' ? end : parseFloat(end);
        
        if (typeof endValue === 'string') {
            element.textContent = endValue;
            return;
        }

        const range = endValue - startValue;
        const increment = endValue > startValue ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        
        let current = startValue;
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= endValue) || (increment < 0 && current <= endValue)) {
                element.textContent = this.formatNumber(endValue);
                clearInterval(timer);
            } else {
                element.textContent = this.formatNumber(current);
            }
        }, stepTime);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    async loadTickets() {
        try {
            const tickets = await this.fetchTickets();
            this.tickets = tickets;
            this.displayTickets(tickets);
        } catch (error) {
            console.error('[Dashboard] Error loading tickets:', error);
            this.displayTickets([]);
        }
    }

    async fetchTickets() {
        try {
            // Connect to real Flask API
            const response = await fetch('/api/tickets', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const tickets = await response.json();
            
            // Transform API response to dashboard format
            return tickets.map(ticket => ({
                id: ticket.id || 'UNKNOWN',
                type: ticket.type || 'cape',
                user: ticket.user || 'Unknown User',
                description: ticket.description || 'No description',
                timestamp: ticket.timestamp ? new Date(ticket.timestamp) : new Date(),
                urgent: ticket.urgent || false,
                discordUserId: ticket.discordUserId,
                ticketNumber: ticket.ticketNumber
            }));
        } catch (error) {
            console.error('[Dashboard] Error fetching tickets:', error);
            // Return empty array on error
            return [];
        }
    }
    
    async fetchUserPoints(userId) {
        try {
            const response = await fetch(`/api/user/${userId}/points`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.points || 0;
        } catch (error) {
            console.error('[Dashboard] Error fetching user points:', error);
            return 0;
        }
    }

    displayTickets(tickets) {
        const container = document.getElementById('tickets-list');
        if (!container) return;

        if (tickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Tickets Found</h3>
                    <p>All tickets have been processed!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tickets.map(ticket => this.createTicketCard(ticket)).join('');
        
        // Add click handlers
        container.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', () => {
                const ticketId = card.dataset.ticketId;
                this.openTicket(ticketId);
            });
        });
    }

    createTicketCard(ticket) {
        const timeAgo = this.getTimeAgo(ticket.timestamp);
        const typeClass = ticket.urgent ? 'urgent' : ticket.type;
        
        return `
            <div class="ticket-card" data-ticket-id="${ticket.id}">
                <div class="ticket-header">
                    <div>
                        <div class="ticket-id">${ticket.id}</div>
                        <div class="ticket-user">${ticket.user}</div>
                    </div>
                    <span class="ticket-type ${typeClass}">${ticket.urgent ? 'Urgent' : ticket.type.toUpperCase()}</span>
                </div>
                <div class="ticket-description">${ticket.description}</div>
                <div class="ticket-footer">
                    <span>${timeAgo}</span>
                    <div class="ticket-actions">
                        <button class="ticket-action-btn" onclick="event.stopPropagation(); dashboard.viewTicket('${ticket.id}')">View</button>
                        <button class="ticket-action-btn" onclick="event.stopPropagation(); dashboard.completeTicket('${ticket.id}')">Complete</button>
                    </div>
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    filterTickets(filter) {
        let filtered = [...this.tickets];
        
        if (filter === 'cape') {
            filtered = filtered.filter(t => t.type === 'cape');
        } else if (filter === 'support') {
            filtered = filtered.filter(t => t.type === 'support');
        } else if (filter === 'urgent') {
            filtered = filtered.filter(t => t.urgent);
        }
        
        this.displayTickets(filtered);
    }

    viewTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (ticket) {
            alert(`Ticket Details:\n\nID: ${ticket.id}\nUser: ${ticket.user}\nType: ${ticket.type}\nDescription: ${ticket.description}`);
        }
    }

    completeTicket(ticketId) {
        if (confirm('Mark this ticket as completed?')) {
            this.tickets = this.tickets.filter(t => t.id !== ticketId);
            this.displayTickets(this.tickets);
            this.loadStats(); // Refresh stats
        }
    }

    openTicket(ticketId) {
        this.viewTicket(ticketId);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth to check login status
    setTimeout(() => {
        if (document.getElementById('dashboard') && document.getElementById('dashboard').style.display !== 'none') {
            window.dashboard = new Dashboard();
        }
    }, 500);
});

// Reinitialize when switching from login to dashboard
const observer = new MutationObserver(() => {
    if (document.getElementById('dashboard') && document.getElementById('dashboard').style.display !== 'none') {
        if (!window.dashboard) {
            window.dashboard = new Dashboard();
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
});

