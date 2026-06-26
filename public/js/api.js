// public/js/api.js - Public API Client
class APIClient {
    constructor() {
        this.baseURL = window.CONFIG?.API_URL || 'http://localhost:5000/api/v1';
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.cache = new Map();
        this.cacheTTL = 60000;
    }

    // ============================================
    // TOKEN MANAGEMENT
    // ============================================
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    setRefreshToken(token) {
        this.refreshToken = token;
        if (token) {
            localStorage.setItem('refreshToken', token);
        } else {
            localStorage.removeItem('refreshToken');
        }
    }

    clearToken() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        this.cache.clear();
        window.location.href = 'login.html';
    }

    // ============================================
    // REQUEST HEADERS
    // ============================================
    getHeaders(additional = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return { ...headers, ...additional };
    }

    // ============================================
    // REQUEST HANDLING
    // ============================================
    async request(method, endpoint, data = null, options = {}) {
        const {
            cache = false,
            silent = false
        } = options;

        try {
            const url = `${this.baseURL}${endpoint}`;
            const fetchOptions = {
                method,
                headers: this.getHeaders(),
                credentials: 'include'
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                fetchOptions.body = JSON.stringify(data);
            }

            const response = await fetch(url, fetchOptions);

            if (response.status === 401) {
                this.clearToken();
                throw new Error('Session expired. Please login again.');
            }

            const result = await this.handleResponse(response);
            return result;

        } catch (error) {
            if (!silent) {
                console.error('API Request Error:', error);
            }
            throw error;
        }
    }

    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server error: ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Server error (${response.status})`);
        }

        return data;
    }

    // ============================================
    // HTTP METHODS
    // ============================================
    async get(endpoint, params = {}, options = {}) {
        const queryString = Object.keys(params).length > 0 
            ? `?${new URLSearchParams(params).toString()}` 
            : '';
        return this.request('GET', `${endpoint}${queryString}`, null, options);
    }

    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    // ============================================
    // AUTH ENDPOINTS
    // ============================================
    async login(phone, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success && data.data.token) {
                this.setToken(data.data.token);
                if (data.data.refreshToken) {
                    this.setRefreshToken(data.data.refreshToken);
                }
                if (data.data.user) {
                    Auth.setUserData(data.data.user);
                }
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithPin(phone, pin) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, pin }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success && data.data.token) {
                this.setToken(data.data.token);
                if (data.data.refreshToken) {
                    this.setRefreshToken(data.data.refreshToken);
                }
                if (data.data.user) {
                    Auth.setUserData(data.data.user);
                }
            }
            
            return data;
        } catch (error) {
            console.error('PIN login error:', error);
            throw error;
        }
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async verifyOTP(userId, code) {
        return this.post('/auth/verify-otp', { userId, code });
    }

    async resendOTP(userId) {
        return this.post('/auth/resend-otp', { userId });
    }

    async getProfile() {
        return this.get('/auth/me', {}, { cache: true });
    }

    async updateProfile(data) {
        return this.put('/auth/me', data);
    }

    async changePassword(data) {
        return this.put('/auth/change-password', data);
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        this.clearToken();
        Auth.setUserData(null);
        window.location.href = 'login.html';
    }

    // ============================================
    // COURSE ENDPOINTS
    // ============================================
    async getCourses(params = {}) {
        return this.get('/courses', params, { cache: true });
    }

    async getFeaturedCourses() {
        return this.get('/courses/featured', {}, { cache: true });
    }

    async getCourseBySlug(slug) {
        return this.get(`/courses/${slug}`, {}, { cache: true });
    }

    async getCategories() {
        return this.get('/courses/categories', {}, { cache: true });
    }

    async getLevels() {
        return this.get('/courses/levels', {}, { cache: true });
    }

    async enrollInCourse(courseId) {
        return this.post(`/courses/${courseId}/enroll`);
    }

    async updateProgress(courseId, progress) {
        return this.put(`/courses/${courseId}/progress`, { progress });
    }

    async getUserCourses() {
        return this.get('/courses/user/enrolled');
    }

    async getCourseProgress(courseId) {
        return this.get(`/courses/user/progress/${courseId}`);
    }

    // ============================================
    // REVIEW ENDPOINTS
    // ============================================
    async getCourseReviews(courseId, params = {}) {
        return this.get(`/courses/${courseId}/reviews`, params, { cache: true });
    }

    async createReview(courseId, rating, comment) {
        return this.post(`/courses/${courseId}/reviews`, { rating, comment });
    }

    async updateReview(courseId, reviewId, rating, comment) {
        return this.put(`/courses/${courseId}/reviews/${reviewId}`, { rating, comment });
    }

    async deleteReview(courseId, reviewId) {
        return this.delete(`/courses/${courseId}/reviews/${reviewId}`);
    }

    // ============================================
    // PAYMENT ENDPOINTS (Cash Only)
    // ============================================
    async requestPayment(plan) {
        return this.post('/payments/request', { plan });
    }

    async getPaymentStatus(transactionId) {
        return this.get(`/payments/status/${transactionId}`);
    }

    async getUserPayments() {
        return this.get('/payments/user');
    }

    // ============================================
    // CONTACT ENDPOINTS
    // ============================================
    async submitContact(data) {
        return this.post('/contact', data);
    }

    // ============================================
    // USER DASHBOARD
    // ============================================
    async getDashboardStats() {
        return this.get('/users/dashboard/stats');
    }

    // ============================================
    // UTILITY
    // ============================================
    isAuthenticated() {
        return !!this.token;
    }

    getTokenExpiry() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload.exp ? new Date(payload.exp * 1000) : null;
        } catch {
            return null;
        }
    }
}

const API = new APIClient();
window.API = API;

console.log('📚 Public API Client initialized');
console.log(`📋 Authenticated: ${API.isAuthenticated() ? 'Yes' : 'No'}`);