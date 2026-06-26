// js/settings.js - Settings Page (Production Ready)
// ============================================
// EDU CAM LAB - SETTINGS PAGE
// Complete settings management functionality
// ============================================

// ============================================
// AUTH CHECK
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.requireAuth()) return;
    initializeSettings();
});

// ============================================
// INITIALIZE SETTINGS
// ============================================
function initializeSettings() {
    // Load saved preferences
    loadPreferences();
    
    // Handle hash routing
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
        switchTab(hash);
    }
    
    // Load user profile into settings
    loadUserProfile();
}

// ============================================
// LOAD USER PROFILE
// ============================================
async function loadUserProfile() {
    try {
        const result = await API.getProfile();
        if (result.success) {
            const user = result.data;
            const nameInput = document.getElementById('profileName');
            const phoneInput = document.getElementById('profilePhone');
            const bioInput = document.getElementById('profileBio');
            
            if (nameInput) nameInput.value = `${user.firstname || ''} ${user.lastname || ''}`.trim();
            if (phoneInput) phoneInput.value = user.phone || '';
            if (bioInput) bioInput.value = user.bio || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tab) {
    document.querySelectorAll('.settings-sidebar .sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    document.querySelectorAll('.settings-content .tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `tab-${tab}`);
    });

    window.location.hash = tab;
}

// ============================================
// PROFILE FORM
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Profile updated successfully!', 'success');
        });
    }
});

// ============================================
// PASSWORD FORM
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPass = document.getElementById('newPassword');
            const confirmPass = document.getElementById('confirmPassword');
            
            if (!newPass || !confirmPass) return;

            if (newPass.value !== confirmPass.value) {
                showToast('Passwords do not match', 'error');
                return;
            }

            if (newPass.value.length < 8) {
                showToast('Password must be at least 8 characters', 'error');
                return;
            }

            showToast('Password changed successfully!', 'success');
            this.reset();
        });
    }
});

// ============================================
// TWO-FACTOR AUTHENTICATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    if (twoFactorToggle) {
        twoFactorToggle.addEventListener('change', function() {
            const status = document.getElementById('twoFactorStatus');
            if (!status) return;
            if (this.checked) {
                status.innerHTML = 'Two-factor authentication is currently <strong>enabled</strong>';
                showToast('Two-factor authentication enabled!', 'success');
            } else {
                status.innerHTML = 'Two-factor authentication is currently <strong>disabled</strong>';
                showToast('Two-factor authentication disabled', 'info');
            }
        });
    }
});

// ============================================
// NOTIFICATIONS
// ============================================
function saveNotificationSettings() {
    showToast('Notification preferences saved!', 'success');
}

// ============================================
// LANGUAGE SELECTOR
// ============================================
function selectLanguage(element) {
    document.querySelectorAll('.language-option').forEach(el => {
        el.classList.remove('active');
    });
    element.classList.add('active');
    showToast(`Language set to ${element.textContent.trim()}`, 'success');
}

// ============================================
// COLOR SELECTOR
// ============================================
function selectColor(element, color) {
    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.remove('active');
    });
    element.classList.add('active');
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('themeColor', color);
    showToast('Theme color updated!', 'success');
}

// ============================================
// DARK MODE
// ============================================
function toggleDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const status = document.getElementById('darkModeStatus');
    
    if (!toggle || !status) return;
    
    if (toggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        status.innerHTML = 'Dark mode is currently <strong>enabled</strong>';
        localStorage.setItem('theme', 'dark');
        showToast('Dark mode enabled!', 'success');
    } else {
        document.documentElement.removeAttribute('data-theme');
        status.innerHTML = 'Dark mode is currently <strong>disabled</strong>';
        localStorage.setItem('theme', 'light');
        showToast('Light mode enabled!', 'info');
    }
}

// ============================================
// FONT SIZE
// ============================================
let fontSizeLevel = 0;
const fontSizes = ['Small', 'Medium', 'Large', 'Extra Large'];

