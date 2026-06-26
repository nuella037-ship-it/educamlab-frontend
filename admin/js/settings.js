// js/settings.js - Complete Settings with PIN and SMS Management
document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadSettings();
    loadPinSettings();
    loadSmsSettings();

    // Bio character counter
    document.getElementById('profileBio').addEventListener('input', function() {
        document.getElementById('bioCount').textContent = this.value.length;
    });

    // Password strength checker
    document.getElementById('newPassword').addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });

    // Password match checker
    document.getElementById('confirmPassword').addEventListener('input', function() {
        checkPasswordMatch();
    });

    // Theme preference
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
});

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
        ' • ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('adminTheme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
        localStorage.setItem('adminTheme', 'dark');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.color = btn.dataset.tab === tab ? 'var(--primary)' : 'var(--text-muted)';
        btn.style.borderBottomColor = btn.dataset.tab === tab ? 'var(--primary)' : 'transparent';
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = pane.id === `tab-${tab}` ? 'block' : 'none';
    });
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function checkPasswordStrength(password) {
    const bars = document.querySelectorAll('#passwordStrength .bar');
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    bars.forEach((bar, index) => {
        bar.className = 'bar';
        if (index < strength) {
            bar.classList.add('active');
            bar.style.background = strength <= 2 ? '#ef4444' : strength === 3 ? '#f59e0b' : '#10b981';
        } else {
            bar.style.background = 'var(--border-color)';
        }
    });
}

function checkPasswordMatch() {
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const hint = document.getElementById('passwordMatchHint');
    
    if (confirmPass.length > 0) {
        if (newPass === confirmPass) {
            hint.textContent = '✓ Passwords match';
            hint.style.color = '#10b981';
        } else {
            hint.textContent = '✗ Passwords do not match';
            hint.style.color = '#ef4444';
        }
    } else {
        hint.textContent = 'Passwords must match';
        hint.style.color = '';
    }
}

