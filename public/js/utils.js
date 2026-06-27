// ============================================
// EDU CAM LAB - UTILITY FUNCTIONS
// Common utility functions used across the platform
// ============================================

const Utils = {
    // ============================================
    // TIME & DATE
    // ============================================

    /**
     * Get time ago string from date
     * @param {string|Date} date - Date to calculate from
     * @returns {string} Time ago string
     */
    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval + ' ' + unit + (interval > 1 ? 's' : '') + ' ago';
            }
        }
        return 'Just now';
    },

    /**
     * Get greeting based on time of day
     * @param {boolean} withEmoji - Include emoji in greeting
     * @returns {string} Greeting with or without emoji
     */
    getGreeting(withEmoji = true) {
        const hour = new Date().getHours();
        const greetings = {
            morning: { text: 'Good morning', emoji: '🌅' },
            afternoon: { text: 'Good afternoon', emoji: '☀️' },
            evening: { text: 'Good evening', emoji: '🌙' }
        };
        let greeting;
        if (hour < 12) greeting = greetings.morning;
        else if (hour < 17) greeting = greetings.afternoon;
        else greeting = greetings.evening;
        return withEmoji ? `${greeting.emoji} ${greeting.text}` : greeting.text;
    },

    /**
     * Get current formatted date
     * @param {string} format - 'full', 'short', 'iso', or 'custom'
     * @param {object} customOptions - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    getCurrentDate(format = 'full', customOptions = null) {
        const now = new Date();
        const options = {
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            iso: { year: 'numeric', month: '2-digit', day: '2-digit' }
        };
        const opts = customOptions || options[format] || options.full;
        return now.toLocaleDateString('en-US', opts);
    },

    /**
     * Get current formatted time
     * @param {boolean} withSeconds - Include seconds
     * @returns {string} Formatted time
     */
    getCurrentTime(withSeconds = false) {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: withSeconds ? '2-digit' : undefined
        });
    },

    // ============================================
    // FORMATTING
    // ============================================

    /**
     * Format phone number for display
     * @param {string} phone - Raw phone number
     * @param {string} format - 'space', 'dash', or 'none'
     * @returns {string} Formatted phone number
     */
    formatPhone(phone, format = 'space') {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 9) {
            if (format === 'space') {
                return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
            }
            if (format === 'dash') {
                return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3-$4-$5');
            }
            return cleaned;
        }
        return cleaned;
    },

    /**
     * Format phone for WhatsApp URL
     * @param {string} phone - Raw phone number
     * @param {string} countryCode - Country code (default: '237')
     * @returns {string} WhatsApp formatted number
     */
    formatPhoneForWhatsApp(phone, countryCode = '237') {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        return `${countryCode}${cleaned}`;
    },

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: 'XAF')
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, currency = 'XAF') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 100, suffix = '...') {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + suffix;
    },

    /**
     * Capitalize first letter of each word
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    },

    /**
     * Generate URL slug from string
     * @param {string} str - String to convert to slug
     * @returns {string} URL slug
     */
    generateSlug(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate phone number (9 digits)
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid
     */
    isValidPhone(phone) {
        if (!phone) return false;
        return /^\d{9}$/.test(phone.replace(/\D/g, ''));
    },

    /**
     * Validate password (min 8 characters)
     * @param {string} password - Password to validate
     * @param {number} minLength - Minimum length (default: 8)
     * @returns {boolean} True if valid
     */
    isValidPassword(password, minLength = 8) {
        return password && password.length >= minLength;
    },

    /**
     * Validate email
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Validate PIN (6 characters, alphanumeric)
     * @param {string} pin - PIN to validate
     * @returns {boolean} True if valid
     */
    isValidPin(pin) {
        if (!pin) return false;
        return /^[A-Z0-9]{6}$/.test(pin.toUpperCase());
    },

    // ============================================
    // PASSWORD STRENGTH
    // ============================================

    /**
     * Calculate password strength score (0-5)
     * @param {string} password - Password to check
     * @returns {number} Strength score (0-5)
     */
    getPasswordStrength(password) {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    },

    /**
     * Get password strength label and color
     * @param {string} password - Password to check
     * @returns {object} { label, class, color, score }
     */
    getPasswordStrengthInfo(password) {
        const score = this.getPasswordStrength(password);
        const levels = [
            { label: 'Enter a password', class: '', color: 'var(--text-muted)' },
            { label: 'Weak', class: 'weak', color: '#ef4444' },
            { label: 'Weak', class: 'weak', color: '#ef4444' },
            { label: 'Fair', class: 'medium', color: '#f59e0b' },
            { label: 'Good', class: 'medium', color: '#f59e0b' },
            { label: 'Strong', class: 'strong', color: '#10b981' }
        ];
        return { ...levels[Math.min(score, 5)], score };
    },

    // ============================================
    // CLIPBOARD & SHARING
    // ============================================

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<void>}
     */
    async copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback
        return new Promise((resolve, reject) => {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Share content using Web Share API
     * @param {object} data - { title, text, url }
     * @returns {Promise<void>}
     */
    async shareContent(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                }
                return false;
            }
        }
        // Fallback: Copy link to clipboard
        if (data.url) {
            await this.copyToClipboard(data.url);
            return true;
        }
        return false;
    },

    // ============================================
    // URL & NAVIGATION
    // ============================================

    /**
     * Get URL parameters as object
     * @returns {object} URL parameters
     */
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    /**
     * Get a specific URL parameter
     * @param {string} key - Parameter name
     * @param {string} defaultValue - Default value if not found
     * @returns {string} Parameter value
     */
    getUrlParam(key, defaultValue = null) {
        const params = this.getUrlParams();
        return params[key] || defaultValue;
    },

    /**
     * Update URL without reloading
     * @param {object} params - Parameters to update
     * @param {boolean} replace - Use replaceState instead of pushState
     */
    updateUrlParams(params, replace = false) {
        const url = new URL(window.location);
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        }
        const method = replace ? 'replaceState' : 'pushState';
        history[method](null, '', url);
    },

    // ============================================
    // SCROLLING
    // ============================================

    /**
     * Smooth scroll to element
     * @param {string|HTMLElement} element - Element or selector
     * @param {number} offset - Offset from top
     */
    scrollToElement(element, offset = 0) {
        if (!element) return;
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - offset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    },

    /**
     * Smooth scroll to top
     * @param {number} offset - Offset from top
     */
    scrollToTop(offset = 0) {
        window.scrollTo({ top: offset, behavior: 'smooth' });
    },

    // ============================================
    // PERFORMANCE
    // ============================================

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ============================================
    // DEVICE & THEME
    // ============================================

    /**
     * Detect device type
     * @returns {string} 'desktop', 'tablet', or 'mobile'
     */
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    },

    /**
     * Check if dark mode is enabled
     * @returns {boolean} True if dark mode
     */
    isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ||
               localStorage.getItem('theme') === 'dark';
    },

    /**
     * Toggle dark mode
     * @returns {boolean} New dark mode state
     */
    toggleDarkMode() {
        const isDark = this.isDarkMode();
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        return !isDark;
    },

    /**
     * Set dark mode state
     * @param {boolean} enabled - Enable or disable dark mode
     */
    setDarkMode(enabled) {
        if (enabled) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    },

    // ============================================
    // DOM HELPERS
    // ============================================

    /**
     * Create DOM element with attributes and children
     * @param {string} tag - HTML tag
     * @param {object} attrs - Attributes
     * @param {string|HTMLElement|Array} children - Child elements
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attrs = {}, children = null) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else {
                el.setAttribute(key, value);
            }
        }
        if (children) {
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (typeof child === 'string') {
                        el.appendChild(document.createTextNode(child));
                    } else if (child instanceof HTMLElement) {
                        el.appendChild(child);
                    }
                });
            } else if (typeof children === 'string') {
                el.innerHTML = children;
            } else if (children instanceof HTMLElement) {
                el.appendChild(children);
            }
        }
        return el;
    },

    /**
     * Safely get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    getElement(id) {
        return document.getElementById(id);
    },

    /**
     * Safely get elements by selector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     * @returns {NodeList} Matching elements
     */
    getElements(selector, parent = document) {
        return parent.querySelectorAll(selector);
    },

    // ============================================
    // STORAGE HELPERS
    // ============================================

    /**
     * Save data to localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success
     */
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    /**
     * Get data from localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or default
     */
    getStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success
     */
    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    // ============================================
    // COOKIE HELPERS
    // ============================================

    /**
     * Set a cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Days to expire
     */
    setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    },

    /**
     * Get a cookie
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value
     */
    getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    },

    /**
     * Delete a cookie
     * @param {string} name - Cookie name
     */
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    },

    // ============================================
    // RANDOM & ID GENERATION
    // ============================================

    /**
     * Generate random ID
     * @param {number} length - Length of ID
     * @param {string} prefix - Optional prefix
     * @returns {string} Random ID
     */
    generateId(length = 8, prefix = '') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // ============================================
    // WAIT & DELAY
    // ============================================

    /**
     * Wait for specified milliseconds
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Wait for DOM to be ready
     * @returns {Promise<void>}
     */
    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    },

    /**
     * Wait for an element to exist
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<HTMLElement>}
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                    return;
                }
                if (Date.now() - start > timeout) {
                    reject(new Error(`Element "${selector}" not found after ${timeout}ms`));
                    return;
                }
                setTimeout(check, 100);
            };
            check();
        });
    }
};

// ============================================
// EXPORT
// ============================================
window.Utils = Utils;

// Console notice
console.log('🛠️ Utils loaded successfully');