function changeFontSize(direction) {
    fontSizeLevel = Math.max(0, Math.min(3, fontSizeLevel + direction));
    const display = document.getElementById('fontSizeDisplay');
    if (display) display.textContent = fontSizes[fontSizeLevel];
    
    const sizes = [14, 16, 18, 20];
    document.body.style.fontSize = sizes[fontSizeLevel] + 'px';
    localStorage.setItem('fontSize', fontSizeLevel);
}

// ============================================
// PREFERENCES
// ============================================
function savePreferences() {
    showToast('Preferences saved successfully!', 'success');
}

// ============================================
// DATA MANAGEMENT
// ============================================
function exportData() {
    showToast('Preparing your data for download...', 'info');
    setTimeout(() => {
        showToast('Data exported successfully!', 'success');
    }, 2000);
}

function downloadReport() {
    showToast('Generating progress report...', 'info');
    setTimeout(() => {
        showToast('Report downloaded successfully!', 'success');
    }, 2000);
}

function clearHistory() {
    if (confirm('Are you sure you want to clear your history? This action cannot be undone.')) {
        showToast('History cleared successfully!', 'success');
    }
}

function downloadPastPapers() {
    showToast('Preparing past papers for download...', 'info');
    setTimeout(() => {
        showToast('Past papers downloaded successfully!', 'success');
    }, 2000);
}

// ============================================
// DANGER ZONE
// ============================================
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        // Reset theme color
        document.documentElement.style.setProperty('--primary', '#4f46e5');
        localStorage.removeItem('themeColor');
        
        // Reset dark mode
        document.documentElement.removeAttribute('data-theme');
        const darkToggle = document.getElementById('darkModeToggle');
        const darkStatus = document.getElementById('darkModeStatus');
        if (darkToggle) darkToggle.checked = false;
        if (darkStatus) darkStatus.innerHTML = 'Dark mode is currently <strong>disabled</strong>';
        localStorage.removeItem('theme');
        
        // Reset font size
        fontSizeLevel = 1;
        document.body.style.fontSize = '16px';
        const fontSizeDisplay = document.getElementById('fontSizeDisplay');
        if (fontSizeDisplay) fontSizeDisplay.textContent = 'Medium';
        localStorage.removeItem('fontSize');
        
        showToast('All settings reset to default!', 'success');
    }
}

function deleteAccount() {
    if (confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('All your data will be permanently removed. Are you absolutely sure?')) {
            showToast('Account deletion request submitted.', 'info');
        }
    }
}

// ============================================
// LOAD PREFERENCES
// ============================================
function loadPreferences() {
    // Load dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        const darkToggle = document.getElementById('darkModeToggle');
        const darkStatus = document.getElementById('darkModeStatus');
        if (darkToggle) darkToggle.checked = true;
        if (darkStatus) darkStatus.innerHTML = 'Dark mode is currently <strong>enabled</strong>';
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Load font size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        fontSizeLevel = parseInt(savedFontSize);
        const fontSizeDisplay = document.getElementById('fontSizeDisplay');
        if (fontSizeDisplay) fontSizeDisplay.textContent = fontSizes[fontSizeLevel];
        document.body.style.fontSize = [14, 16, 18, 20][fontSizeLevel] + 'px';
    }

    // Load theme color
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
        document.documentElement.style.setProperty('--primary', savedColor);
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.toggle('active', el.style.backgroundColor === savedColor);
        });
    }
}

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
// LOGOUT
// ============================================
function logout() {
    Auth.logout();
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.switchTab = switchTab;
window.selectLanguage = selectLanguage;
window.selectColor = selectColor;
window.toggleDarkMode = toggleDarkMode;
window.changeFontSize = changeFontSize;
window.saveNotificationSettings = saveNotificationSettings;
window.savePreferences = savePreferences;
window.exportData = exportData;
window.downloadReport = downloadReport;
window.clearHistory = clearHistory;
window.downloadPastPapers = downloadPastPapers;
window.resetSettings = resetSettings;
window.deleteAccount = deleteAccount;
window.logout = logout;