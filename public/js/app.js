// ============================================
// EDU CAM LAB - MAIN APPLICATION LOGIC
// Production-ready app with initialization, navigation, and UI helpers
// ============================================

const App = {
    // ============================================
    // CONFIGURATION
    // ============================================
    config: {
        debug: window.CONFIG?.DEBUG || false,
        appName: window.CONFIG?.APP_NAME || 'EduCamLab',
        version: window.CONFIG?.APP_VERSION || '2.0.0'
    },

    // ============================================
    // STATE
    // ============================================
    state: {
        initialized: false,
        currentPage: window.location.pathname.split('/').pop() || 'index.html',
        user: null,
        isLoading: false
    },

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize the application
     */
    async init() {
        if (this.state.initialized) return;

        try {
            // Set up global error handling
            this._setupErrorHandling();

            // Initialize UI components
            this._initMobileMenu();
            this._initNavLinks();
            this._initTheme();

            // Load user data if authenticated
            await this._loadUser();

            // Initialize page-specific logic
            this._initPage();

            // Mark as initialized
            this.state.initialized = true;

            if (this.config.debug) {
                console.log('🚀 App initialized successfully');
                console.log(`📄 Current page: ${this.state.currentPage}`);
                console.log(`👤 User: ${this.state.user ? this.state.user.name : 'Guest'}`);
            }

        } catch (error) {
            console.error('App initialization error:', error);
        }
    },

    // ============================================
    // USER MANAGEMENT
    // ============================================

    /**
     * Load current user data
     */
    async _loadUser() {
        // Check if Auth is available
        if (typeof Auth === 'undefined') return;

        if (Auth.isAuthenticated()) {
            try {
                // Try to get user from API
                if (typeof API !== 'undefined') {
                    const result = await API.getProfile();
                    if (result.success && result.data) {
                        this.state.user = result.data;
                        Auth.setUserData(result.data);
                    }
                } else {
                    // Fallback to stored data
                    this.state.user = Auth.getUserData();
                }
            } catch (error) {
                console.warn('Failed to load user:', error);
                this.state.user = Auth.getUserData();
            }
        } else {
            this.state.user = null;
        }

        // Update UI
        this._updateUserUI();
    },

    /**
     * Get current user
     */
    getUser() {
        return this.state.user;
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.state.user && typeof Auth !== 'undefined' && Auth.isAuthenticated();
    },

    /**
     * Logout user
     */
    async logout() {
        if (!this.isLoggedIn()) return;

        if (confirm('Are you sure you want to logout?')) {
            try {
                if (typeof API !== 'undefined') {
                    await API.logout();
                } else {
                    if (typeof Auth !== 'undefined') {
                        Auth.clearToken();
                        Auth.setUserData(null);
                    }
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData');
                }
                this.state.user = null;
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout anyway
                if (typeof Auth !== 'undefined') {
                    Auth.clearToken();
                    Auth.setUserData(null);
                }
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                this.state.user = null;
                window.location.href = 'login.html';
            }
        }
    },

    // ============================================
    // NAVIGATION
    // ============================================

    /**
     * Navigate to a page
     */
    navigate(url, options = {}) {
        const { replace = false, state = null } = options;
        if (replace) {
            window.location.replace(url);
        } else {
            window.location.href = url;
        }
    },

    /**
     * Redirect if not authenticated
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            this.navigate(`${redirectUrl}?redirect=${encodeURIComponent(this.state.currentPage)}`);
            return false;
        }
        return true;
    },

    /**
     * Redirect if authenticated (for login/register pages)
     */
    requireGuest(redirectUrl = 'dashboard.html') {
        if (this.isLoggedIn()) {
            this.navigate(redirectUrl);
            return false;
        }
        return true;
    },

    // ============================================
    // UI HELPERS
    // ============================================

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 4000) {
        // Check if Utils has toast
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            return Utils.showToast(message, type, duration);
        }

        // Fallback implementation
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                width: 100%;
            `;
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        const colors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            info: 'var(--info)',
            warning: 'var(--warning)'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 16px 20px;
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideUp 0.3s ease;
            transform-origin: bottom right;
        `;

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 20px;"></i>
            <span style="flex: 1; font-size: 14px; color: var(--text-primary);">${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px;">&times;</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    /**
     * Show loading state
     */
    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            min-height: 200px;
        `;

        overlay.innerHTML = `
            <div class="spinner" style="margin: 0 auto; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p style="color: var(--text-muted); margin-top: 16px;">${message}</p>
        `;

        container.innerHTML = '';
        container.appendChild(overlay);
        this.state.isLoading = true;
    },

    /**
     * Hide loading state
     */
    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.state.isLoading = false;
    },

    /**
     * Update user UI elements
     */
    _updateUserUI() {
        const user = this.state.user;

        // Update avatar
        const avatarEl = document.querySelector('.user-avatar-small');
        if (avatarEl) {
            if (user) {
                const initials = user.firstname ? user.firstname[0].toUpperCase() : 'S';
                avatarEl.textContent = initials;
                avatarEl.style.display = 'flex';
            } else {
                avatarEl.style.display = 'none';
            }
        }

        // Update name
        const nameEl = document.querySelector('.user-name-small');
        if (nameEl && user) {
            const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Student';
            nameEl.textContent = fullName;
        }

        // Update profile links
        if (user) {
            document.querySelectorAll('.auth-required').forEach(el => {
                el.style.display = '';
            });
            document.querySelectorAll('.guest-only').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            document.querySelectorAll('.auth-required').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.guest-only').forEach(el => {
                el.style.display = '';
            });
        }
    },

    // ============================================
    // THEME
    // ============================================

    /**
     * Initialize theme
     */
    _initTheme() {
        if (typeof Utils !== 'undefined' && Utils.isDarkMode) {
            const isDark = Utils.isDarkMode();
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            // Update toggle if exists
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) {
                toggle.checked = isDark;
            }
        } else {
            // Fallback: check localStorage
            const theme = localStorage.getItem('theme');
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }
    },

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        if (typeof Utils !== 'undefined' && Utils.toggleDarkMode) {
            const isDark = Utils.toggleDarkMode();
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) {
                toggle.checked = isDark;
            }
            this.showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success');
            return isDark;
        } else {
            // Fallback
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) {
                toggle.checked = !isDark;
            }
            this.showToast(isDark ? '☀️ Light mode enabled' : '🌙 Dark mode enabled', 'success');
            return !isDark;
        }
    },

    // ============================================
    // INITIALIZATION HELPERS
    // ============================================

    /**
     * Set up global error handling
     */
    _setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (this.config.debug) {
                this.showToast('An unexpected error occurred', 'error');
            }
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled rejection:', event.reason);
            if (this.config.debug) {
                this.showToast('An unexpected error occurred', 'error');
            }
        });

        // Handle offline/online status
        window.addEventListener('online', () => {
            this.showToast('📶 Back online', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('📶 You are offline. Some features may be unavailable.', 'warning');
        });
    },

    /**
     * Initialize mobile menu
     */
    _initMobileMenu() {
        const menuBtn = document.getElementById('menuToggle');
        if (menuBtn) {
            menuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelector('.nav-links')?.classList.toggle('open');
            });
        }

        // Close menu on outside click
        document.addEventListener('click', function(e) {
            const nav = document.querySelector('.nav-links');
            const btn = document.getElementById('menuToggle');
            if (nav?.classList.contains('open')) {
                if (!nav.contains(e.target) && !btn?.contains(e.target)) {
                    nav.classList.remove('open');
                }
            }
        });
    },

    /**
     * Initialize navigation links
     */
    _initNavLinks() {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                document.querySelector('.nav-links')?.classList.remove('open');
            });
        });

        // Highlight active page
        const currentPage = this.state.currentPage;
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (href && currentPage.includes(href))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * Initialize page-specific logic
     */
    _initPage() {
        const page = this.state.currentPage;

        // Common page initializations
        switch (page) {
            case 'index.html':
            case '':
                this._initHomePage();
                break;
            case 'dashboard.html':
                this._initDashboardPage();
                break;
            case 'profile.html':
                this._initProfilePage();
                break;
            case 'settings.html':
                this._initSettingsPage();
                break;
            case 'courses.html':
                this._initCoursesPage();
                break;
            case 'course-detail.html':
                this._initCourseDetailPage();
                break;
        }
    },

    // ============================================
    // PAGE-SPECIFIC INITIALIZATION
    // ============================================

    _initHomePage() {
        // Home page specific logic
        if (this.config.debug) {
            console.log('🏠 Home page initialized');
        }
    },

    _initDashboardPage() {
        // Dashboard page specific logic
        if (this.config.debug) {
            console.log('📊 Dashboard page initialized');
        }
    },

    _initProfilePage() {
        // Profile page specific logic
        if (this.config.debug) {
            console.log('👤 Profile page initialized');
        }
    },

    _initSettingsPage() {
        // Settings page specific logic
        if (this.config.debug) {
            console.log('⚙️ Settings page initialized');
        }
    },

    _initCoursesPage() {
        // Courses page specific logic
        if (this.config.debug) {
            console.log('📚 Courses page initialized');
        }
    },

    _initCourseDetailPage() {
        // Course detail page specific logic
        if (this.config.debug) {
            console.log('📖 Course detail page initialized');
        }
    },

    // ============================================
    // UTILITY
    // ============================================

    /**
     * Get current page name
     */
    getCurrentPage() {
        return this.state.currentPage;
    },

    /**
     * Check if debug mode is enabled
     */
    isDebug() {
        return this.config.debug;
    },

    /**
     * Get app version
     */
    getVersion() {
        return this.config.version;
    },

    /**
     * Reload page
     */
    reload() {
        window.location.reload();
    }
};

// ============================================
// DOM READY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize app
    App.init();

    // Expose App globally
    window.App = App;

    // Console notice
    console.log(`📚 ${App.config.appName} v${App.config.version}`);
    console.log(`🔧 Debug mode: ${App.config.debug ? 'ON' : 'OFF'}`);
});

// ============================================
// EXPOSE GLOBALS
// ============================================

window.App = App;

// Helper shortcut
window.$app = App;

console.log('🚀 App loaded successfully');
