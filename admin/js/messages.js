// js/messages.js - Complete Message Management
let currentPage = 1;
let currentMessageId = null;
let selectedMessages = new Set();
let deleteTargetId = null;
let viewMessageId = null;
const limit = 20;

// Reply templates
const templates = {
    thankyou: `Thank you for reaching out to EduCamLab. We appreciate your interest and will get back to you shortly.

Best regards,
EduCamLab Support Team`,

    investigation: `Thank you for bringing this to our attention. Our team is currently investigating the issue and we will provide you with an update as soon as possible.

We appreciate your patience.

Best regards,
EduCamLab Support Team`,

    resolved: `We are happy to inform you that the issue you reported has been resolved. If you have any further questions, please don't hesitate to reach out.

Thank you for your patience.

Best regards,
EduCamLab Support Team`,

    followup: `We hope this finds you well. We wanted to follow up on your previous inquiry to see if you need any further assistance.

Please let us know if you have any additional questions.

Best regards,
EduCamLab Support Team`,

    pin_info: `Thank you for your inquiry. Your PIN for accessing the platform is: [PIN_CODE]

Please use this PIN to login to your account. If you have any issues, please don't hesitate to contact us.

Best regards,
EduCamLab Support Team`
};

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadMessages();
    loadMessageStats();

    document.getElementById('replyContent').addEventListener('input', function() {
        document.getElementById('replyCharCount').textContent = this.value.length;
    });

    document.getElementById('replySubject').addEventListener('focus', function() {
        if (!this.value && viewMessageId) {
            API.getMessage(viewMessageId).then(result => {
                if (result.success) {
                    this.value = `Re: ${result.data.subject}`;
                }
            }).catch(() => {});
        }
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

async function loadMessageStats() {
    try {
        const result = await API.getMessages({ limit: 1000 });
        if (result.success) {
            const messages = result.data || [];
            const total = messages.length;
            const newCount = messages.filter(m => m.status === 'new').length;
            const readCount = messages.filter(m => m.status === 'read').length;
            const repliedCount = messages.filter(m => m.status === 'replied').length;
            
            document.getElementById('totalMessages').textContent = total;
            document.getElementById('newMessages').textContent = newCount;
            document.getElementById('readMessages').textContent = readCount;
            document.getElementById('repliedMessages').textContent = repliedCount;
            document.getElementById('messageCount').textContent = newCount;
        }
    } catch (error) {
        console.error('Error loading message stats:', error);
    }
}

async function loadMessages(page = 1) {
    currentPage = page;
    
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;
    const dateRange = document.getElementById('dateFilter').value;

    try {
        let dateFilter = {};
        if (dateRange === 'today') {
            const today = new Date();
            dateFilter = { start: today.toISOString().split('T')[0] };
        } else if (dateRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateFilter = { start: weekAgo.toISOString().split('T')[0] };
        } else if (dateRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateFilter = { start: monthAgo.toISOString().split('T')[0] };
        }

        const result = await API.getMessages({
            page,
            limit,
            search: search || undefined,
            status: status || undefined,
            ...dateFilter
        });

        if (result.success) {
            renderMessages(result.data || []);
            renderPagination(result.pagination || {});
            document.getElementById('tableInfo').textContent = 
                `Showing ${result.data ? result.data.length : 0} of ${result.pagination?.total || 0} messages`;
            selectedMessages.clear();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('messagesTableBody').innerHTML = `
            <tr><td colspan="7" class="text-center error">
                <i class="fas fa-exclamation-triangle"></i> Failed to load messages. Please try again.
            </td></tr>
        `;
    }
}

function renderMessages(messages) {
    const tbody = document.getElementById('messagesTableBody');
    
    if (!messages || messages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 60px 20px;">
                    <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 16px; color: var(--text-muted);"></i>
                    <h3 style="margin-bottom: 8px;">No messages found</h3>
                    <p style="color: var(--text-muted);">Messages from contact forms will appear here.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = messages.map(msg => {
        const isNew = msg.status === 'new';
        const statusColors = {
            new: 'badge-danger',
            read: 'badge-warning',
            replied: 'badge-success'
        };
        const statusLabels = {
            new: '🟡 New',
            read: '🔵 Read',
            replied: '🟢 Replied'
        };
        
        return `
            <tr class="${isNew ? 'unread' : ''}" style="${isNew ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
                <td>
                    <input type="checkbox" class="message-select" data-id="${msg.id}" 
                           onchange="toggleMessageSelect(${msg.id})">
                </td>
                <td>#${msg.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">
                            ${msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: ${isNew ? '700' : '500'};">${msg.name}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${timeAgo(msg.created_at)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        <span style="font-weight: ${isNew ? '700' : '500'};">${msg.subject}</span>
                        ${msg.message.length > 60 ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${msg.message.substring(0, 60)}...</div>` : ''}
                    </div>
                </td>
                <td><span class="badge ${statusColors[msg.status]}">${statusLabels[msg.status]}</span></td>
                <td style="font-size: 13px;">${new Date(msg.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewMessage(${msg.id})" class="btn-sm btn-info" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="openReply(${msg.id})" class="btn-sm btn-primary" title="Reply">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button onclick="deleteMessage(${msg.id})" class="btn-sm btn-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    const totalPages = pagination.totalPages;
    
    html += `<button onclick="loadMessages(1)" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
    </button>`;
    html += `<button onclick="loadMessages(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
    </button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="loadMessages(1)">1</button>`;
        if (startPage > 2) html += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadMessages(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<button onclick="loadMessages(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button onclick="loadMessages(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
    </button>`;
    html += `<button onclick="loadMessages(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
        year: 31536000, month: 2592000, week: 604800,
        day: 86400, hour: 3600, minute: 60
    };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval + ' ' + unit + (interval > 1 ? 's' : '') + ' ago';
        }
    }
    return 'Just now';
}

function toggleMessageSelect(id) {
    if (selectedMessages.has(id)) {
        selectedMessages.delete(id);
    } else {
        selectedMessages.add(id);
    }
    updateSelectAllState();
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.message-select');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        const id = parseInt(cb.dataset.id);
        if (cb.checked) {
            selectedMessages.add(id);
        } else {
            selectedMessages.delete(id);
        }
    });
}

function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.message-select');
    const selectAll = document.getElementById('selectAll');
    if (checkboxes.length > 0) {
        selectAll.checked = checkboxes.length === selectedMessages.size;
    }
}

async function bulkMessageAction() {
    const action = document.getElementById('bulkAction').value;
    if (!action) {
        showToast('Please select an action', 'warning');
        return;
    }
    
    if (selectedMessages.size === 0) {
        showToast('Please select at least one message', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to ${action} ${selectedMessages.size} message(s)?`)) {
        return;
    }
    
    const messageIds = Array.from(selectedMessages);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of messageIds) {
        try {
            switch (action) {
                case 'mark-read':
                    await API.updateMessageStatus(id, 'read');
                    successCount++;
                    break;
                case 'mark-unread':
                    await API.updateMessageStatus(id, 'new');
                    successCount++;
                    break;
                case 'delete':
                    await API.deleteMessage(id);
                    successCount++;
                    break;
                default:
                    break;
            }
        } catch (error) {
            failCount++;
            console.error(`Failed to ${action} message ${id}:`, error);
        }
    }
    
    showToast(`${action} completed: ${successCount} successful, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    selectedMessages.clear();
    loadMessages(currentPage);
    loadMessageStats();
}

function insertTemplate(type) {
    const textarea = document.getElementById('replyContent');
    const template = templates[type];
    if (template) {
        textarea.value = template;
        document.getElementById('replyCharCount').textContent = template.length;
        textarea.focus();
    }
}

async function viewMessage(id) {
    try {
        viewMessageId = id;
        const result = await API.getMessage(id);
        if (result.success) {
            const msg = result.data;
            
            document.getElementById('messageDetails').innerHTML = `
                <div class="message-detail">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; flex-shrink: 0;">
                            ${msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 style="margin: 0;">${msg.name}</h3>
                            <p style="margin: 2px 0; color: var(--text-secondary);"><i class="fas fa-tag"></i> ${msg.subject}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
                        <span class="badge ${msg.status === 'new' ? 'badge-danger' : msg.status === 'read' ? 'badge-warning' : 'badge-success'}">
                            ${msg.status.toUpperCase()}
                        </span>
                        <span style="color: var(--text-muted); font-size: 13px;"><i class="fas fa-clock"></i> ${new Date(msg.created_at).toLocaleString()}</span>
                        ${msg.replied_at ? `<span style="color: var(--text-muted); font-size: 13px;"><i class="fas fa-reply"></i> Replied: ${new Date(msg.replied_at).toLocaleString()}</span>` : ''}
                    </div>
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 16px;">
                        <strong style="display: block; margin-bottom: 8px;">Message:</strong>
                        <p style="margin: 0; white-space: pre-wrap;">${msg.message}</p>
                    </div>
                    ${msg.replied_at ? `
                        <div style="padding: 16px; background: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
                            <strong style="display: block; margin-bottom: 8px;"><i class="fas fa-reply"></i> Your Reply:</strong>
                            <p style="margin: 0; white-space: pre-wrap;">${msg.reply || 'No reply content saved'}</p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            const markBtn = document.getElementById('markReadBtn');
            if (msg.status === 'new') {
                markBtn.style.display = 'inline-block';
            } else {
                markBtn.style.display = 'none';
            }
            
            document.getElementById('viewMessageModal').style.display = 'flex';
            
            loadMessages(currentPage);
            loadMessageStats();
        }
    } catch (error) {
        showToast('Failed to load message: ' + error.message, 'error');
    }
}

async function markAsRead() {
    if (!viewMessageId) return;
    try {
        await API.updateMessageStatus(viewMessageId, 'read');
        showToast('Message marked as read', 'success');
        closeViewMessageModal();
        loadMessages(currentPage);
        loadMessageStats();
    } catch (error) {
        showToast('Failed to mark as read: ' + error.message, 'error');
    }
}

function openReply(id) {
    currentMessageId = id;
    API.getMessage(id).then(result => {
        if (result.success) {
            const msg = result.data;
            document.getElementById('replyMessageInfo').innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: var(--primary); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0;">
                        ${msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div><strong>${msg.name}</strong></div>
                        <div style="font-size: 13px; color: var(--text-muted);">Subject: ${msg.subject}</div>
                    </div>
                </div>
            `;
            document.getElementById('replySubject').value = `Re: ${msg.subject}`;
            document.getElementById('replyContent').value = '';
            document.getElementById('replyCharCount').textContent = '0';
            document.getElementById('replyModal').style.display = 'flex';
            document.getElementById('replyContent').focus();
        }
    }).catch(error => {
        showToast('Failed to load message: ' + error.message, 'error');
    });
}

function openReplyFromView() {
    if (viewMessageId) {
        closeViewMessageModal();
        setTimeout(() => openReply(viewMessageId), 300);
    }
}

async function sendReply() {
    const reply = document.getElementById('replyContent').value.trim();
    const subject = document.getElementById('replySubject').value.trim();
    const sendCopy = document.getElementById('sendCopy').checked;
    
    if (!reply) {
        showToast('Please enter a reply message', 'warning');
        document.getElementById('replyContent').focus();
        return;
    }

    const btn = document.getElementById('sendReplyBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;

    try {
        await API.replyMessage(currentMessageId, reply);
        showToast('Reply sent successfully!', 'success');
        closeReplyModal();
        loadMessages(currentPage);
        loadMessageStats();
    } catch (error) {
        showToast('Failed to send reply: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function deleteMessage(id) {
    deleteTargetId = id;
    document.getElementById('deleteMessage').textContent = 'This will permanently delete this message.';
    document.getElementById('deleteModal').style.display = 'flex';
}

function deleteFromView() {
    if (viewMessageId) {
        closeViewMessageModal();
        setTimeout(() => deleteMessage(viewMessageId), 300);
    }
}

async function confirmDelete() {
    if (!deleteTargetId) return;
    
    try {
        await API.deleteMessage(deleteTargetId);
        showToast('Message deleted successfully!', 'success');
        closeDeleteModal();
        loadMessages(currentPage);
        loadMessageStats();
    } catch (error) {
        showToast('Failed to delete message: ' + error.message, 'error');
    }
    deleteTargetId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteTargetId = null;
}

function closeViewMessageModal() {
    document.getElementById('viewMessageModal').style.display = 'none';
    viewMessageId = null;
}

function closeReplyModal() {
    document.getElementById('replyModal').style.display = 'none';
    currentMessageId = null;
}

function refreshMessages() {
    showToast('Refreshing messages...', 'info');
    loadMessages(currentPage);
    loadMessageStats();
}

function exportMessages() {
    const rows = document.querySelectorAll('#messagesTableBody tr');
    if (rows.length === 0 || rows[0].classList.contains('text-center')) {
        showToast('No messages to export', 'warning');
        return;
    }
    
    let csv = 'ID,Name,Subject,Status,Received\n';
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 6) {
            const id = cols[1]?.textContent.trim() || '';
            const name = cols[2]?.querySelector('div div:first-child')?.textContent.trim() || '';
            const subject = cols[3]?.querySelector('span')?.textContent.trim() || '';
            const status = cols[4]?.textContent.trim() || '';
            const received = cols[5]?.textContent.trim() || '';
            csv += `${id},${name},${subject},${status},${received}\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Messages exported successfully!', 'success');
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
window.loadMessages = loadMessages;
window.viewMessage = viewMessage;
window.openReply = openReply;
window.openReplyFromView = openReplyFromView;
window.sendReply = sendReply;
window.deleteMessage = deleteMessage;
window.deleteFromView = deleteFromView;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.closeViewMessageModal = closeViewMessageModal;
window.closeReplyModal = closeReplyModal;
window.markAsRead = markAsRead;
window.insertTemplate = insertTemplate;
window.toggleMessageSelect = toggleMessageSelect;
window.toggleSelectAll = toggleSelectAll;
window.bulkMessageAction = bulkMessageAction;
window.exportMessages = exportMessages;
window.refreshMessages = refreshMessages;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;