// ============================================
// EDU CAM LAB - API CLIENT
// Production-ready API client with caching, retry, and error handling
// ============================================

class APIClient {
    constructor() {
        // Configuration
        this.baseURL = window.CONFIG?.API_URL || 'http://localhost:5000/api/v1';
        this.timeout = window.CONFIG?.API_TIMEOUT || 30000;
        this.maxRetries = window.CONFIG?.API_MAX_RETRIES || 3;
        this.retryDelay = window.CONFIG?.API_RETRY_DELAY || 1000;
        
        // Token management
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
        
        // Cache
        this.cache = new Map();
        this.cacheTTL = window.CONFIG?.API_CACHE_TTL || 60000;
        
        // Request tracking
        this.pendingRequests = new Map();
        this.isRefreshing = false;
        this.refreshSubscribers = [];
        
        // Bind methods
        this.request = this.request.bind(this);
        this.get = this.get.bind(this);
        this.post = this.post.bind(this);
        this.put = this.put.bind(this);
        this.delete = this.delete.bind(this);
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
        this.pendingRequests.clear();
    }

    isAuthenticated() {
        return !!this.token;
    }

    getTokenExpiry() {
        try {
            if (!this.token) return null;
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload.exp ? new Date(payload.exp * 1000) : null;
        } catch {
            return null;
        }
    }

    isTokenExpired() {
        const expiry = this.getTokenExpiry();
        if (!expiry) return true;
        return Date.now() >= expiry.getTime();
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

        // Add device info
        if (window.Utils) {
            const device = Utils.getDeviceType();
            headers['X-Device-Type'] = device;
            headers['X-Device-Info'] = navigator.userAgent;
        }

        return { ...headers, ...additional };
    }

    // ============================================
    // REQUEST HANDLING
    // ============================================

    async request(method, endpoint, data = null, options = {}) {
        const {
            cache = false,
            cacheKey = null,
            silent = false,
            retries = this.maxRetries,
            timeout = this.timeout,
            headers = {},
            signal = null,
            skipAuth = false
        } = options;

        // Check cache for GET requests
        if (method === 'GET' && cache) {
            const key = cacheKey || `${method}:${endpoint}:${JSON.stringify(data)}`;
            const cached = this.getCache(key);
            if (cached) {
                return cached;
            }
        }

        // Deduplicate pending requests
        const requestKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }

        const promise = this._executeRequest(method, endpoint, data, {
            silent,
            retries,
            timeout,
            headers,
            signal,
            skipAuth,
            requestKey
        });

        this.pendingRequests.set(requestKey, promise);
        promise.finally(() => {
            this.pendingRequests.delete(requestKey);
        });

