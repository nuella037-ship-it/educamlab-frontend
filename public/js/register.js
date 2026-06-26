// js/register.js - Registration Page (Phone-Based Only)
// ============================================
// EDU CAM LAB - REGISTRATION PAGE
// Complete registration functionality with phone-based auth
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
// PASSWORD VISIBILITY TOGGLE
// ============================================
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const icon = document.getElementById(fieldId === 'password' ? 'passwordIcon' : 'confirmPasswordIcon');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
    input.focus();
}

// ============================================
// SHOW MESSAGE
// ============================================
function showMessage(container, type, message) {
    if (!container) return;

    const icons = {
        error: 'fa-exclamation-circle',
        success: 'fa-check-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    const classes = {
        error: 'message-error',
        success: 'message-success',
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
// REAL-TIME VALIDATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const firstnameInput = document.getElementById('firstname');
    const lastnameInput = document.getElementById('lastname');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');

    // Phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 9);
            const hint = document.getElementById('phoneHint');
            if (!hint) return;
            
            if (this.value.length > 0 && this.value.length < 9) {
                this.classList.add('error');
                this.classList.remove('success');
                hint.innerHTML = '<i class="fas fa-exclamation-circle"></i> Phone number must be 9 digits';
                hint.className = 'form-hint error';
            } else if (this.value.length === 9) {
                this.classList.remove('error');
                this.classList.add('success');
                hint.innerHTML = '<i class="fas fa-check-circle"></i> Valid phone number';
                hint.className = 'form-hint success';
            } else {
                this.classList.remove('error', 'success');
                hint.innerHTML = '<i class="fas fa-info-circle"></i> Enter your 9-digit phone number';
                hint.className = 'form-hint';
            }
        });
    }

    // Name validation
    [firstnameInput, lastnameInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', function() {
            if (this.value.length >= 2) {
                this.classList.add('success');
                this.classList.remove('error');
            } else if (this.value.length > 0) {
                this.classList.add('error');
                this.classList.remove('success');
            } else {
                this.classList.remove('error', 'success');
            }
        });
    });

    // Password strength checker
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const bars = document.querySelectorAll('#passwordStrength .bar');
            const label = document.getElementById('strengthLabel');
            const hint = document.getElementById('passwordHint');
            
            let strength = 0;
            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;
            
            bars.forEach((bar, index) => {
                bar.className = 'bar';
                if (index < strength) {
                    bar.classList.add('active');
                    if (strength <= 2) bar.classList.add('weak');
                    else if (strength === 3) bar.classList.add('medium');
                    else bar.classList.add('strong');
                }
            });
            
            if (password.length === 0) {
                if (label) label.textContent = '';
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-info-circle"></i> Minimum 8 characters with uppercase, lowercase, and numbers';
                    hint.className = 'form-hint';
                }
            } else if (strength <= 2) {
                if (label) {
                    label.textContent = 'Weak password';
                    label.className = 'password-strength-label weak';
                }
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-exclamation-circle"></i> Add uppercase, numbers, or special characters';
                    hint.className = 'form-hint error';
                }
            } else if (strength === 3) {
                if (label) {
                    label.textContent = 'Medium password';
                    label.className = 'password-strength-label medium';
                }
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-check-circle"></i> Good password strength';
                    hint.className = 'form-hint success';
                }
            } else {
                if (label) {
                    label.textContent = 'Strong password!';
                    label.className = 'password-strength-label strong';
                }
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-check-circle"></i> Excellent password strength';
                    hint.className = 'form-hint success';
                }
            }
            
            if (confirmInput && confirmInput.value) {
                checkPasswordMatch();
            }
        });
    }

    // Confirm password validation
    if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
    }

    function checkPasswordMatch() {
        const password = passwordInput ? passwordInput.value : '';
        const confirm = confirmInput ? confirmInput.value : '';
        const hint = document.getElementById('confirmHint');
        if (!hint) return;
        
        if (confirm.length === 0) {
            hint.innerHTML = '<i class="fas fa-info-circle"></i> Passwords must match';
            hint.className = 'form-hint';
            if (confirmInput) {
                confirmInput.classList.remove('error', 'success');
            }
            return;
        }
        
        if (password === confirm) {
            hint.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
            hint.className = 'form-hint success';
            if (confirmInput) {
                confirmInput.classList.add('success');
                confirmInput.classList.remove('error');
            }
        } else {
            hint.innerHTML = '<i class="fas fa-exclamation-circle"></i> Passwords do not match';
            hint.className = 'form-hint error';
            if (confirmInput) {
                confirmInput.classList.add('error');
                confirmInput.classList.remove('success');
            }
        }
    }

    // Terms checkbox
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                this.style.outline = 'none';
            }
        });
    }
});

