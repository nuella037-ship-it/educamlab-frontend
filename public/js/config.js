// ============================================
// EDU CAM LAB - CONFIGURATION
// Central configuration for the entire application
// ============================================

/**
 * Environment configuration
 * Override these values based on the environment (development, staging, production)
 */
window.ENV = window.ENV || {
    // API Configuration
    API_URL: 'https://educamlab-api.onrender.com/api/v1',
    APP_URL: 'https://educamlab-frontend.onrender.com',
    
    // App Information
    APP_NAME: 'EduCamLab',
    APP_VERSION: '2.0.0',
    APP_DESCRIPTION: 'Cameroon Exam Preparation Platform',
    
    // Environment
    ENVIRONMENT: 'production', // 'development' | 'staging' | 'production'
    DEBUG: false,
    
    // Feature Flags
    FEATURES: {
        enableDarkMode: true,
        enableSocialLogin: false,
        enableAnalytics: true,
        enableOfflineMode: false,
        enablePWA: false
    }
};

// ============================================
// MAIN CONFIGURATION
// ============================================

const CONFIG = {
    // ============================================
    // APP SETTINGS
    // ============================================
    APP: {
        name: window.ENV.APP_NAME || 'EduCamLab',
        version: window.ENV.APP_VERSION || '2.0.0',
        description: window.ENV.APP_DESCRIPTION || 'Cameroon Exam Preparation Platform',
        url: window.ENV.APP_URL || window.location.origin,
        environment: window.ENV.ENVIRONMENT || 'production',
        debug: window.ENV.DEBUG || false
    },

    // ============================================
    // API SETTINGS
    // ============================================
    API: {
        url: window.ENV.API_URL || 'http://localhost:5000/api/v1',
        timeout: 30000, // 30 seconds
        maxRetries: 3,
        retryDelay: 1000,
        cacheTTL: 60000 // 1 minute
    },

    // ============================================
    // CURRENCY SETTINGS
    // ============================================
    CURRENCY: {
        code: 'XAF',
        symbol: 'FCFA',
        locale: 'en-US',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    },

    // ============================================
    // SUBSCRIPTION PLANS
    // ============================================
    PLANS: {
        daily: {
            id: 'daily',
            label: 'Daily',
            price: 150,
            duration: 1,
            durationLabel: '1 day',
            icon: '🌞',
            popular: false
        },
        weekly: {
            id: 'weekly',
            label: 'Weekly',
            price: 800,
            duration: 7,
            durationLabel: '7 days',
            icon: '📅',
            popular: false
        },
        monthly: {
            id: 'monthly',
            label: 'Monthly',
            price: 2500,
            duration: 30,
            durationLabel: '30 days',
            icon: '📆',
            popular: true
        },
        annual: {
            id: 'annual',
            label: 'Annual',
            price: 15000,
            duration: 365,
            durationLabel: '365 days',
            icon: '🎯',
            popular: false,
            savings: 40 // Percentage savings
        }
    },

    // ============================================
    // COURSE SETTINGS
    // ============================================
    COURSES: {
        perPage: 12,
        levels: {
            'o-level': {
                label: 'O Level',
                icon: '📘',
                color: '#10b981'
            },
            'a-level': {
                label: 'A Level',
                icon: '📗',
                color: '#3b82f6'
            },
            'bacc': {
                label: 'BACC',
                icon: '📕',
                color: '#f59e0b'
            },
            'bepc': {
                label: 'BEPC',
                icon: '📙',
                color: '#ef4444'
            },
            'technical': {
                label: 'Technical GCE',
                icon: '⚙️',
                color: '#8b5cf6'
            }
        },
        categories: {
            'past-questions': '📄 Past Questions',
            'pamphlets': '📚 Revision Pamphlets',
            'quizzes': '🧪 Interactive Quizzes',
            'courses': '📖 Full Courses'
        },
        difficulty: {
            beginner: { label: 'Beginner', icon: '🟢', level: 1 },
            intermediate: { label: 'Intermediate', icon: '🟡', level: 2 },
            advanced: { label: 'Advanced', icon: '🔴', level: 3 },
            'all-levels': { label: 'All Levels', icon: '🟣', level: 0 }
        }
    },

    // ============================================
    // AUTHENTICATION SETTINGS
    // ============================================
    AUTH: {
        pinLength: 6,
        passwordMinLength: 8,
        tokenKey: 'token',
        refreshTokenKey: 'refreshToken',
        userDataKey: 'userData',
        rememberMeKey: 'savedPhone',
        sessionTimeout: 86400000, // 24 hours
        maxLoginAttempts: 5,
        lockoutDuration: 300000 // 5 minutes
    },

    // ============================================
    // VALIDATION RULES
    // ============================================
    VALIDATION: {
        phone: {
            pattern: /^\d{9}$/,
            message: 'Please enter a valid 9-digit phone number'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecial: true
        },
        pin: {
            length: 6,
            pattern: /^[A-Z0-9]{6}$/,
            message: 'PIN must be exactly 6 characters (letters and numbers)'
        },
        name: {
            minLength: 2,
            maxLength: 50
        }
    },

    // ============================================
    // THEME SETTINGS
    // ============================================
    THEME: {
        defaultTheme: 'light',
        availableThemes: ['light', 'dark'],
        fontSize: {
            default: 16,
            sizes: [14, 16, 18, 20],
            labels: ['Small', 'Medium', 'Large', 'Extra Large']
        }
    },

    // ============================================
    // CONTACT SETTINGS
    // ============================================
    CONTACT: {
        email: 'support@educamlab.com',
        phone: '+237 654 122 717',
        whatsapp: '237654122717',
        hours: 'Monday - Friday, 8:00 AM - 6:00 PM',
        location: 'Yaoundé, Cameroon',
        responseTime: '24-48 hours'
    },

    // ============================================
    // SOCIAL LINKS
    // ============================================
    SOCIAL: {
        facebook: 'https://facebook.com/educamlab',
        twitter: 'https://twitter.com/educamlab',
        youtube: 'https://youtube.com/educamlab',
        linkedin: 'https://linkedin.com/company/educamlab',
        instagram: 'https://instagram.com/educamlab'
    },

    // ============================================
    // FEATURE FLAGS
    // ============================================
    FEATURES: {
        enableDarkMode: window.ENV.FEATURES?.enableDarkMode !== false,
        enableSocialLogin: window.ENV.FEATURES?.enableSocialLogin || false,
        enableAnalytics: window.ENV.FEATURES?.enableAnalytics !== false,
        enableOfflineMode: window.ENV.FEATURES?.enableOfflineMode || false,
        enablePWA: window.ENV.FEATURES?.enablePWA || false,
        enableWhatsAppRedirect: true
    },

    // ============================================
    // STORAGE KEYS
    // ============================================
    STORAGE: {
        token: 'token',
        refreshToken: 'refreshToken',
        userData: 'userData',
        savedPhone: 'savedPhone',
        theme: 'theme',
        fontSize: 'fontSize',
        studyMode: 'studyMode',
        dailyGoal: 'dailyGoal',
        pushNotifications: 'pushNotifications',
        studyReminders: 'studyReminders',
        emailUpdates: 'emailUpdates',
        registrationData: 'registrationData',
        verifyPhone: 'verifyPhone',
        resetPhone: 'resetPhone'
    },

    // ============================================
    // DEFAULT VALUES
    // ============================================
    DEFAULTS: {
        studyMode: 'regular',
        dailyGoal: 30,
        pushNotifications: true,
        studyReminders: false,
        emailUpdates: true,
        theme: 'light',
        fontSize: 16,
        perPage: 12
    },

    // ============================================
    // PAGINATION
    // ============================================
    PAGINATION: {
        perPage: 12,
        maxPages: 10,
        options: [12, 24, 48, 96]
    },

    // ============================================
    // DATE/TIME
    // ============================================
    DATETIME: {
        timezone: 'Africa/Douala',
        dateFormat: 'MMM DD, YYYY',
        timeFormat: 'HH:mm',
        dateTimeFormat: 'MMM DD, YYYY HH:mm'
    }
};

