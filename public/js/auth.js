// public/js/auth.js - Public Authentication Helper
const Auth = {
    // ============================================
    // USER DATA MANAGEMENT
    // ============================================
    setUserData(user) {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userName', user.firstname || 'User');
            localStorage.setItem('userPhone', user.phone || '');
            if (user.role) {
                localStorage.setItem('userRole', user.role);
            }
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('userName');
            localStorage.removeItem('userPhone');
            localStorage.removeItem('userRole');
        }
    },

    getUserData() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    getUserName() {
        return localStorage.getItem('userName') || 'User';
    },

    getUserPhone() {
        return localStorage.getItem('userPhone') || '';
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    // ============================================
    // ROLE CHECK
    // ============================================
    isAdmin() {
        const role = localStorage.getItem('userRole');
        return role === 'admin' || role === 'super_admin';
    },

    // ============================================
    // REDIRECT
    // ============================================
    redirectAfterLogin(fallback = 'dashboard.html') {
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirect;
        } else {
            window.location.href = fallback;
        }
    },

    // ============================================
    // LOGOUT
    // ============================================
    logout() {
        this.setUserData(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
};

// Make Auth available globally
window.Auth = Auth;

console.log('🔐 Auth helper initialized');