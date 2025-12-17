// Simple Username/Password Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('dashboard_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                if (this.isTokenValid(this.currentUser)) {
                    this.showDashboard();
                } else {
                    this.logout();
                }
            } catch (e) {
                this.logout();
            }
        } else {
            // Show login screen
            this.showLogin();
        }

        // Setup login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Simple authentication
        if (username === 'admin' && password === '123') {
            const user = {
                username: username,
                token: 'admin_token_' + Date.now(),
                loginTime: Date.now()
            };
            
            this.currentUser = user;
            localStorage.setItem('dashboard_user', JSON.stringify(user));
            this.showDashboard();
        } else {
            this.showError('Invalid username or password');
        }
    }

    isTokenValid(user) {
        if (!user || !user.loginTime) return false;
        
        // Token expires after 7 days
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        return (Date.now() - user.loginTime) < sevenDays;
    }

    showDashboard() {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        // Trigger dashboard load
        if (window.dashboardManager) {
            window.dashboardManager.loadStats();
        }
    }

    showLogin() {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('login-form');
        if (form) form.reset();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('dashboard_user');
        this.showLogin();
    }

    showError(message) {
        // Remove existing errors
        const existing = document.querySelector('.error-notification');
        if (existing) existing.remove();
        
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(199, 21, 133, 0.95);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 10px 40px rgba(199, 21, 133, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    getCurrentUser() {
        return this.currentUser;
    }
    
    isStaff() {
        return this.currentUser && this.currentUser.username === 'admin';
    }
}

// Initialize auth system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
