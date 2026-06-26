// js/profile.js - Profile Page (Phone-Based)
// ============================================
// EDU CAM LAB - PROFILE PAGE
// Complete profile management with phone-based auth
// ============================================

// ============================================
// AUTH CHECK
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.requireAuth()) return;
    loadProfile();
});

// ============================================
// LOAD PROFILE
// ============================================
async function loadProfile() {
    try {
        const result = await API.getProfile();
        if (result.success) {
            const user = result.data;
            
            document.getElementById('firstname').value = user.firstname || '';
            document.getElementById('lastname').value = user.lastname || '';
            document.getElementById('phone').value = user.phone || '';
            
            // Load PIN
            await loadPinStatus();
            
            Auth.setUserData(user);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

// ============================================
// LOAD PIN STATUS
// ============================================
async function loadPinStatus() {
    try {
        const result = await API.getMyPins();
        if (result.success) {
            const pins = result.data || [];
            const activePin = pins.find(p => p.is_active);
            
            const pinDisplay = document.getElementById('userPinDisplay');
            const pinBadge = document.getElementById('pinStatusBadge');
            
            if (activePin) {
                if (pinDisplay) pinDisplay.textContent = activePin.code;
                if (pinBadge) {
                    pinBadge.textContent = '✅ Active';
                    pinBadge.style.background = '#d1fae5';
                    pinBadge.style.color = '#065f46';
                }
            } else {
                if (pinDisplay) pinDisplay.textContent = 'No PIN';
                if (pinBadge) {
                    pinBadge.textContent = '⏳ Inactive';
                    pinBadge.style.background = '#fef3c7';
                    pinBadge.style.color = '#92400e';
                }
            }
        }
    } catch (error) {
        console.error('Error loading PIN status:', error);
    }
}

// ============================================
// UPDATE PROFILE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;

    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstname = document.getElementById('firstname');
        const lastname = document.getElementById('lastname');
        
        if (!firstname || !lastname) return;

        const data = {
            firstname: firstname.value.trim(),
            lastname: lastname.value.trim()
        };

        const btn = this.querySelector('button[type="submit"]');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const result = await API.updateProfile(data);
            if (result.success) {
                showToast('Profile updated successfully!', 'success');
                loadProfile();
            } else {
                showToast(result.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});

// ============================================
// CHANGE PASSWORD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('passwordForm');
    if (!passwordForm) return;

    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (!currentPassword || !newPassword || !confirmPassword) return;

        if (newPassword.value !== confirmPassword.value) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.value.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        const btn = this.querySelector('button[type="submit"]');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
        btn.disabled = true;

        try {
            const result = await API.changePassword({ 
                currentPassword: currentPassword.value, 
                newPassword: newPassword.value 
            });
            if (result.success) {
                showToast('Password changed successfully!', 'success');
                this.reset();
            } else {
                showToast(result.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to change password', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.showToast = showToast;
window.loadProfile = loadProfile;