        return promise;
    }

    async _executeRequest(method, endpoint, data, options) {
        const {
            silent,
            retries,
            timeout,
            headers,
            signal,
            skipAuth,
            requestKey
        } = options;

        let lastError = null;
        let attempt = 0;

        while (attempt <= retries) {
            try {
                const url = `${this.baseURL}${endpoint}`;
                const fetchOptions = {
                    method,
                    headers: this.getHeaders(headers),
                    credentials: 'include',
                    signal: signal || this._createTimeoutSignal(timeout)
                };

                if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                    fetchOptions.body = JSON.stringify(data);
                }

                const response = await fetch(url, fetchOptions);

                // Handle token refresh
                if (response.status === 401 && !skipAuth) {
                    if (!this.isRefreshing) {
                        this.isRefreshing = true;
                        try {
                            await this._refreshToken();
                            this._notifyRefreshSubscribers();
                        } catch (refreshError) {
                            this._handleAuthFailure();
                            throw refreshError;
                        } finally {
                            this.isRefreshing = false;
                        }
                    } else {
                        await this._waitForRefresh();
                    }
                    
                    // Retry with new token
                    const retryResponse = await fetch(url, {
                        ...fetchOptions,
                        headers: this.getHeaders(headers)
                    });
                    return await this._handleResponse(retryResponse);
                }

                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || 5;
                    await Utils.wait(retryAfter * 1000);
                    attempt++;
                    continue;
                }

                return await this._handleResponse(response);

            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                if (attempt < retries) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    await Utils.wait(delay);
                    attempt++;
                    continue;
                }
                break;
            }
        }

        if (!silent) {
            console.error('API Request Error:', lastError);
        }
        throw lastError || new Error('Request failed');
    }

    // ============================================
    // RESPONSE HANDLING
    // ============================================

    async _handleResponse(response) {
        const contentType = response.headers.get('content-type');
        
        // Handle non-JSON responses
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server error: ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        // Handle API error responses
        if (!response.ok) {
            const error = new Error(data.message || `Server error (${response.status})`);
            error.status = response.status;
            error.code = data.code;
            error.errors = data.errors;
            throw error;
        }

        return data;
    }

    // ============================================
    // TOKEN REFRESH
    // ============================================

    async _refreshToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.refreshToken}`
                },
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success && data.data.token) {
                this.setToken(data.data.token);
                if (data.data.refreshToken) {
                    this.setRefreshToken(data.data.refreshToken);
                }
                return data.data.token;
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            this._handleAuthFailure();
            throw error;
        }
    }

    _handleAuthFailure() {
        this.clearToken();
        if (window.Auth) {
            Auth.setUserData(null);
        }
        // Don't auto-redirect, let the caller handle it
    }

    _notifyRefreshSubscribers() {
        this.refreshSubscribers.forEach(callback => {
            try {
                callback(this.token);
            } catch (e) {
                console.error('Refresh subscriber error:', e);
            }
        });
        this.refreshSubscribers = [];
    }

    _waitForRefresh() {
        return new Promise((resolve) => {
            if (this.token) {
                resolve(this.token);
            } else {
                this.refreshSubscribers.push((token) => resolve(token));
            }
        });
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const { data, timestamp } = cached;
        if (Date.now() - timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        
        return data;
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

    invalidateCache(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    // ============================================
    // TIMEOUT HANDLING
    // ============================================

    _createTimeoutSignal(timeout) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeout);
        return controller.signal;
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

    async patch(endpoint, data, options = {}) {
        return this.request('PATCH', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    async login(phone, password) {
        try {
            const result = await this.post('/auth/login', { phone, password }, { skipAuth: true });
            
            if (result.success && result.data?.token) {
                this.setToken(result.data.token);
                if (result.data.refreshToken) {
                    this.setRefreshToken(result.data.refreshToken);
                }
                if (result.data.user && window.Auth) {
                    Auth.setUserData(result.data.user);
                }
                // Invalidate cache after login
                this.clearCache();
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithPin(phone, pin) {
        try {
            const result = await this.post('/auth/login-pin', { phone, pin }, { skipAuth: true });
            
            if (result.success && result.data?.token) {
                this.setToken(result.data.token);
                if (result.data.refreshToken) {
                    this.setRefreshToken(result.data.refreshToken);
                }
                if (result.data.user && window.Auth) {
                    Auth.setUserData(result.data.user);
                }
                this.clearCache();
            }
            
            return result;
        } catch (error) {
            console.error('PIN login error:', error);
            throw error;
        }
    }

    async register(userData) {
        return this.post('/auth/register', userData, { skipAuth: true });
    }

    async verifyOTP(phone, code) {
        return this.post('/auth/verify-otp', { phone, code }, { skipAuth: true });
    }

    async resendOTP(phone) {
        return this.post('/auth/resend-otp', { phone }, { skipAuth: true });
    }

    async forgotPassword(phone) {
        return this.post('/auth/forgot-password', { phone }, { skipAuth: true });
    }

    async resetPassword(phone, newPassword, token = '') {
        return this.post('/auth/reset-password', { phone, newPassword, token }, { skipAuth: true });
    }

    async getProfile() {
        return this.get('/auth/me', {}, { cache: true });
    }

    async updateProfile(data) {
        const result = await this.put('/auth/me', data);
        this.invalidateCache('/auth/me');
        return result;
    }

    async changePassword(data) {
        return this.put('/auth/change-password', data);
    }

    async logout() {
        try {
            await this.post('/auth/logout', {}, { silent: true });
        } catch (error) {
            console.warn('Logout error:', error);
        }
        this.clearToken();
        this.clearCache();
        if (window.Auth) {
            Auth.setUserData(null);
        }
    }

    // ============================================
    // USER ENDPOINTS
    // ============================================

    async getUser() {
        return this.get('/users/me', {}, { cache: true });
    }

    async updateUser(data) {
        const result = await this.put('/users/me', data);
        this.invalidateCache('/users/me');
        return result;
    }

    async deleteAccount() {
        const result = await this.delete('/users/me');
        this.clearCache();
        return result;
    }

    async getDashboardStats() {
        return this.get('/users/dashboard/stats', {}, { cache: true });
    }

    async getMyPins() {
        return this.get('/users/pins', {}, { cache: true });
    }

    async getMyActivities(params = {}) {
        return this.get('/users/activities', params, { cache: true });
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

    async getCourseById(id) {
        return this.get(`/courses/${id}`, {}, { cache: true });
    }

    async getCategories() {
        return this.get('/courses/categories', {}, { cache: true });
    }

    async getLevels() {
        return this.get('/courses/levels', {}, { cache: true });
    }

    async enrollInCourse(courseId) {
        const result = await this.post(`/courses/${courseId}/enroll`);
        this.invalidateCache('/courses/user');
        this.invalidateCache('/users/dashboard');
        return result;
    }

    async updateProgress(courseId, progress) {
        const result = await this.put(`/courses/${courseId}/progress`, { progress });
        this.invalidateCache('/courses/user');
        this.invalidateCache('/users/dashboard');
        return result;
    }

    async getUserCourses() {
        return this.get('/courses/user/enrolled', {}, { cache: true });
    }

    async getCourseProgress(courseId) {
        return this.get(`/courses/user/progress/${courseId}`, {}, { cache: true });
    }

    // ============================================
    // REVIEW ENDPOINTS
    // ============================================

    async getCourseReviews(courseId, params = {}) {
        return this.get(`/courses/${courseId}/reviews`, params, { cache: true });
    }

    async createReview(courseId, rating, comment) {
        const result = await this.post(`/courses/${courseId}/reviews`, { rating, comment });
        this.invalidateCache(`/courses/${courseId}/reviews`);
        return result;
    }

    async updateReview(courseId, reviewId, rating, comment) {
        const result = await this.put(`/courses/${courseId}/reviews/${reviewId}`, { rating, comment });
        this.invalidateCache(`/courses/${courseId}/reviews`);
        return result;
    }

    async deleteReview(courseId, reviewId) {
        const result = await this.delete(`/courses/${courseId}/reviews/${reviewId}`);
        this.invalidateCache(`/courses/${courseId}/reviews`);
        return result;
    }

    // ============================================
    // PAYMENT ENDPOINTS
    // ============================================

    async requestPayment(plan) {
        return this.post('/payments/request', { plan });
    }

    async getPaymentStatus(transactionId) {
        return this.get(`/payments/status/${transactionId}`, {}, { cache: true });
    }

    async getUserPayments() {
        return this.get('/payments/user', {}, { cache: true });
    }

    async verifyPayment(reference) {
        return this.post('/payments/verify', { reference });
    }

    // ============================================
    // CONTACT ENDPOINTS
    // ============================================

    async submitContact(data) {
        return this.post('/contact', data, { skipAuth: true });
    }

    // ============================================
    // ADMIN ENDPOINTS (Protected)
    // ============================================

    async getAdminDashboard() {
        return this.get('/admin/dashboard', {}, { cache: true });
    }

    async getAdminUsers(params = {}) {
        return this.get('/admin/users', params);
    }

    async getAdminCourses(params = {}) {
        return this.get('/admin/courses', params);
    }

    async getAdminPayments(params = {}) {
        return this.get('/admin/payments', params);
    }

    async updateUserByAdmin(userId, data) {
        return this.put(`/admin/users/${userId}`, data);
    }

    async deleteUserByAdmin(userId) {
        return this.delete(`/admin/users/${userId}`);
    }

    // ============================================
    // UTILITY
    // ============================================

    /**
     * Check if API is reachable
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: this._createTimeoutSignal(5000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get API version
     * @returns {Promise<string>}
     */
    async getVersion() {
        try {
            const result = await this.get('/version', {}, { skipAuth: true, silent: true });
            return result.data?.version || 'unknown';
        } catch {
            return 'unknown';
        }
    }
}

// ============================================
// INSTANTIATE & EXPORT
// ============================================

const API = new APIClient();
window.API = API;

// Console notice
console.log('📚 API Client initialized');
console.log(`📋 Base URL: ${API.baseURL}`);
console.log(`🔐 Authenticated: ${API.isAuthenticated() ? 'Yes' : 'No'}`);
console.log(`⏱️  Cache TTL: ${API.cacheTTL / 1000}s`);
