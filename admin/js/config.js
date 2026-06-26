// admin/js/config.js - Admin Configuration
window.ENV = {
    API_URL: 'https://educamlab-api.onrender.com/api/v1',
    ADMIN_URL: 'https://educamlab-frontend.onrender.com/admin',
    APP_NAME: 'EduCamLab',
    APP_VERSION: '2.0.0'
};

const CONFIG = {
    API_URL: window.ENV.API_URL,
    ADMIN_URL: window.ENV.ADMIN_URL,
    APP_NAME: window.ENV.APP_NAME,
    APP_VERSION: window.ENV.APP_VERSION,
    CURRENCY: 'XAF',
    CURRENCY_SYMBOL: 'FCFA',
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    CACHE_TTL: 60000,
    PIN_LENGTH: 6,
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
    }
};

window.CONFIG = CONFIG;

console.log(`🔐 ${CONFIG.APP_NAME} Admin v${CONFIG.APP_VERSION}`);
console.log(`🔗 API: ${CONFIG.API_URL}`);
console.log(`💱 Currency: ${CONFIG.CURRENCY} (${CONFIG.CURRENCY_SYMBOL})`);