// ============================================
// DERIVED CONFIGURATIONS
// ============================================

// Plan utilities
CONFIG.getPlanById = function(id) {
    return this.PLANS[id] || null;
};

CONFIG.getPlanPrice = function(id) {
    const plan = this.getPlanById(id);
    return plan ? plan.price : null;
};

CONFIG.getPlanList = function() {
    return Object.values(this.PLANS);
};

CONFIG.getPlanLabels = function() {
    const labels = {};
    for (const [key, plan] of Object.entries(this.PLANS)) {
        labels[key] = plan.label;
    }
    return labels;
};

// Course utilities
CONFIG.getLevelLabel = function(level) {
    return this.COURSES.levels[level]?.label || level;
};

CONFIG.getLevelIcon = function(level) {
    return this.COURSES.levels[level]?.icon || '📚';
};

CONFIG.getCategoryLabel = function(category) {
    return this.COURSES.categories[category] || category;
};

// Currency formatting
CONFIG.formatCurrency = function(amount) {
    return new Intl.NumberFormat(this.CURRENCY.locale, {
        style: 'currency',
        currency: this.CURRENCY.code,
        minimumFractionDigits: this.CURRENCY.minimumFractionDigits,
        maximumFractionDigits: this.CURRENCY.maximumFractionDigits
    }).format(amount);
};

// Phone formatting
CONFIG.formatPhone = function(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return cleaned;
};

// WhatsApp URL
CONFIG.getWhatsAppUrl = function(message = '') {
    const number = this.CONTACT.whatsapp;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${number}${message ? `?text=${encodedMessage}` : ''}`;
};

// Check if plan is popular
CONFIG.isPlanPopular = function(id) {
    const plan = this.getPlanById(id);
    return plan ? plan.popular : false;
};

// ============================================
// ENVIRONMENT HELPERS
// ============================================

CONFIG.isDevelopment = function() {
    return this.APP.environment === 'development';
};

CONFIG.isProduction = function() {
    return this.APP.environment === 'production';
};

CONFIG.isStaging = function() {
    return this.APP.environment === 'staging';
};

CONFIG.isDebug = function() {
    return this.APP.debug;
};

// ============================================
// FEATURE CHECKS
// ============================================

CONFIG.hasFeature = function(feature) {
    return this.FEATURES[feature] === true;
};

// ============================================
// EXPOSE GLOBALLY
// ============================================

// Assign to window
window.CONFIG = CONFIG;

// Also expose ENV for backward compatibility
window.ENV = window.ENV || {};

// ============================================
// CONSOLE LOG
// ============================================

console.log(`📚 ${CONFIG.APP.name} v${CONFIG.APP.version}`);
console.log(`🔗 API: ${CONFIG.API.url}`);
console.log(`💱 Currency: ${CONFIG.CURRENCY.code} (${CONFIG.CURRENCY.symbol})`);
console.log(`🌍 Environment: ${CONFIG.APP.environment}`);
console.log(`🐛 Debug: ${CONFIG.isDebug() ? 'ON' : 'OFF'}`);
console.log(`📋 Plans: ${CONFIG.getPlanList().length} subscription plans configured`);

if (CONFIG.isDebug()) {
    console.log('🔧 Debug mode enabled - full config:', CONFIG);
}

// ============================================
// EXPORT (for module systems)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