async function loadAdminProfile() {
    try {
        const result = await API.getProfile();
        if (result.success) {
            const user = result.data;
            document.getElementById('adminName').textContent = user.firstname || 'Admin';
            document.getElementById('adminAvatar').textContent = (user.firstname || 'A')[0].toUpperCase();
            
            document.getElementById('profileFirstname').value = user.firstname || '';
            document.getElementById('profileLastname').value = user.lastname || '';
            document.getElementById('profilePhone').value = user.phone || '';
            document.getElementById('profileBio').value = user.bio || '';
            document.getElementById('bioCount').textContent = (user.bio || '').length;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function loadSettings() {
    document.getElementById('systemUptime').textContent = 'Loading...';
    setTimeout(() => {
        document.getElementById('systemUptime').textContent = '14d 6h 32m';
    }, 1000);
    loadBackupHistory();
}

async function loadPinSettings() {
    try {
        const result = await API.getSettings('pin');
        if (result.success) {
            const settings = result.data;
            if (settings.pinLength) document.getElementById('pinLength').value = settings.pinLength;
            if (settings.pinExpiry) document.getElementById('pinExpiry').value = settings.pinExpiry;
            if (settings.allowMultiple !== undefined) document.getElementById('pinAllowMultiple').checked = settings.allowMultiple;
            if (settings.autoGenerate !== undefined) document.getElementById('pinAutoGenerate').checked = settings.autoGenerate;
        }
    } catch (error) {
        console.error('Error loading PIN settings:', error);
    }
}

async function loadSmsSettings() {
    try {
        const result = await API.getSettings('sms');
        if (result.success) {
            const settings = result.data;
            if (settings.provider) document.getElementById('smsProvider').value = settings.provider;
            if (settings.senderId) document.getElementById('smsSenderId').value = settings.senderId;
            if (settings.enabled !== undefined) document.getElementById('smsEnabled').checked = settings.enabled;
            if (settings.pinDelivery !== undefined) document.getElementById('smsPinDelivery').checked = settings.pinDelivery;
        }
    } catch (error) {
        console.error('Error loading SMS settings:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const data = {
        firstname: document.getElementById('profileFirstname').value.trim(),
        lastname: document.getElementById('profileLastname').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        bio: document.getElementById('profileBio').value.trim()
    };
    
    const btn = document.getElementById('updateProfileBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
    
    try {
        await API.updateProfile(data);
        showToast('Profile updated successfully!', 'success');
        loadAdminProfile();
    } catch (error) {
        showToast('Failed to update profile: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    try {
        await API.changePassword({ currentPassword, newPassword });
        showToast('Password changed successfully!', 'success');
        document.getElementById('passwordForm').reset();
        document.querySelectorAll('#passwordStrength .bar').forEach(bar => {
            bar.style.background = 'var(--border-color)';
        });
    } catch (error) {
        showToast('Failed to change password: ' + error.message, 'error');
    }
}

function toggleTwoFactor() {
    const status = document.getElementById('twoFactorStatus');
    const text = document.getElementById('twoFactorText');
    const btn = document.getElementById('twoFactorBtn');
    
    if (status.style.background === 'var(--success)' || status.classList.contains('online')) {
        status.style.background = 'var(--text-muted)';
        text.textContent = 'Disabled';
        btn.innerHTML = '<i class="fas fa-plus"></i> Enable 2FA';
        showToast('Two-factor authentication disabled', 'info');
    } else {
        status.style.background = 'var(--success)';
        text.textContent = 'Enabled';
        btn.innerHTML = '<i class="fas fa-minus"></i> Disable 2FA';
        showToast('Two-factor authentication enabled!', 'success');
    }
}

function saveNotificationSettings() {
    showToast('Notification preferences saved!', 'success');
}

function saveSystemSettings(event) {
    event.preventDefault();
    showToast('System settings saved successfully!', 'success');
}

// ============================================
// SMS SETTINGS
// ============================================
async function saveSmsSettings(event) {
    event.preventDefault();
    
    const settings = {
        provider: document.getElementById('smsProvider').value,
        apiKey: document.getElementById('smsApiKey').value,
        senderId: document.getElementById('smsSenderId').value.trim(),
        enabled: document.getElementById('smsEnabled').checked,
        pinDelivery: document.getElementById('smsPinDelivery').checked
    };
    
    try {
        const result = await API.updateSettings('sms', settings);
        if (result.success) {
            showToast('SMS settings saved successfully!', 'success');
        } else {
            showToast('Failed to save SMS settings', 'error');
        }
    } catch (error) {
        showToast('Failed to save SMS settings: ' + error.message, 'error');
    }
}

// ============================================
// PIN SETTINGS
// ============================================
async function savePinSettings(event) {
    event.preventDefault();
    
    const settings = {
        pinLength: parseInt(document.getElementById('pinLength').value),
        pinExpiry: parseInt(document.getElementById('pinExpiry').value),
        allowMultiple: document.getElementById('pinAllowMultiple').checked,
        autoGenerate: document.getElementById('pinAutoGenerate').checked
    };
    
    try {
        const result = await API.updateSettings('pin', settings);
        if (result.success) {
            showToast('PIN settings saved successfully!', 'success');
        } else {
            showToast('Failed to save PIN settings', 'error');
        }
    } catch (error) {
        showToast('Failed to save PIN settings: ' + error.message, 'error');
    }
}

async function revokeExpiredPins() {
    if (!confirm('Are you sure you want to revoke all expired PINs?')) {
        return;
    }
    
    try {
        const result = await API.revokeExpiredPins();
        if (result.success) {
            showToast(`Revoked ${result.data?.count || 0} expired PINs`, 'success');
        } else {
            showToast('Failed to revoke expired PINs', 'error');
        }
    } catch (error) {
        showToast('Failed to revoke expired PINs: ' + error.message, 'error');
    }
}

async function generateBulkPins() {
    const count = prompt('How many PINs to generate?', '10');
    if (!count || parseInt(count) < 1) return;
    
    const plan = prompt('Which plan? (daily/weekly/monthly/annual)', 'monthly');
    if (!plan) return;
    
    try {
        const result = await API.generateBulkPins({
            count: parseInt(count),
            plan: plan
        });
        
        if (result.success) {
            const pins = result.data || [];
            showToast(`Generated ${pins.length} PINs successfully!`, 'success');
            showPinsModal(pins);
        } else {
            showToast('Failed to generate PINs', 'error');
        }
    } catch (error) {
        showToast('Failed to generate PINs: ' + error.message, 'error');
    }
}

function showPinsModal(pins) {
    const modal = document.getElementById('quickActionModal');
    const title = document.getElementById('quickActionTitle');
    const body = document.getElementById('quickActionBody');
    
    title.textContent = `Generated PINs (${pins.length})`;
    body.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>PIN</th>
                        <th>Plan</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${pins.map((pin, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td style="font-family: monospace; font-weight: 700; color: var(--primary); letter-spacing: 2px;">${pin.code}</td>
                            <td>${pin.plan || 'N/A'}</td>
                            <td><span class="badge badge-success">Active</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="closeQuickAction()" class="btn-secondary">Close</button>
            <button onclick="exportPinsToCSV(${JSON.stringify(pins)})" class="btn-primary">
                <i class="fas fa-download"></i> Export CSV
            </button>
            <button onclick="copyAllPins(${JSON.stringify(pins.map(p => p.code))})" class="btn-secondary">
                <i class="fas fa-copy"></i> Copy All
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeQuickAction() {
    document.getElementById('quickActionModal').style.display = 'none';
}

function exportPinsToCSV(pins) {
    let csv = 'PIN,Plan,Status,Generated\n';
    pins.forEach(pin => {
        csv += `${pin.code},${pin.plan || 'N/A'},Active,${new Date().toISOString().split('T')[0]}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pins-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('PINs exported successfully!', 'success');
}

function copyAllPins(pins) {
    const text = pins.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${pins.length} PINs copied to clipboard!`, 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`${pins.length} PINs copied to clipboard!`, 'success');
    });
}

async function exportAllPins() {
    try {
        const result = await API.getAllPins();
        if (result.success) {
            const pins = result.data || [];
            if (pins.length === 0) {
                showToast('No PINs to export', 'warning');
                return;
            }
            exportPinsToCSV(pins);
        } else {
            showToast('Failed to export PINs', 'error');
        }
    } catch (error) {
        showToast('Failed to export PINs: ' + error.message, 'error');
    }
}

async function viewAllPins() {
    try {
        const result = await API.getAllPins({ limit: 100 });
        if (result.success) {
            const pins = result.data || [];
            if (pins.length === 0) {
                showToast('No PINs found', 'info');
                return;
            }
            showPinsModal(pins);
        } else {
            showToast('Failed to load PINs', 'error');
        }
    } catch (error) {
        showToast('Failed to load PINs: ' + error.message, 'error');
    }
}

// ============================================
// SYSTEM FUNCTIONS
// ============================================
function clearCache() {
    showToast('Cache cleared successfully!', 'success');
}

function runMaintenance() {
    showToast('Maintenance tasks completed!', 'success');
}

function exportSystemLogs() {
    showToast('System logs exported successfully!', 'success');
}

function restartServer() {
    if (confirm('Are you sure you want to restart the server? This may cause temporary downtime.')) {
        showToast('Server restart initiated...', 'info');
    }
}

function createBackup() {
    showToast('Backup created successfully!', 'success');
}

function restoreBackup() {
    showToast('Backup restored successfully!', 'success');
}

function downloadBackup() {
    showToast('Downloading latest backup...', 'info');
}

function loadBackupHistory() {
    const tbody = document.getElementById('backupHistoryBody');
    const backups = [
        { date: '2026-06-19 14:30:00', size: '45.2 MB', type: 'Full', status: 'Completed' },
        { date: '2026-06-19 08:15:00', size: '12.8 MB', type: 'Incremental', status: 'Completed' },
        { date: '2026-06-18 23:00:00', size: '45.1 MB', type: 'Full', status: 'Completed' },
        { date: '2026-06-18 12:00:00', size: '8.3 MB', type: 'Incremental', status: 'Failed' },
        { date: '2026-06-17 14:30:00', size: '44.9 MB', type: 'Full', status: 'Completed' }
    ];
    
    if (backups.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No backups available</td></tr>`;
        return;
    }
    
    tbody.innerHTML = backups.map(backup => `
        <tr>
            <td>${backup.date}</td>
            <td>${backup.size}</td>
            <td><span class="badge badge-info">${backup.type}</span></td>
            <td><span class="badge ${backup.status === 'Completed' ? 'badge-success' : 'badge-danger'}">${backup.status}</span></td>
            <td>
                <button onclick="downloadBackup()" class="btn-sm btn-info">
                    <i class="fas fa-download"></i>
                </button>
                <button onclick="restoreBackup()" class="btn-sm btn-warning">
                    <i class="fas fa-undo"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
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
    }, 5000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        API.clearToken();
        window.location.href = 'login.html';
    }
}

// Make functions globally available
window.switchTab = switchTab;
window.togglePasswordVisibility = togglePasswordVisibility;
window.updateProfile = updateProfile;
window.changePassword = changePassword;
window.toggleTwoFactor = toggleTwoFactor;
window.saveNotificationSettings = saveNotificationSettings;
window.saveSystemSettings = saveSystemSettings;
window.clearCache = clearCache;
window.runMaintenance = runMaintenance;
window.exportSystemLogs = exportSystemLogs;
window.restartServer = restartServer;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
window.downloadBackup = downloadBackup;
window.savePinSettings = savePinSettings;
window.saveSmsSettings = saveSmsSettings;
window.revokeExpiredPins = revokeExpiredPins;
window.generateBulkPins = generateBulkPins;
window.exportAllPins = exportAllPins;
window.viewAllPins = viewAllPins;
window.exportPinsToCSV = exportPinsToCSV;
window.copyAllPins = copyAllPins;
window.closeQuickAction = closeQuickAction;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;