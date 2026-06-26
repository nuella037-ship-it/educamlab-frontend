// admin/js/api.js - Admin API Client with Cash Payment Support
class APIClient {
    constructor() {
        this.baseURL = window.CONFIG?.API_URL || 'http://localhost:5000/api/v1';
        this.token = localStorage.getItem('adminToken');
        this.refreshToken = localStorage.getItem('adminRefreshToken');
        this.isRefreshing = false;
        this.failedQueue = [];
        this.cache = new Map();
        this.cacheTTL = 60000;
    }

    // ============================================
    // TOKEN MANAGEMENT
    // ============================================
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('adminToken', token);
        } else {
            localStorage.removeItem('adminToken');
        }
        window.dispatchEvent(new CustomEvent('tokenChanged', { detail: { token } }));
    }

    setRefreshToken(token) {
        this.refreshToken = token;
        if (token) {
            localStorage.setItem('adminRefreshToken', token);
        } else {
            localStorage.removeItem('adminRefreshToken');
        }
    }

    clearToken() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        this.clearCache();
        window.dispatchEvent(new CustomEvent('authLogout'));
        window.location.href = 'login.html';
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================
    getCacheKey(endpoint, params = {}) {
        return `${endpoint}:${JSON.stringify(params)}`;
    }

    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // ============================================
    // REQUEST HEADERS
    // ============================================
    getHeaders(additional = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return { ...headers, ...additional };
    }

    // ============================================
    // TOKEN REFRESH
    // ============================================
    async refreshTokenRequest() {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            const data = await response.json();
            
            if (data.success && data.data.token) {
                this.setToken(data.data.token);
                if (data.data.refreshToken) {
                    this.setRefreshToken(data.data.refreshToken);
                }
                this.failedQueue.forEach(promise => promise.resolve());
                this.failedQueue = [];
                return data.data.token;
            } else {
                throw new Error('Refresh token expired');
            }
        } catch (error) {
            this.failedQueue.forEach(promise => promise.reject(error));
            this.failedQueue = [];
            this.clearToken();
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    // ============================================
    // REQUEST HANDLING
    // ============================================
    async request(method, endpoint, data = null, options = {}) {
        const {
            cache = false,
            cacheKey = null,
            silent = false
        } = options;

        if (method === 'GET' && cache) {
            const key = cacheKey || this.getCacheKey(endpoint, data);
            const cached = this.getCached(key);
            if (cached) {
                return cached;
            }
        }

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
                if (this.refreshToken && !this.isRefreshing) {
                    try {
                        await this.refreshTokenRequest();
                        return this.request(method, endpoint, data, options);
                    } catch (refreshError) {
                        this.clearToken();
                        throw new Error('Session expired. Please login again.');
                    }
                } else {
                    this.clearToken();
                    throw new Error('Authentication required');
                }
            }

            const result = await this.handleResponse(response);
            
            if (method === 'GET' && cache && response.status === 200) {
                const key = cacheKey || this.getCacheKey(endpoint, data);
                this.setCache(key, result);
            }

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
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
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
        return this.request('GET', `${endpoint}${queryString}`, null, {
            cache: true,
            ...options
        });
    }

    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, { cache: false, ...options });
    }

    async put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, { cache: false, ...options });
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, { cache: false, ...options });
    }

    // ============================================
    // AUTH ENDPOINTS (Phone-Based)
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
                    localStorage.setItem('adminName', data.data.user.firstname || 'Admin');
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
                    localStorage.setItem('adminName', data.data.user.firstname || 'Admin');
                }
            }
            
            return data;
        } catch (error) {
            console.error('PIN login error:', error);
            throw error;
        }
    }

    async getProfile() {
        return this.get('/auth/me', {}, { 
            cache: true, 
            cacheKey: 'adminProfile',
            cacheTTL: 30000 
        });
    }

    // ============================================
    // USER ENDPOINTS
    // ============================================
    async getUsers(params = {}) {
        return this.get('/admin/users', params, { cache: true });
    }

    async getUser(id) {
        return this.get(`/admin/users/${id}`, {}, { 
            cache: true, 
            cacheKey: `adminUser_${id}` 
        });
    }

    async getUserByPhone(phone) {
        return this.get(`/admin/users/phone/${phone}`, {}, { 
            cache: true, 
            cacheKey: `adminUser_phone_${phone}` 
        });
    }

    async createUser(data) {
        this.clearCache();
        return this.post('/admin/users', data);
    }

    async updateUser(id, data) {
        this.clearCache();
        return this.put(`/admin/users/${id}`, data);
    }

    async updateUserRole(id, role) {
        this.clearCache();
        return this.put(`/admin/users/${id}/role`, { role });
    }

    async updateUserVerification(id, verified) {
        this.clearCache();
        return this.put(`/admin/users/${id}/verify`, { verified });
    }

    async deleteUser(id) {
        this.clearCache();
        return this.delete(`/admin/users/${id}`);
    }

    // ============================================
    // COURSE ENDPOINTS
    // ============================================
    async getCourses(params = {}) {
        return this.get('/admin/courses', params, { cache: true });
    }

    async getCourseById(id) {
        return this.get(`/courses/${id}`, {}, { 
            cache: true, 
            cacheKey: `course_${id}` 
        });
    }

    async createCourse(courseData) {
        this.clearCache();
        return this.post('/admin/courses', courseData);
    }

    async updateCourse(id, courseData) {
        this.clearCache();
        return this.put(`/admin/courses/${id}`, courseData);
    }

    async deleteCourse(id) {
        this.clearCache();
        return this.delete(`/admin/courses/${id}`);
    }

    // ============================================
    // CONTACT MESSAGES
    // ============================================
    async getMessages(params = {}) {
        return this.get('/admin/messages', params, { cache: true });
    }

    async getMessage(id) {
        return this.get(`/admin/messages/${id}`, {}, { 
            cache: true, 
            cacheKey: `adminMessage_${id}` 
        });
    }

    async updateMessageStatus(id, status) {
        this.clearCache();
        return this.put(`/admin/messages/${id}/status`, { status });
    }

    async replyMessage(id, reply) {
        this.clearCache();
        return this.post(`/admin/messages/${id}/reply`, { reply });
    }

    async deleteMessage(id) {
        this.clearCache();
        return this.delete(`/admin/messages/${id}`);
    }

    // ============================================
    // PAYMENT ENDPOINTS (Cash Only)
    // ============================================
    async getPayments(params = {}) {
        return this.get('/admin/payments', params, { cache: true });
    }

    async getPaymentStats() {
        return this.get('/admin/payments/stats', {}, { 
            cache: true, 
            cacheKey: 'adminPaymentStats' 
        });
    }

    async generatePinForUser(data) {
        this.clearCache();
        return this.post('/admin/payments/generate-pin', data);
    }

    async revokePin(userId) {
        this.clearCache();
        return this.post(`/admin/payments/revoke-pin/${userId}`);
    }

    async getUserPins(userId) {
        return this.get(`/admin/payments/pins/user/${userId}`, {}, { cache: true });
    }

    async getAllPins(params = {}) {
        return this.get('/admin/payments/pins/all', params, { cache: true });
    }

    async deletePayment(id) {
        this.clearCache();
        return this.delete(`/admin/payments/${id}`);
    }

    // ============================================
    // SMS ENDPOINTS
    // ============================================
    async sendPinSms(phone, pin) {
        this.clearCache();
        return this.post('/admin/sms/send-pin', { phone, pin });
    }

    async sendSmsBatch(data) {
        this.clearCache();
        return this.post('/admin/sms/batch', data);
    }

    async getSmsStats() {
        return this.get('/admin/sms/stats', {}, { cache: true });
    }

    // ============================================
    // ACTIVITY ENDPOINTS
    // ============================================
    async getActivities(params = {}) {
        return this.get('/admin/activities', params, { cache: true });
    }

    async getActivityStats() {
        return this.get('/admin/activities/stats', {}, { 
            cache: true, 
            cacheKey: 'adminActivityStats' 
        });
    }

    async clearActivities() {
        this.clearCache();
        return this.delete('/admin/activities/clear');
    }

    // ============================================
    // DASHBOARD ENDPOINTS
    // ============================================
    async getDashboardStats() {
        return this.get('/admin/dashboard/stats', {}, { 
            cache: true, 
            cacheKey: 'adminDashboardStats',
            cacheTTL: 30000 
        });
    }

    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================
    async getSettings(type) {
        return this.get(`/admin/settings/${type}`, {}, { cache: true });
    }

    async updateSettings(type, data) {
        this.clearCache();
        return this.put(`/admin/settings/${type}`, data);
    }

    async updateProfile(data) {
        this.clearCache();
        return this.put('/auth/me', data);
    }

    async changePassword(data) {
        this.clearCache();
        return this.put('/auth/change-password', data);
    }

    // ============================================
    // BROADCAST ENDPOINTS
    // ============================================
    async sendBroadcast(data) {
        this.clearCache();
        return this.post('/admin/broadcast', data);
    }

    async getBroadcastHistory(params = {}) {
        return this.get('/admin/broadcast/history', params, { cache: true });
    }

    async cancelBroadcast(id) {
        this.clearCache();
        return this.delete(`/admin/broadcast/${id}`);
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

    isTokenExpired() {
        const expiry = this.getTokenExpiry();
        return expiry ? expiry < new Date() : true;
    }
}

const API = new APIClient();
window.API = API;

console.log('🔐 Admin API Client initialized');
console.log(`📋 Authenticated: ${API.isAuthenticated() ? 'Yes' : 'No'}`);
console.log(`💰 Payment Mode: Cash Only`);