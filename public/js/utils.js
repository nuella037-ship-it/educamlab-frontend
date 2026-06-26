// js/utils.js - Utility Functions
// ============================================
// EDU CAM LAB - UTILITY FUNCTIONS
// Common utility functions used across the platform
// ============================================

const Utils = {
    // ============================================
    // TIME AGO
    // ============================================
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

    // ============================================
    // FORMAT PHONE NUMBER
    // ============================================
    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 9) {
            return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        }
        return cleaned;
    },

    // ============================================
    // FORMAT CURRENCY
    // ============================================
    formatCurrency(amount, currency = 'XAF') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    // ============================================
    // TRUNCATE TEXT
    // ============================================
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // ============================================
    // CAPITALIZE WORDS
    // ============================================
    capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    },

    // ============================================
    // GENERATE SLUG
    // ============================================
    generateSlug(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    // ============================================
    // VALIDATE PHONE
    // ============================================
    isValidPhone(phone) {
        return /^\d{9}$/.test(phone.replace(/\D/g, ''));
    },

    // ============================================
    // VALIDATE PASSWORD
    // ============================================
    isValidPassword(password) {
        return password.length >= 8;
    },

    // ============================================
    // GET PASSWORD STRENGTH
    // ============================================
    getPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    },

    // ============================================
    // GET PASSWORD STRENGTH LABEL
    // ============================================
    getPasswordStrengthLabel(password) {
        const strength = this.getPasswordStrength(password);
        if (strength <= 2) return { label: 'Weak', class: 'weak' };
        if (strength === 3) return { label: 'Medium', class: 'medium' };
        return { label: 'Strong', class: 'strong' };
    },

    // ============================================
    // COPY TO CLIPBOARD
    // ============================================
    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise((resolve, reject) => {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
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

    // ============================================
    // GET URL PARAMETERS
    // ============================================
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    // ============================================
    // SCROLL TO ELEMENT
    // ============================================
    scrollToElement(element, offset = 0) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - offset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    },

    // ============================================
    // DEBOUNCE
    // ============================================
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

    // ============================================
    // THROTTLE
    // ============================================
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
    // GET GREETING
    // ============================================
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    },

    // ============================================
    // GET CURRENT DATE
    // ============================================
    getCurrentDate(format = 'full') {
        const now = new Date();
        const options = {
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            iso: { year: 'numeric', month: '2-digit', day: '2-digit' }
        };
        return now.toLocaleDateString('en-US', options[format] || options.full);
    },

    // ============================================
    // GET CURRENT TIME
    // ============================================
    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // ============================================
    // DETECT DEVICE TYPE
    // ============================================
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

    // ============================================
    // IS DARK MODE
    // ============================================
    isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ||
               localStorage.getItem('theme') === 'dark';
    },

    // ============================================
    // TOGGLE DARK MODE
    // ============================================
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
    }
};

// Make globally available
window.Utils = Utils;

console.log('🛠️ Utils loaded');