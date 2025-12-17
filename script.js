// Main page script
document.addEventListener('DOMContentLoaded', () => {
    // Modal functionality
    const modal = document.getElementById('terms-modal');
    const termsLinks = document.querySelectorAll('a[href="#terms"]');
    const closeBtn = document.querySelector('.close');

    termsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) {
                modal.style.display = 'block';
            }
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Update Discord invite link (replace YOUR_INVITE_CODE)
    const discordLinks = document.querySelectorAll('a[href*="YOUR_INVITE_CODE"]');
    // Leave as placeholder - user will replace with their actual invite code
    
    // Load stats for hero cards
    loadHeroStats();
});

async function loadHeroStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) return;
        
        const stats = await response.json();
        
        // Update hero stats with full numbers
        const membersEl = document.getElementById('hero-members');
        const ticketsEl = document.getElementById('hero-tickets');
        
        if (membersEl) {
            if (stats.totalMembers && stats.totalMembers > 0) {
                membersEl.textContent = typeof stats.totalMembers === 'number' 
                    ? stats.totalMembers.toLocaleString() 
                    : stats.totalMembers;
            } else {
                // If 0, try to load from bot status or show loading
                membersEl.textContent = '...';
            }
        }
        
        if (ticketsEl && stats.totalTickets) {
            ticketsEl.textContent = typeof stats.totalTickets === 'number' 
                ? stats.totalTickets.toLocaleString() 
                : stats.totalTickets;
        }
    } catch (error) {
        console.log('Could not load stats:', error);
    }
}

