// admin/js/payments.js - Cash Payment Management
let currentPage = 1;
let deleteTargetId = null;
let pinTargetUserId = null;
const limit = 20;

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadPayments();
    loadPaymentStats();
    loadUsersForDropdown();

    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
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

// ============================================
// ADMIN PROFILE
// ============================================
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
// USERS DROPDOWN
// ============================================
async function loadUsersForDropdown() {
    try {
        const result = await API.getUsers({ limit: 1000 });
        if (result.success) {
            const select = document.getElementById('paymentUser');
            const users = result.data || [];
            select.innerHTML = `
                <option value="">Select user</option>
                ${users.map(u => `<option value="${u.id}">${u.firstname} ${u.lastname} (${u.phone || 'No phone'})</option>`).join('')}
            `;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ============================================
// PAYMENT STATS
// ============================================
async function loadPaymentStats() {
    try {
        const result = await API.getPaymentStats();
        if (result.success) {
            const stats = result.data;
            document.getElementById('totalPayments').textContent = stats.total || 0;
            document.getElementById('confirmedPayments').textContent = stats.confirmed || 0;
            document.getElementById('pendingPayments').textContent = stats.pending || 0;
            document.getElementById('totalRevenue').textContent = (stats.revenue || 0).toLocaleString() + ' XAF';
            document.getElementById('pendingCount').textContent = stats.pending || 0;
        }
    } catch (error) {
        console.error('Error loading payment stats:', error);
    }
}

// ============================================
// LOAD PAYMENTS
// ============================================
async function loadPayments(page = 1) {
    currentPage = page;
    
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;
    const plan = document.getElementById('planFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    try {
        let dateParams = {};
        if (dateFilter === 'today') {
            const today = new Date();
            dateParams = { start: today.toISOString().split('T')[0] };
        } else if (dateFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateParams = { start: weekAgo.toISOString().split('T')[0] };
        } else if (dateFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateParams = { start: monthAgo.toISOString().split('T')[0] };
        }

        const result = await API.getPayments({
            page,
            limit,
            search: search || undefined,
            status: status || undefined,
            plan: plan || undefined,
            ...dateParams
        });

        if (result.success) {
            const data = result.data || [];
            renderPayments(data);
            renderPagination(result.pagination || {});
            document.getElementById('tableInfo').textContent = 
                `Showing ${data.length} of ${result.pagination?.total || 0} payments`;
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        document.getElementById('paymentsTableBody').innerHTML = `
            <tr><td colspan="8" class="text-center error">
                <i class="fas fa-exclamation-triangle"></i> Failed to load payments. Please try again.
            </td></tr>
        `;
    }
}

// ============================================
// RENDER PAYMENTS
// ============================================
function renderPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 60px 20px;">
                    <i class="fas fa-receipt" style="font-size: 48px; display: block; margin-bottom: 16px; color: var(--text-muted);"></i>
                    <h3 style="margin-bottom: 8px;">No payments found</h3>
                    <p style="color: var(--text-muted);">Payments will appear here when users request cash payments.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const statusColors = {
        pending: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'badge-danger'
    };
    
    const statusIcons = {
        pending: '⏳',
        completed: '✅',
        cancelled: '❌'
    };
    
    const planLabels = {
        daily: '☀️ Daily',
        weekly: '📅 Weekly',
        monthly: '📆 Monthly',
        annual: '📈 Annual'
    };
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>#${payment.id}</td>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-small" style="width: 28px; height: 28px; font-size: 10px;">
                        ${(payment.user_name || 'U')[0].toUpperCase()}
                    </div>
                    <span>${payment.user_name || 'Unknown'}</span>
                </div>
            </td>
            <td><span style="font-family: monospace;">${payment.user_phone || 'N/A'}</span></td>
            <td><span class="badge badge-info">${planLabels[payment.subscription_type] || payment.subscription_type}</span></td>
            <td><strong>${(payment.amount || 0).toLocaleString()} XAF</strong></td>
            <td>
                <span class="badge ${statusColors[payment.status] || 'badge-secondary'}">
                    ${statusIcons[payment.status] || ''} ${payment.status || 'Unknown'}
                </span>
                ${payment.pin ? `<br><small style="color: var(--success);">🔑 PIN: ${payment.pin}</small>` : ''}
            </td>
            <td>${new Date(payment.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    ${payment.status === 'pending' ? `
                        <button onclick="showGeneratePinModal(${payment.user_id}, '${payment.subscription_type}')" class="btn-sm btn-success" title="Generate PIN (Cash Received)">
                            <i class="fas fa-key"></i> Generate PIN
                        </button>
                    ` : `
                        <button onclick="viewPaymentDetails(${payment.id})" class="btn-sm btn-info" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    `}
                    ${payment.pin ? `
                        <button onclick="copyPin('${payment.pin}')" class="btn-sm btn-secondary" title="Copy PIN">
                            <i class="fas fa-copy"></i>
                        </button>
                    ` : ''}
                    <button onclick="deletePayment(${payment.id})" class="btn-sm btn-danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    const totalPages = pagination.totalPages || 1;
    
    html += `<button onclick="loadPayments(1)" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
    </button>`;
    html += `<button onclick="loadPayments(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
    </button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="loadPayments(1)">1</button>`;
        if (startPage > 2) html += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadPayments(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<button onclick="loadPayments(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button onclick="loadPayments(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
    </button>`;
    html += `<button onclick="loadPayments(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

// ============================================
// GENERATE PIN (Admin - After Cash Payment)
// ============================================
function showGeneratePinModal(userId, plan) {
    pinTargetUserId = userId;
    
    // Get user details
    API.getUser(userId).then(result => {
        if (result.success) {
            const user = result.data;
            document.getElementById('pinUserInfo').innerHTML = `
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 48px; margin-bottom: 8px;">💵</div>
                    <h3>Generate PIN for Cash Payment</h3>
                    <p style="color: var(--text-muted);">Confirm you have received cash payment from this user.</p>
                </div>
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 16px;">
                    <div class="detail-row">
                        <span class="label">User</span>
                        <span class="value"><strong>${user.firstname} ${user.lastname}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Phone</span>
                        <span class="value">${user.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Plan</span>
                        <span class="value"><span class="badge badge-info">${plan}</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount</span>
                        <span class="value"><strong style="color: var(--success);">${getPlanPrice(plan)} XAF</strong></span>
                    </div>
                </div>
                <div style="padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 16px;">
                    <p style="font-size: 13px; color: #92400e; margin: 0;">
                        <i class="fas fa-info-circle"></i> 
                        Generate a PIN for this user after confirming you have received the cash payment.
                    </p>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="sendPinSms" checked>
                        Send PIN via SMS
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="printPin" checked>
                        Show PIN on screen
                    </label>
                </div>
            `;
            document.getElementById('generatePinModal').style.display = 'flex';
        }
    }).catch(error => {
        showToast('Failed to load user details', 'error');
    });
}

function getPlanPrice(plan) {
    const prices = { daily: 150, weekly: 800, monthly: 2500, annual: 15000 };
    return prices[plan] || 0;
}

async function confirmGeneratePin() {
    if (!pinTargetUserId) return;
    
    const plan = document.getElementById('paymentPlan')?.value || 'monthly';
    const sendSms = document.getElementById('sendPinSms')?.checked || false;
    const printPin = document.getElementById('printPin')?.checked || false;
    
    const btn = document.querySelector('#generatePinModal .modal-footer .btn-success');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;
    
    try {
        const result = await API.generatePinForUser({
            userId: pinTargetUserId,
            plan: plan
        });
        
        if (result.success) {
            const pin = result.data.pin;
            const user = result.data.user;
            
            let message = `✅ PIN generated successfully!`;
            if (printPin) {
                message += `\n\n📌 PIN: ${pin}`;
                message += `\n👤 User: ${user.name}`;
                message += `\n📱 Phone: ${user.phone}`;
                message += `\n📆 Plan: ${result.data.plan}`;
                message += `\n⏰ Expires: ${new Date(result.data.expiresAt).toLocaleDateString()}`;
            }
            
            showToast(message, 'success');
            
            // Copy PIN to clipboard automatically
            await navigator.clipboard.writeText(pin);
            
            closeGeneratePinModal();
            loadPayments(currentPage);
            loadPaymentStats();
        } else {
            showToast(result.message || 'Failed to generate PIN', 'error');
        }
    } catch (error) {
        showToast('Failed to generate PIN: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function closeGeneratePinModal() {
    document.getElementById('generatePinModal').style.display = 'none';
    pinTargetUserId = null;
}

// ============================================
// COPY PIN
// ============================================
function copyPin(pin) {
    navigator.clipboard.writeText(pin).then(() => {
        showToast('PIN copied to clipboard!', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = pin;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('PIN copied to clipboard!', 'success');
    });
}

// ============================================
// VIEW PAYMENT DETAILS
// ============================================
async function viewPaymentDetails(paymentId) {
    try {
        const result = await API.getPayments({ limit: 1000 });
        const payment = result.data?.find(p => p.id === paymentId);
        
        if (!payment) {
            showToast('Payment not found', 'error');
            return;
        }
        
        document.getElementById('paymentDetails').innerHTML = `
            <div style="padding: 10px 0;">
                <div style="text-align: center; font-size: 48px; margin-bottom: 12px;">📄</div>
                <h3 style="text-align: center; margin-bottom: 16px;">Payment Details</h3>
                <div class="detail-row">
                    <span class="label">ID</span>
                    <span class="value">#${payment.id}</span>
                </div>
                <div class="detail-row">
                    <span class="label">User</span>
                    <span class="value"><strong>${payment.user_name || 'Unknown'}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="label">Phone</span>
                    <span class="value">${payment.user_phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Plan</span>
                    <span class="value">${payment.subscription_type || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Amount</span>
                    <span class="value"><strong style="color: var(--primary);">${(payment.amount || 0).toLocaleString()} XAF</strong></span>
                </div>
                <div class="detail-row">
                    <span class="label">Transaction ID</span>
                    <span class="value"><code>${payment.transaction_id || 'N/A'}</code></span>
                </div>
                <div class="detail-row">
                    <span class="label">Status</span>
                    <span class="value"><span class="badge ${payment.status === 'completed' ? 'badge-success' : 'badge-warning'}">${payment.status || 'Unknown'}</span></span>
                </div>
                ${payment.pin ? `
                <div style="margin-top: 16px; padding: 16px; background: #d1fae5; border-radius: 8px; border: 2px dashed #10b981; text-align: center;">
                    <p style="font-size: 14px; color: #065f46; margin-bottom: 4px;">🔑 PIN Code</p>
                    <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #065f46; font-family: monospace;">${payment.pin}</p>
                    <button onclick="copyPin('${payment.pin}')" class="btn-sm btn-secondary" style="margin-top: 4px;">
                        <i class="fas fa-copy"></i> Copy PIN
                    </button>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="label">Date</span>
                    <span class="value">${new Date(payment.created_at).toLocaleString()}</span>
                </div>
                ${payment.notes ? `
                <div class="detail-row" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
                    <span class="label">Notes</span>
                    <span class="value">${payment.notes}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('paymentDetailsModal').style.display = 'flex';
    } catch (error) {
        showToast('Failed to load payment details: ' + error.message, 'error');
    }
}

function closePaymentDetailsModal() {
    document.getElementById('paymentDetailsModal').style.display = 'none';
}

// ============================================
// DELETE PAYMENT
// ============================================
function deletePayment(id) {
    deleteTargetId = id;
    document.getElementById('deleteMessage').textContent = 'This will permanently delete this payment record.';
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!deleteTargetId) return;
    
    try {
        await API.deletePayment(deleteTargetId);
        showToast('Payment deleted successfully!', 'success');
        closeDeleteModal();
        loadPayments(currentPage);
        loadPaymentStats();
    } catch (error) {
        showToast('Failed to delete payment: ' + error.message, 'error');
    }
    deleteTargetId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteTargetId = null;
}

// ============================================
// EXPORT
// ============================================
function exportPayments() {
    const rows = document.querySelectorAll('#paymentsTableBody tr');
    if (rows.length === 0 || rows[0].classList.contains('text-center')) {
        showToast('No payments to export', 'warning');
        return;
    }
    
    let csv = 'ID,User,Phone,Plan,Amount,Status,PIN,Date\n';
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 8) {
            const id = cols[0]?.textContent.trim() || '';
            const user = cols[1]?.textContent.trim() || '';
            const phone = cols[2]?.textContent.trim() || '';
            const plan = cols[3]?.textContent.trim() || '';
            const amount = cols[4]?.textContent.trim() || '';
            const status = cols[5]?.textContent.trim() || '';
            const pin = cols[5]?.querySelector('small')?.textContent?.replace('🔑 PIN: ', '') || '';
            const date = cols[6]?.textContent.trim() || '';
            csv += `${id},${user},${phone},${plan},${amount},${status},${pin},${date}\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Payments exported successfully!', 'success');
}

function refreshPayments() {
    showToast('Refreshing payments...', 'info');
    loadPayments(currentPage);
    loadPaymentStats();
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
window.loadPayments = loadPayments;
window.showGeneratePinModal = showGeneratePinModal;
window.confirmGeneratePin = confirmGeneratePin;
window.closeGeneratePinModal = closeGeneratePinModal;
window.copyPin = copyPin;
window.viewPaymentDetails = viewPaymentDetails;
window.closePaymentDetailsModal = closePaymentDetailsModal;
window.deletePayment = deletePayment;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.exportPayments = exportPayments;
window.refreshPayments = refreshPayments;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;