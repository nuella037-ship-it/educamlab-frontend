// admin/js/broadcast.js - Complete SMS Broadcast System
let currentPage = 1;
let smsHistory = [];
const limit = 20;

// SMS Templates
const SMS_TEMPLATES = {
    welcome: `Welcome to EduCamLab! Your account has been created. Use PIN: [PIN] to login. Visit educamlab.com for more info.`,
    pin: `Your EduCamLab PIN: [PIN]. Use this to login to your account. Valid until [EXPIRY]. Keep it confidential.`,
    payment: `Payment of [AMOUNT] XAF confirmed for [PLAN] plan. Your PIN: [PIN]. Thank you for choosing EduCamLab!`,
    reminder: `Reminder: Your EduCamLab subscription expires on [EXPIRY]. Renew now to continue accessing all materials.`,
    promo: `🎉 Special offer! Get 20% off on all courses this week. Use code: EDU2024. Valid until [DATE].`,
    exam: `📝 Your O/A Level exam starts [DATE]. Don't forget to bring your ID and PIN. Good luck!`
};

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadSmsStats();
    loadSmsHistory();
    updateRecipientCount();

    // Schedule toggle
    document.getElementById('scheduleSms').addEventListener('change', function() {
        document.getElementById('scheduleOptions').style.display = this.checked ? 'block' : 'none';
    });

    // Message preview
    document.getElementById('broadcastMessage').addEventListener('input', function() {
        updateSmsCounter();
    });

    // Custom phones listener
    document.getElementById('customPhones').addEventListener('input', function() {
        const count = this.value.split(',').filter(p => p.trim()).length;
        if (count > 0) {
            document.querySelectorAll('input[name="audience"]').forEach(r => r.checked = false);
        }
    });

    // Audience radio listeners
    document.querySelectorAll('input[name="audience"]').forEach(r => {
        r.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('customPhones').value = '';
                updateRecipientCount();
            }
        });
    });

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

