// ============================================
// EDU CAM LAB - AUTHENTICATION HELPER
// Production-ready auth with token management, user state, and role checks
// ============================================

const Auth = {
    // ============================================
    // CONFIGURATION
    // ============================================
    _config: {
        tokenKey: 'token',
        refreshTokenKey: 'refreshToken',
        userKey: 'userData',
        userNameKey: 'userName',
        userPhoneKey: 'userPhone',
        userRoleKey: 'userRole',
        userEmailKey: 'userEmail',
        userAvatarKey: 'userAvatar',
        rememberMeKey: 'savedPhone',
        redirectKey: 'redirectAfterLogin'
    },

    // ============================================
    // TOKEN MANAGEMENT
    // ============================================

    /**
     * Get authentication token
     * @returns {string|null} Token or null
     */
    getToken() {
        return localStorage.getItem(this._config.tokenKey);
    },

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        if (token) {
            localStorage.setItem(this._config.tokenKey, token);
        } else {
            localStorage.removeItem(this._config.tokenKey);
        }
    },

    /**
     * Get refresh token
     * @returns {string|null} Refresh token or null
     */
    getRefreshToken() {
        return localStorage.getItem(this._config.refreshTokenKey);
    },

    /**
     * Set refresh token
     * @param {string} token - Refresh token
     */
    setRefreshToken(token) {
        if (token) {
            localStorage.setItem(this._config.refreshTokenKey, token);
        } else {
            localStorage.removeItem(this._config.refreshTokenKey);
        }
    },

    /**
     * Clear all tokens
     */
    clearTokens() {
        localStorage.removeItem(this._config.tokenKey);
        localStorage.removeItem(this._config.refreshTokenKey);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Check if token is expired
     * @returns {boolean} True if expired
     */
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp) {
                return Date.now() >= payload.exp * 1000;
            }
            return false;
        } catch {
            return true;
        }
    },

    /**
     * Get token expiration date
     * @returns {Date|null} Expiration date or null
     */
    getTokenExpiry() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp ? new Date(payload.exp * 1000) : null;
        } catch {
            return null;
        }
    },

    // ============================================
    // USER DATA MANAGEMENT
    // ============================================

    /**
     * Set user data
     * @param {object} user - User object
     */
    setUserData(user) {
        if (user) {
            localStorage.setItem(this._config.userKey, JSON.stringify(user));
            
            // Store individual fields for quick access
            if (user.firstname) {
                localStorage.setItem(this._config.userNameKey, 
                    `${user.firstname} ${user.lastname || ''}`.trim()
                );
            }
            if (user.phone) {
                localStorage.setItem(this._config.userPhoneKey, user.phone);
            }
            if (user.email) {
                localStorage.setItem(this._config.userEmailKey, user.email);
            }
            if (user.role) {
                localStorage.setItem(this._config.userRoleKey, user.role);
            }
            if (user.avatar || user.profilePicture) {
                localStorage.setItem(this._config.userAvatarKey, user.avatar || user.profilePicture);
            }
        } else {
            this.clearUserData();
        }
    },

    /**
     * Get full user data
     * @returns {object|null} User object or null
     */
    getUserData() {
        try {
            const data = localStorage.getItem(this._config.userKey);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    /**
     * Get user name
     * @returns {string} User name
     */
    getUserName() {
        return localStorage.getItem(this._config.userNameKey) || 'Student';
    },

    /**
     * Get user phone
     * @returns {string} User phone
     */
    getUserPhone() {
        return localStorage.getItem(this._config.userPhoneKey) || '';
    },

    /**
     * Get user email
     * @returns {string} User email
     */
    getUserEmail() {
        return localStorage.getItem(this._config.userEmailKey) || '';
    },

    /**
     * Get user role
     * @returns {string|null} User role or null
     */
    getUserRole() {
        return localStorage.getItem(this._config.userRoleKey) || null;
    },

    /**
     * Get user avatar
     * @returns {string|null} User avatar URL or null
     */
    getUserAvatar() {
        return localStorage.getItem(this._config.userAvatarKey) || null;
    },

    /**
     * Get user initials for avatar
     * @returns {string} User initials (max 2 chars)
     */
    getUserInitials() {
        const name = this.getUserName();
        if (!name || name === 'Student') return 'S';
        
        const parts = name.split(' ').filter(p => p.length > 0);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * Clear all user data
     */
    clearUserData() {
        localStorage.removeItem(this._config.userKey);
        localStorage.removeItem(this._config.userNameKey);
        localStorage.removeItem(this._config.userPhoneKey);
        localStorage.removeItem(this._config.userEmailKey);
        localStorage.removeItem(this._config.userRoleKey);
        localStorage.removeItem(this._config.userAvatarKey);
        localStorage.removeItem(this._config.rememberMeKey);
    },

    // ============================================
    // ROLE CHECKS
    // ============================================

    /**
     * Check if user has admin role
     * @returns {boolean} True if admin
     */
    isAdmin() {
        const role = this.getUserRole();
        return role === 'admin' || role === 'super_admin';
    },

    /**
     * Check if user is super admin
     * @returns {boolean} True if super admin
     */
    isSuperAdmin() {
        return this.getUserRole() === 'super_admin';
    },

    /**
     * Check if user has specific role
     * @param {string|array} roles - Role(s) to check
     * @returns {boolean} True if user has role
     */
    hasRole(roles) {
        const userRole = this.getUserRole();
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    },

    /**
     * Check if user is a student (non-admin)
     * @returns {boolean} True if student
     */
    isStudent() {
        return !this.isAdmin() && this.isAuthenticated();
    },

    // ============================================
    // REDIRECT MANAGEMENT
    // ============================================

    /**
     * Redirect after successful login
     * @param {string} fallback - Fallback URL
     */
    redirectAfterLogin(fallback = 'dashboard.html') {
        const redirect = sessionStorage.getItem(this._config.redirectKey);
        sessionStorage.removeItem(this._config.redirectKey);
        window.location.href = redirect || fallback;
    },

    /**
     * Set redirect URL for after login
     * @param {string} url - URL to redirect to
     */
    setRedirectUrl(url) {
        if (url) {
            sessionStorage.setItem(this._config.redirectKey, url);
        }
    },

    /**
     * Get redirect URL
     * @returns {string|null} Redirect URL or null
     */
    getRedirectUrl() {
        return sessionStorage.getItem(this._config.redirectKey);
    },

    /**
     * Clear redirect URL
     */
    clearRedirectUrl() {
        sessionStorage.removeItem(this._config.redirectKey);
    },

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    /**
     * Check if session is valid
     * @returns {boolean} True if session is valid
     */
    hasValidSession() {
        if (!this.isAuthenticated()) return false;
        if (this.isTokenExpired()) {
            // Try to refresh token
            if (this.getRefreshToken()) {
                // Token refresh will be handled by API interceptor
                return true;
            }
            return false;
        }
        return true;
    },

    /**
     * Get session info
     * @returns {object} Session information
     */
    getSessionInfo() {
        return {
            authenticated: this.isAuthenticated(),
            tokenExpiry: this.getTokenExpiry(),
            user: this.getUserData(),
            role: this.getUserRole()
        };
    },

    // ============================================
    // REMEMBER ME
    // ============================================

    /**
     * Save phone for "Remember Me"
     * @param {string} phone - Phone number
     */
    rememberPhone(phone) {
        if (phone) {
            localStorage.setItem(this._config.rememberMeKey, phone);
        }
    },

    /**
     * Get saved phone for "Remember Me"
     * @returns {string|null} Saved phone or null
     */
    getRememberedPhone() {
        return localStorage.getItem(this._config.rememberMeKey);
    },

    /**
     * Clear saved phone
     */
    clearRememberedPhone() {
        localStorage.removeItem(this._config.rememberMeKey);
    },

    // ============================================
    // LOGOUT
    // ============================================

    /**
     * Logout user
     * @param {boolean} redirect - Whether to redirect to login
     * @param {string} redirectUrl - URL to redirect to
     */
    async logout(redirect = true, redirectUrl = 'login.html') {
        try {
            // Clear local data
            this.clearTokens();
            this.clearUserData();
            
            // Clear any session storage
            sessionStorage.removeItem(this._config.redirectKey);
            
            // Notify API if available
            if (typeof API !== 'undefined' && API.logout) {
                try {
                    await API.logout();
                } catch (e) {
                    // Silent fail - already logged out locally
                }
            }
            
            // Notify App if available
            if (typeof App !== 'undefined') {
                App.state.user = null;
            }
            
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout anyway
            this.clearTokens();
            this.clearUserData();
        }
        
        if (redirect) {
            window.location.href = redirectUrl;
        }
    },

    /**
     * Force logout (no API call)
     */
    forceLogout(redirectUrl = 'login.html') {
        this.clearTokens();
        this.clearUserData();
        sessionStorage.removeItem(this._config.redirectKey);
        
        if (typeof App !== 'undefined') {
            App.state.user = null;
        }
        
        window.location.href = redirectUrl;
    },

    // ============================================
    // AUTH GUARDS
    // ============================================

    /**
     * Require authentication - redirects to login if not authenticated
     * @param {string} redirectUrl - URL to redirect to
     * @returns {boolean} True if authenticated
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            this.setRedirectUrl(currentPage);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    /**
     * Require guest - redirects to dashboard if authenticated
     * @param {string} redirectUrl - URL to redirect to
     * @returns {boolean} True if guest
     */
    requireGuest(redirectUrl = 'dashboard.html') {
        if (this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    /**
     * Require admin - redirects if not admin
     * @param {string} redirectUrl - URL to redirect to
     * @returns {boolean} True if admin
     */
    requireAdmin(redirectUrl = 'dashboard.html') {
        if (!this.isAdmin()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    // ============================================
    // UTILITY
    // ============================================

    /**
     * Get auth headers for API requests
     * @returns {object} Headers object
     */
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    },

    /**
     * Refresh token (uses API)
     * @returns {Promise<object>} Refresh result
     */
    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            if (typeof API !== 'undefined') {
                const result = await API.post('/auth/refresh', { refreshToken });
                if (result.success && result.data?.token) {
                    this.setToken(result.data.token);
                    if (result.data.refreshToken) {
                        this.setRefreshToken(result.data.refreshToken);
                    }
                    return result;
                }
                throw new Error('Failed to refresh token');
            }
            throw new Error('API not available');
        } catch (error) {
            this.forceLogout();
            throw error;
        }
    },

    /**
     * Sync user data with API
     * @returns {Promise<object>} User data
     */
    async syncUser() {
        if (!this.isAuthenticated()) return null;
        
        try {
            if (typeof API !== 'undefined' && API.getProfile) {
                const result = await API.getProfile();
                if (result.success && result.data) {
                    this.setUserData(result.data);
                    return result.data;
                }
            }
            return this.getUserData();
        } catch (error) {
            console.error('Failed to sync user:', error);
            return this.getUserData();
        }
    },

    /**
     * Check if user has PIN assigned
     * @returns {boolean} True if user has PIN
     */
    hasPin() {
        const user = this.getUserData();
        return user && (user.hasActivePin || user.pin !== undefined);
    },

    /**
     * Get user's active PIN (if available)
     * @returns {string|null} PIN or null
     */
    getActivePin() {
        const user = this.getUserData();
        return user?.pin || null;
    }
};

// ============================================
// EXPOSE GLOBALLY
// ============================================

window.Auth = Auth;

// Alias for convenience
window.$auth = Auth;

// ============================================
// AUTO-INIT
// ============================================

// Auto-sync user data on page load if authenticated
document.addEventListener('DOMContentLoaded', function() {
    if (Auth.isAuthenticated()) {
        // Check if token is expired
        if (Auth.isTokenExpired() && Auth.getRefreshToken()) {
            // Token refresh will be handled by API interceptor
            console.log('🔄 Token expired, refresh will be attempted on next API call');
        }
        
        // Log auth status
        console.log(`🔐 Authenticated as: ${Auth.getUserName()}`);
        console.log(`👤 Role: ${Auth.getUserRole() || 'Student'}`);
    } else {
        console.log('🔓 Not authenticated');
    }
});

console.log('🔐 Auth helper initialized');
