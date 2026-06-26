// js/login.js - Login Page (Phone-Based)
// ============================================
// EDU CAM LAB - LOGIN PAGE
// Complete login functionality with phone and PIN
// ============================================

// ============================================
// PARTICLES BACKGROUND
// ============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 3 + 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 20 + 15) + 's';
        particle.style.animationDelay = (Math.random() * 15) + 's';
        container.appendChild(particle);
    }
}
createParticles();

// ============================================
// LOGIN METHOD SWITCH
// ============================================
let currentLoginMethod = 'phone';

function switchLoginMethod(method) {
    currentLoginMethod = method;
    
    document.querySelectorAll('.login-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
    
    document.getElementById('phoneLogin').style.display = method === 'phone' ? 'block' : 'none';
    document.getElementById('pinLogin').style.display = method === 'pin' ? 'block' : 'none';
    
    const container = document.getElementById('messageContainer');
    if (container) container.innerHTML = '';
}

// ============================================
// PASSWORD VISIBILITY TOGGLE
// ============================================
function togglePassword() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    const icon = document.getElementById('passwordIcon');
    if (!icon) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
    passwordInput.focus();
}

// ============================================
// SOCIAL LOGIN
// ============================================
function socialLogin(provider) {
    const container = document.getElementById('messageContainer');
    showMessage(
        container,
        'info',
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`
    );
}

// ============================================
// CHECK IF ALREADY LOGGED IN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (API.token) {
        API.getProfile()
            .then(result => {
                if (result.success) {
                    Auth.setUserData(result.data);
                    Auth.redirectAfterLogin('dashboard.html');
                } else {
                    API.clearToken();
                }
            })
            .catch(() => {
                API.clearToken();
            });
    }
});

// ============================================
// HANDLE LOGIN
// ============================================
let loginAttempts = 0;
const maxLoginAttempts = 5;
let lockoutTime = 0;
const lockoutDuration = 5 * 60 * 1000;

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const container = document.getElementById('messageContainer');
        const btn = document.getElementById('loginBtn');
        const phoneInput = currentLoginMethod === 'phone' ? 
            document.getElementById('phoneNumber') : 
            document.getElementById('pinPhoneNumber');

        if (!phoneInput) return;

        const phone = phoneInput.value.trim();

        if (container) container.innerHTML = '';

        // Check lockout
        if (loginAttempts >= maxLoginAttempts) {
            const timeLeft = Math.ceil((lockoutTime + lockoutDuration - Date.now()) / 60000);
            if (timeLeft > 0) {
                showMessage(container, 'error',
                    `Too many failed attempts. Please wait ${timeLeft} minute${timeLeft > 1 ? 's' : ''} before trying again.`
                );
                return;
            } else {
                loginAttempts = 0;
                lockoutTime = 0;
            }
        }

        if (!phone) {
            showMessage(container, 'error', 'Please enter your phone number.');
            phoneInput.focus();
            return;
        }

        if (currentLoginMethod === 'phone') {
            const passwordInput = document.getElementById('password');
            if (!passwordInput) return;
            const password = passwordInput.value;

            if (!password) {
                showMessage(container, 'error', 'Please enter your password.');
                passwordInput.focus();
                return;
            }

            if (password.length < 8) {
                showMessage(container, 'error', 'Password must be at least 8 characters.');
                passwordInput.focus();
                return;
            }

            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Signing in...';

            try {
                const result = await API.login(phone, password);

                if (result.success) {
                    if (result.data?.user) {
                        Auth.setUserData(result.data.user);
                    }
                    
                    loginAttempts = 0;
                    lockoutTime = 0;
                    
                    showMessage(container, 'success', 'Welcome back! Redirecting...');
                    
                    setTimeout(() => {
                        Auth.redirectAfterLogin('dashboard.html');
                    }, 1000);
                } else {
                    loginAttempts++;
                    lockoutTime = Date.now();
                    const attemptsLeft = maxLoginAttempts - loginAttempts;
                    const msg = result.message || 'Invalid credentials';
                    showMessage(container, 'error',
                        `${msg} (${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining)`
                    );
                    
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage(container, 'error', error.message || 'Login failed. Please try again.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } else {
            // PIN Login
            const pinInput = document.getElementById('pinCode');
            if (!pinInput) return;
            const pin = pinInput.value.trim();

            if (!pin) {
                showMessage(container, 'error', 'Please enter your PIN.');
                pinInput.focus();
                return;
            }

            if (pin.length !== 6) {
                showMessage(container, 'error', 'PIN must be 6 characters.');
                pinInput.focus();
                return;
            }

            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Verifying PIN...';

            try {
                const result = await API.loginWithPin(phone, pin);

                if (result.success) {
                    if (result.data?.user) {
                        Auth.setUserData(result.data.user);
                    }
                    
                    loginAttempts = 0;
                    lockoutTime = 0;
                    
                    showMessage(container, 'success', 'PIN verified! Redirecting...');
                    
                    setTimeout(() => {
                        Auth.redirectAfterLogin('dashboard.html');
                    }, 1000);
                } else {
                    loginAttempts++;
                    lockoutTime = Date.now();
                    const attemptsLeft = maxLoginAttempts - loginAttempts;
                    const msg = result.message || 'Invalid PIN';
                    showMessage(container, 'error',
                        `${msg} (${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining)`
                    );
                    
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    pinInput.value = '';
                    pinInput.focus();
                }
            } catch (error) {
                console.error('PIN login error:', error);
                showMessage(container, 'error', error.message || 'PIN verification failed.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    });
});

// ============================================
// MESSAGE DISPLAY
// ============================================
function showMessage(container, type, message) {
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    const classes = {
        success: 'message-success',
        error: 'message-error',
        info: 'message-info',
        warning: 'message-info'
    };

    container.innerHTML = `
        <div class="message ${classes[type] || 'message-info'}" role="alert">
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// CONSOLE SECURITY NOTICE
// ============================================
console.log('%c🔐 SECURE LOGIN', 'font-size: 20px; font-weight: bold; color: #4f46e5;');
console.log('%c⚠️ This is a secure area. Do not share your credentials.', 'font-size: 14px; color: #6b7280;');
console.log('%c🛡️ All login attempts are monitored and logged.', 'font-size: 14px; color: #10b981;');

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.togglePassword = togglePassword;
window.socialLogin = socialLogin;
window.switchLoginMethod = switchLoginMethod;