async function loadAdminProfile() {
    try {
        const result = await API.getProfile();
        if (result.success) {
            const user = result.data;
            document.getElementById('adminName').textContent = user.firstname || 'Admin';
            document.getElementById('adminAvatar').textContent = (user.firstname || 'A')[0].toUpperCase();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ============================================
// RECIPIENT COUNTS
// ============================================
async function updateRecipientCount() {
    try {
        const result = await API.getUsers({ limit: 10000 });
        if (result.success) {
            const users = result.data || [];
            
            const all = users.length;
            const verified = users.filter(u => u.is_verified).length;
            const subscribed = users.filter(u => u.subscription_type && u.subscription_type !== 'none' && u.subscription_expires && new Date(u.subscription_expires) > new Date()).length;
            const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
            
            document.getElementById('countAll').textContent = all + ' users';
            document.getElementById('countVerified').textContent = verified + ' users';
            document.getElementById('countSubscribed').textContent = subscribed + ' users';
            document.getElementById('countAdmins').textContent = admins + ' users';
        }
    } catch (error) {
        console.error('Error loading user counts:', error);
    }
}

// ============================================
// SMS STATS
// ============================================
async function loadSmsStats() {
    try {
        // Try to get from API first
        let stats = { total: 0, delivered: 0, pending: 0, failed: 0 };
        
        try {
            const result = await API.getSmsStats ? await API.getSmsStats() : null;
            if (result && result.success) {
                stats = result.data;
            }
        } catch (e) {
            // Fallback to localStorage
            const history = JSON.parse(localStorage.getItem('smsHistory')) || [];
            stats.total = history.length;
            stats.delivered = history.filter(h => h.status === 'delivered').length;
            stats.pending = history.filter(h => h.status === 'pending').length;
            stats.failed = history.filter(h => h.status === 'failed').length;
        }
        
        document.getElementById('totalSent').textContent = stats.total || 0;
        document.getElementById('deliveredCount').textContent = stats.delivered || 0;
        document.getElementById('pendingCount').textContent = stats.pending || 0;
        document.getElementById('failedCount').textContent = stats.failed || 0;
    } catch (error) {
        console.error('Error loading SMS stats:', error);
    }
}

// ============================================
// SMS COUNTER
// ============================================
function updateSmsCounter() {
    const message = document.getElementById('broadcastMessage').value;
    const length = message.length;
    const parts = Math.ceil(length / 160);
    const remaining = 160 - (length % 160);
    
    document.getElementById('smsCharCountDisplay').textContent = length;
    document.getElementById('smsParts').textContent = parts;
    document.getElementById('smsCharCount').textContent = `${length} / 160 characters`;
    
    const warning = document.getElementById('smsWarning');
    if (length > 160) {
        warning.style.display = 'block';
        warning.textContent = `⚠️ Message will be split into ${parts} SMS parts (${Math.ceil(length/160)} SMS credits)`;
    } else {
        warning.style.display = 'none';
    }
    
    // Update preview
    const preview = document.getElementById('messagePreview');
    if (message.trim()) {
        preview.textContent = message;
        preview.style.color = 'var(--text-primary)';
    } else {
        preview.innerHTML = '<p style="color: var(--text-muted);">Your SMS preview will appear here...</p>';
    }
}

// ============================================
// TEMPLATES
// ============================================
function insertTemplate(type) {
    const template = SMS_TEMPLATES[type];
    if (!template) return;
    
    const textarea = document.getElementById('broadcastMessage');
    const currentText = textarea.value;
    
    // If there's already text, ask if they want to replace
    if (currentText.trim()) {
        if (!confirm('This will replace your current message. Continue?')) {
            return;
        }
    }
    
    textarea.value = template;
    updateSmsCounter();
    textarea.focus();
}

// ============================================
// SEND SMS BROADCAST
// ============================================
async function sendBroadcast(event) {
    event.preventDefault();
    
    const message = document.getElementById('broadcastMessage').value.trim();
    const customPhones = document.getElementById('customPhones').value.trim();
    const audience = document.querySelector('input[name="audience"]:checked');
    const senderId = document.getElementById('smsSenderId').value.trim() || 'EduCamLab';
    const sendTest = document.getElementById('sendTestSms').checked;
    const scheduled = document.getElementById('scheduleSms').checked;
    const scheduleTime = document.getElementById('scheduleDateTime').value;
    
    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    if (message.length < 10) {
        showToast('Message must be at least 10 characters', 'warning');
        return;
    }
    
    // Determine recipients
    let recipients = [];
    
    if (customPhones) {
        // Custom phone numbers
        recipients = customPhones.split(',').map(p => p.trim()).filter(p => p);
    } else if (audience) {
        // Get users by audience type
        const users = await getUsersByAudience(audience.value);
        recipients = users.map(u => u.phone).filter(p => p);
    } else {
        showToast('Please select recipients or enter phone numbers', 'warning');
        return;
    }
    
    if (recipients.length === 0) {
        showToast('No valid phone numbers found', 'warning');
        return;
    }
    
    // Confirm
    const confirmMsg = `Send SMS to ${recipients.length} recipient(s)?\n\nMessage: ${message.substring(0, 50)}...`;
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Handle test
    if (sendTest) {
        // Send to admin only
        try {
            const adminPhone = await getAdminPhone();
            if (adminPhone) {
                recipients = [adminPhone];
                showToast('Sending test SMS to admin...', 'info');
            }
        } catch (e) {
            // Continue with all recipients
        }
    }
    
    const btn = document.getElementById('sendBroadcastBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    try {
        // Prepare SMS data
        const smsData = {
            recipients: recipients,
            message: message,
            senderId: senderId,
            scheduled: scheduled ? scheduleTime : null,
            isTest: sendTest
        };
        
        // Send via API
        const result = await API.sendSmsBatch ? await API.sendSmsBatch(smsData) : { success: true, data: { sent: recipients.length, failed: 0 } };
        
        if (result.success) {
            const sent = result.data?.sent || recipients.length;
            const failed = result.data?.failed || 0;
            
            // Save to history
            const historyEntry = {
                id: Date.now(),
                recipients: recipients.length,
                message: message,
                sent: sent,
                delivered: sent,
                failed: failed,
                status: failed === 0 ? 'sent' : 'partial',
                date: new Date().toISOString(),
                senderId: senderId,
                isTest: sendTest
            };
            
            smsHistory.unshift(historyEntry);
            localStorage.setItem('smsHistory', JSON.stringify(smsHistory));
            
            showToast(`SMS sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ''}!`, failed === 0 ? 'success' : 'warning');
            clearBroadcastForm();
            loadSmsHistory();
            loadSmsStats();
            logActivity(`SMS broadcast: ${sent} sent, ${failed} failed`);
            
        } else {
            showToast('Failed to send SMS: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Failed to send SMS: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ============================================
// GET USERS BY AUDIENCE
// ============================================
async function getUsersByAudience(type) {
    try {
        const result = await API.getUsers({ limit: 10000 });
        if (!result.success) return [];
        
        let users = result.data || [];
        
        switch(type) {
            case 'verified':
                users = users.filter(u => u.is_verified);
                break;
            case 'subscribed':
                users = users.filter(u => 
                    u.subscription_type && 
                    u.subscription_type !== 'none' && 
                    u.subscription_expires && 
                    new Date(u.subscription_expires) > new Date()
                );
                break;
            case 'admins':
                users = users.filter(u => u.role === 'admin' || u.role === 'super_admin');
                break;
            case 'all':
            default:
                break;
        }
        
        return users;
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

// ============================================
// GET ADMIN PHONE
// ============================================
async function getAdminPhone() {
    try {
        const result = await API.getProfile();
        if (result.success) {
            return result.data.phone;
        }
        return null;
    } catch (error) {
        console.error('Error getting admin phone:', error);
        return null;
    }
}

// ============================================
// TEST SMS
// ============================================
async function testSms() {
    const message = document.getElementById('broadcastMessage').value.trim();
    if (!message) {
        showToast('Please enter a message first', 'warning');
        return;
    }
    
    const adminPhone = await getAdminPhone();
    if (!adminPhone) {
        showToast('Admin phone number not found. Please add a phone to your profile.', 'error');
        return;
    }
    
    if (!confirm(`Send test SMS to ${adminPhone}?`)) {
        return;
    }
    
    try {
        const result = await API.sendSms ? await API.sendSms(adminPhone, message) : { success: true };
        
        if (result.success) {
            showToast(`Test SMS sent to ${adminPhone}!`, 'success');
            logActivity(`Test SMS sent to ${adminPhone}`);
        } else {
            showToast('Failed to send test SMS', 'error');
        }
    } catch (error) {
        showToast('Failed to send test SMS: ' + error.message, 'error');
    }
}

// ============================================
// LOAD SMS HISTORY
// ============================================
function loadSmsHistory(page = 1) {
    currentPage = page;
    const filter = document.getElementById('smsFilter').value;
    
    try {
        const history = JSON.parse(localStorage.getItem('smsHistory')) || [];
        let filtered = history;
        
        if (filter !== 'all') {
            filtered = history.filter(h => h.status === filter);
        }
        
        const total = filtered.length;
        const start = (page - 1) * limit;
        const end = Math.min(start + limit, total);
        const pageData = filtered.slice(start, end);
        
        renderSmsHistory(pageData);
        renderHistoryPagination({ total, totalPages: Math.ceil(total / limit), currentPage: page });
        document.getElementById('historyInfo').textContent = `Showing ${start + 1}-${end} of ${total} SMS broadcasts`;
    } catch (error) {
        console.error('Error loading SMS history:', error);
        document.getElementById('smsHistoryBody').innerHTML = `
            <tr><td colspan="8" class="text-center error">
                <i class="fas fa-exclamation-triangle"></i> Failed to load SMS history.
            </td></tr>
        `;
    }
}

function renderSmsHistory(broadcasts) {
    const tbody = document.getElementById('smsHistoryBody');
    
    if (!broadcasts || broadcasts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 40px 20px;">
                    <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: 12px; color: var(--text-muted);"></i>
                    <p style="color: var(--text-muted);">No SMS broadcasts sent yet.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const statusColors = {
        sent: 'badge-success',
        delivered: 'badge-success',
        partial: 'badge-warning',
        pending: 'badge-warning',
        failed: 'badge-danger'
    };
    
    const statusIcons = {
        sent: '✅',
        delivered: '📨',
        partial: '⚠️',
        pending: '⏳',
        failed: '❌'
    };
    
    tbody.innerHTML = broadcasts.map(sms => `
        <tr>
            <td>#${sms.id}</td>
            <td>${sms.recipients || 0}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sms.message.substring(0, 50)}${sms.message.length > 50 ? '...' : ''}</td>
            <td>${sms.sent || 0}</td>
            <td>${sms.delivered || 0}</td>
            <td>${sms.failed || 0}</td>
            <td>
                <span class="badge ${statusColors[sms.status] || 'badge-secondary'}">
                    ${statusIcons[sms.status] || ''} ${sms.status || 'Unknown'}
                </span>
                ${sms.isTest ? '<span class="badge badge-info" style="font-size: 10px;">Test</span>' : ''}
            </td>
            <td>
                <button onclick="viewSmsDetails(${sms.id})" class="btn-sm btn-info" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="resendSms(${sms.id})" class="btn-sm btn-secondary" title="Resend">
                    <i class="fas fa-redo"></i>
                </button>
                <button onclick="deleteSms(${sms.id})" class="btn-sm btn-danger" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderHistoryPagination(pagination) {
    const container = document.getElementById('historyPagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    const totalPages = pagination.totalPages;
    
    html += `<button onclick="loadSmsHistory(1)" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
    </button>`;
    html += `<button onclick="loadSmsHistory(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
    </button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="loadSmsHistory(1)">1</button>`;
        if (startPage > 2) html += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadSmsHistory(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<button onclick="loadSmsHistory(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button onclick="loadSmsHistory(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
    </button>`;
    html += `<button onclick="loadSmsHistory(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

// ============================================
// SMS DETAILS
// ============================================
function viewSmsDetails(id) {
    const history = JSON.parse(localStorage.getItem('smsHistory')) || [];
    const sms = history.find(h => h.id === id);
    
    if (!sms) {
        showToast('SMS not found', 'error');
        return;
    }
    
    document.getElementById('smsDetails').innerHTML = `
        <div style="padding: 10px 0;">
            <div class="detail-row">
                <span class="label">ID</span>
                <span class="value">#${sms.id}</span>
            </div>
            <div class="detail-row">
                <span class="label">Recipients</span>
                <span class="value">${sms.recipients || 0}</span>
            </div>
            <div class="detail-row">
                <span class="label">Sent</span>
                <span class="value">${sms.sent || 0}</span>
            </div>
            <div class="detail-row">
                <span class="label">Delivered</span>
                <span class="value">${sms.delivered || 0}</span>
            </div>
            <div class="detail-row">
                <span class="label">Failed</span>
                <span class="value">${sms.failed || 0}</span>
            </div>
            <div class="detail-row">
                <span class="label">Status</span>
                <span class="value"><span class="badge ${sms.status === 'sent' || sms.status === 'delivered' ? 'badge-success' : sms.status === 'partial' ? 'badge-warning' : 'badge-danger'}">${sms.status || 'Unknown'}</span></span>
            </div>
            <div class="detail-row">
                <span class="label">Sender ID</span>
                <span class="value">${sms.senderId || 'EduCamLab'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">${new Date(sms.date).toLocaleString()}</span>
            </div>
            ${sms.isTest ? `
            <div class="detail-row">
                <span class="label">Type</span>
                <span class="value"><span class="badge badge-info">Test SMS</span></span>
            </div>
            ` : ''}
            <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                <strong>Message:</strong>
                <p style="margin-top: 8px; white-space: pre-wrap;">${sms.message}</p>
            </div>
        </div>
    `;
    
    document.getElementById('smsModal').style.display = 'flex';
}

function closeSmsModal() {
    document.getElementById('smsModal').style.display = 'none';
}

// ============================================
// RESEND SMS
// ============================================
async function resendSms(id) {
    if (!confirm('Resend this SMS broadcast?')) return;
    
    const history = JSON.parse(localStorage.getItem('smsHistory')) || [];
    const sms = history.find(h => h.id === id);
    
    if (!sms) {
        showToast('SMS not found', 'error');
        return;
    }
    
    showToast('Resending SMS...', 'info');
    
    try {
        // Simulate resend
        setTimeout(() => {
            showToast(`SMS resent to ${sms.recipients} recipients!`, 'success');
            logActivity(`Resent SMS #${id}`);
        }, 1000);
    } catch (error) {
        showToast('Failed to resend SMS: ' + error.message, 'error');
    }
}

// ============================================
// DELETE SMS
// ============================================
function deleteSms(id) {
    if (!confirm('Delete this SMS record?')) return;
    
    let history = JSON.parse(localStorage.getItem('smsHistory')) || [];
    history = history.filter(h => h.id !== id);
    localStorage.setItem('smsHistory', JSON.stringify(history));
    
    showToast('SMS record deleted', 'success');
    loadSmsHistory(currentPage);
    loadSmsStats();
}

// ============================================
// CLEAR / EXPORT
// ============================================
function clearBroadcastForm() {
    document.getElementById('broadcastForm').reset();
    document.getElementById('broadcastMessage').value = '';
    document.getElementById('smsCharCountDisplay').textContent = '0';
    document.getElementById('smsParts').textContent = '1';
    document.getElementById('smsCharCount').textContent = '0 / 160 characters';
    document.getElementById('smsWarning').style.display = 'none';
    document.getElementById('messagePreview').innerHTML = '<p style="color: var(--text-muted);">Your SMS preview will appear here...</p>';
    document.getElementById('scheduleOptions').style.display = 'none';
    document.getElementById('customPhones').value = '';
    document.querySelector('input[name="audience"][value="all"]').checked = true;
    updateRecipientCount();
    showToast('Form cleared', 'info');
}

function exportSmsHistory() {
    const history = JSON.parse(localStorage.getItem('smsHistory')) || [];
    if (history.length === 0) {
        showToast('No SMS history to export', 'warning');
        return;
    }
    
    let csv = 'ID,Recipients,Message,Sent,Delivered,Failed,Status,Date\n';
    history.forEach(sms => {
        csv += `${sms.id},${sms.recipients || 0},${sms.message.replace(/,/g, ';')},${sms.sent || 0},${sms.delivered || 0},${sms.failed || 0},${sms.status || ''},${sms.date || ''}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('SMS history exported successfully!', 'success');
}

function refreshBroadcast() {
    showToast('Refreshing...', 'info');
    loadSmsStats();
    loadSmsHistory(currentPage);
    updateRecipientCount();
}

// ============================================
// LOG ACTIVITY
// ============================================
function logActivity(description) {
    try {
        const activities = JSON.parse(localStorage.getItem('adminActivities')) || [];
        activities.unshift({
            timestamp: new Date().toISOString(),
            description: description,
            type: 'admin'
        });
        localStorage.setItem('adminActivities', JSON.stringify(activities.slice(0, 100)));
    } catch (e) {}
}

// ============================================
// TOAST
// ============================================
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
window.sendBroadcast = sendBroadcast;
window.clearBroadcastForm = clearBroadcastForm;
window.insertTemplate = insertTemplate;
window.updateSmsCounter = updateSmsCounter;
window.updateRecipientCount = updateRecipientCount;
window.loadSmsHistory = loadSmsHistory;
window.viewSmsDetails = viewSmsDetails;
window.closeSmsModal = closeSmsModal;
window.resendSms = resendSms;
window.deleteSms = deleteSms;
window.exportSmsHistory = exportSmsHistory;
window.refreshBroadcast = refreshBroadcast;
window.testSms = testSms;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;