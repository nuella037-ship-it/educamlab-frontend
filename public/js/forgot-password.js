// js/forgot-password.js - Forgot Password Page (Production Ready)
// ============================================
// EDU CAM LAB - FORGOT PASSWORD
// Complete password reset request functionality
// ============================================

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (Auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
});

// ============================================
// HANDLE FORGOT PASSWORD
// ============================================
async function handleForgotPassword(e) {
    e.preventDefault();

    const container = document.getElementById('messageContainer');
    const btn = document.getElementById('resetBtn');

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;

    try {
        const result = await API.forgotPassword();
        if (result.success) {
            const form = document.getElementById('forgotForm');
            const successState = document.getElementById('successState');
            if (form) form.style.display = 'none';
            if (successState) successState.style.display = 'block';
        } else {
            showMessage(container, 'error', result.message || 'Failed to send reset link');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        showMessage(container, 'error', error.message || 'Failed to send reset link');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ============================================
// RESEND RESET
// ============================================
function resendReset() {
    const form = document.getElementById('forgotForm');
    const successState = document.getElementById('successState');
    
    if (form) form.style.display = 'block';
    if (successState) successState.style.display = 'none';
    
    // Trigger form submission
    const event = new Event('submit');
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) forgotForm.dispatchEvent(event);
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

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.resendReset = resendReset;