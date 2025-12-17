// Cape History Management
class CapeHistoryManager {
    constructor() {
        this.capes = [];
        this.init();
    }

    init() {
        // Load cape history immediately
        setTimeout(() => {
            this.loadCapeHistory();
        }, 500);
    }

    async loadCapeHistory() {
        try {
            // Load all capes (purchases.json contains all cape data)
            const response = await fetch('/api/capes/history', {
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
            this.capes = data.capes || [];
            this.displayCapes(this.capes);
        } catch (error) {
            console.error('[Dashboard] Error loading cape history:', error);
            this.displayError('Failed to load cape history: ' + error.message);
        }
    }

    displayCapes(capes) {
        const container = document.getElementById('cape-history-list');
        if (!container) return;

        if (capes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎨</div>
                    <h3>No Capes Found</h3>
                    <p>No capes found for ZAID+AUTOMATION</p>
                </div>
            `;
            return;
        }

        container.innerHTML = capes.map(cape => this.createCapeCard(cape)).join('');
    }

    createCapeCard(cape) {
        const date = cape.timestamp ? new Date(cape.timestamp).toLocaleDateString() : 'Unknown';
        return `
            <div class="ticket-card cape-card">
                <div class="ticket-header">
                    <span class="ticket-id">Cape #${cape.ticket_number || 'N/A'}</span>
                    <span class="ticket-type cape">CAPE</span>
                </div>
                <div class="ticket-user">Asset ID: ${cape.asset_id || cape.decal_id || 'N/A'}</div>
                <div class="ticket-description">
                    Created on: ${date}
                </div>
                <div class="ticket-footer">
                    <span>${cape.asset_id || cape.decal_id || 'No ID'}</span>
                    <div class="ticket-actions">
                        <button class="ticket-action-btn" onclick="copyToClipboard('${cape.asset_id || cape.decal_id || ''}')">
                            Copy ID
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    displayError(message) {
        const container = document.getElementById('cape-history-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.capeHistoryManager = new CapeHistoryManager();
    
    // Load cape history immediately and also after dashboard loads
    setTimeout(() => {
        if (window.capeHistoryManager) {
            window.capeHistoryManager.loadCapeHistory();
        }
    }, 1000);
    
    // Also try loading when dashboard is ready
    if (window.dashboardManager) {
        setTimeout(() => {
            if (window.capeHistoryManager) {
                window.capeHistoryManager.loadCapeHistory();
            }
        }, 2000);
    }
    
    // Retry loading if still not loaded after 5 seconds
    setTimeout(() => {
        const container = document.getElementById('cape-history-list');
        if (container && container.innerHTML.includes('Loading cape history')) {
            if (window.capeHistoryManager) {
                window.capeHistoryManager.loadCapeHistory();
            }
        }
    }, 5000);
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Copied to clipboard: ${text}`);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

