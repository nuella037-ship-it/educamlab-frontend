// public/js/config.js - Frontend Configuration
window.ENV = {
    API_URL: 'https://educamlab-api.onrender.com/api/v1',
    APP_URL: 'https://educamlab-frontend.onrender.com',
    APP_NAME: 'EduCamLab',
    APP_VERSION: '2.0.0'
};

const CONFIG = {
    API_URL: window.ENV.API_URL,
    APP_URL: window.ENV.APP_URL,
    APP_NAME: window.ENV.APP_NAME,
    APP_VERSION: window.ENV.APP_VERSION,
    CURRENCY: 'XAF',
    CURRENCY_SYMBOL: 'FCFA',
    PLAN_PRICES: {
        daily: 150,
        weekly: 800,
        monthly: 2500,
        annual: 15000
    },
    PLAN_LABELS: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        annual: 'Annual'
    },
    PLAN_DURATIONS: {
        daily: 1,
        weekly: 7,
        monthly: 30,
        annual: 365
    },
    PIN_LENGTH: 6,
    COURSE_LEVELS: {
        beginner: '🟢 Beginner',
        intermediate: '🟡 Intermediate',
        advanced: '🔴 Advanced',
        'all-levels': '🟣 All Levels'
    }
};

window.CONFIG = CONFIG;

console.log(`📚 ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`);
console.log(`🔗 API: ${CONFIG.API_URL}`);
console.log(`💱 Currency: ${CONFIG.CURRENCY} (${CONFIG.CURRENCY_SYMBOL})`);