// ============================================
// HANDLE REGISTRATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const firstnameInput = document.getElementById('firstname');
        const lastnameInput = document.getElementById('lastname');
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password');
        const confirmInput = document.getElementById('confirmPassword');
        const termsCheckbox = document.getElementById('terms');
        
        const container = document.getElementById('messageContainer');
        const btn = document.getElementById('registerBtn');

        if (!firstnameInput || !lastnameInput || !phoneInput || !passwordInput || !confirmInput) return;

        const firstname = firstnameInput.value.trim();
        const lastname = lastnameInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const terms = termsCheckbox ? termsCheckbox.checked : false;

        if (container) container.innerHTML = '';

        if (firstname.length < 2) {
            showMessage(container, 'error', 'Please enter your first name (minimum 2 characters)');
            firstnameInput.focus();
            return;
        }

        if (lastname.length < 2) {
            showMessage(container, 'error', 'Please enter your last name (minimum 2 characters)');
            lastnameInput.focus();
            return;
        }

        if (phone.length !== 9) {
            showMessage(container, 'error', 'Please enter a valid 9-digit phone number');
            phoneInput.focus();
            return;
        }

        if (password.length < 8) {
            showMessage(container, 'error', 'Password must be at least 8 characters');
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            showMessage(container, 'error', 'Passwords do not match');
            confirmInput.focus();
            return;
        }

        if (!terms) {
            showMessage(container, 'error', 'Please agree to the Terms of Service and Privacy Policy');
            if (termsCheckbox) termsCheckbox.focus();
            return;
        }

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Creating Account...';

        try {
            const result = await API.register({
                firstname,
                lastname,
                phone,
                password
            });

            if (result.success) {
                showMessage(container, 'success', 
                    'Account created successfully! You can now login.'
                );
                
                if (result.data && result.data.userId) {
                    localStorage.setItem('pendingUserId', result.data.userId);
                }

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2500);
            } else {
                showMessage(container, 'error', result.message || 'Registration failed. Please try again.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage(container, 'error', error.message || 'Registration failed. Please try again.');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !e.target.closest('.modal')) {
        const form = document.getElementById('registerForm');
        if (form) form.reset();
        const firstInput = document.getElementById('firstname');
        if (firstInput) firstInput.focus();
        const container = document.getElementById('messageContainer');
        if (container) container.innerHTML = '';
        document.querySelectorAll('.form-group input').forEach(input => {
            input.classList.remove('error', 'success');
        });
        document.querySelectorAll('#passwordStrength .bar').forEach(bar => {
            bar.className = 'bar';
        });
        const label = document.getElementById('strengthLabel');
        if (label) label.textContent = '';
    }
});

// ============================================
// CONSOLE SECURITY NOTICE
// ============================================
console.log('%c🔐 SECURE REGISTRATION', 'font-size: 20px; font-weight: bold; color: #4f46e5;');
console.log('%c📝 Create your EduCamLab account securely.', 'font-size: 14px; color: #6b7280;');
console.log('%c🛡️ All data is encrypted and protected.', 'font-size: 14px; color: #10b981;');

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.togglePassword = togglePassword;
window.showMessage = showMessage;
