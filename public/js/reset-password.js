// js/reset-password.js - Reset Password Page (Production Ready)
// ============================================
// EDU CAM LAB - RESET PASSWORD
// Complete password reset functionality
// ============================================

// ============================================
// GET TOKEN FROM URL
// ============================================
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (Auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    if (!token) {
        const container = document.getElementById('messageContainer');
        if (container) {
            container.innerHTML = `
                <div class="message message-error" role="alert">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Invalid or missing reset token. Please request a new password reset.</span>
                </div>
            `;
        }
        const form = document.getElementById('resetForm');
        if (form) form.style.display = 'none';
        return;
    }

    const tokenInput = document.getElementById('token');
    if (tokenInput) tokenInput.value = token;
    
    // Set up password validation
    setupPasswordValidation();
    
    // Set up form submission
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }
});

// ============================================
// PASSWORD STRENGTH
// ============================================
function setupPasswordValidation() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            const password = this.value;
            const bars = document.querySelectorAll('#passwordStrength .bar');
            const label = document.getElementById('strengthLabel');
            
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
                if (label) {
                    label.textContent = 'Minimum 8 characters';
                    label.style.color = '';
                }
            } else if (strength <= 2) {
                if (label) {
                    label.textContent = 'Weak password';
                    label.style.color = '#ef4444';
                }
            } else if (strength === 3) {
                if (label) {
                    label.textContent = 'Medium password';
                    label.style.color = '#f59e0b';
                }
            } else {
                if (label) {
                    label.textContent = 'Strong password!';
                    label.style.color = '#10b981';
                }
            }
            
            // Check confirm password match
            if (confirmPassword && confirmPassword.value) {
                checkPasswordMatch(password, confirmPassword.value);
            }
        });
    }

    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            const password = newPassword ? newPassword.value : '';
            checkPasswordMatch(password, this.value);
        });
    }
}

function checkPasswordMatch(password, confirm) {
    const hint = document.getElementById('confirmHint');
    if (!hint) return;
    
    if (confirm.length === 0) {
        hint.textContent = 'Passwords must match';
        hint.style.color = '';
        return;
    }
    if (password === confirm) {
        hint.textContent = '✓ Passwords match';
        hint.style.color = '#10b981';
    } else {
        hint.textContent = '✗ Passwords do not match';
        hint.style.color = '#ef4444';
    }
}

// ============================================
// RESET PASSWORD
// ============================================
async function handleResetPassword(e) {
    e.preventDefault();

    const tokenInput = document.getElementById('token');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const container = document.getElementById('messageContainer');
    const btn = document.getElementById('resetBtn');

    if (!tokenInput || !newPassword || !confirmPassword) return;

    const token = tokenInput.value;
    const newPass = newPassword.value;
    const confirmPass = confirmPassword.value;

    if (container) container.innerHTML = '';

    if (newPass !== confirmPass) {
        showMessage(container, 'error', 'Passwords do not match');
        return;
    }

    if (newPass.length < 8) {
        showMessage(container, 'error', 'Password must be at least 8 characters');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    btn.disabled = true;

    try {
        const result = await API.resetPassword(token, newPass);
        if (result.success) {
            showMessage(container, 'success', '✅ Password reset successfully!');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(container, 'error', result.message || 'Failed to reset password');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        showMessage(container, 'error', error.message || 'Failed to reset password');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ============================================
// MESSAGE DISPLAY
// ============================================
function showMessage(container, type, message) {
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    const classes = {
        success: 'message-success',
        error: 'message-error',
        info: 'message-info'
    };

    container.innerHTML = `
        <div class="message ${classes[type] || 'message-info'}" role="alert">
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;
}