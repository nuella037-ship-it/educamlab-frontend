// js/dashboard.js - Complete Dashboard with Frontend Data Sync
let revenueChart = null;
let subscriptionChart = null;
let chartType = 'bar';
let currentFilter = 'all';
let notificationInterval = null;
let refreshInterval = null;

// Frontend Data Paths
const DATA_PATHS = {
    oLevel: '../frontend/public/data/o-level/',
    aLevel: '../frontend/public/data/a-level/'
};

// Subject Lists
const O_LEVEL_SUBJECTS = [
    'accounting', 'additional-mathematics', 'art-design', 'biology', 
    'chemistry', 'commerce', 'computer-science', 'economics', 
    'english', 'french', 'geography', 'history', 'literature', 
    'mathematics', 'physics', 'principles-of-accounts', 'religious-studies'
];

const A_LEVEL_SUBJECTS = [
    'accounting', 'biology', 'chemistry', 'computer-science',
    'economics', 'english', 'french', 'geography', 'history',
    'mathematics', 'physics'
];

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);

    loadDashboard();
    loadAdminProfile();
    checkNotifications();
    loadActivityFeed();
    loadCharts();

    notificationInterval = setInterval(checkNotifications, 30000);
    refreshInterval = setInterval(refreshData, 300000);

    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
    });
});

function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentDateTime').textContent = `${dateStr} • ${timeStr}`;
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
    
    loadCharts();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
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

async function loadDashboard() {
    try {
        // Load from API first, fallback to local data
        let apiData = null;
        try {
            const result = await API.getDashboardStats();
            if (result.success) {
                apiData = result.data;
            }
        } catch (e) {
            console.log('API not available, using local data');
        }

        // Get course counts from frontend data
        const oLevelCount = O_LEVEL_SUBJECTS.length;
        const aLevelCount = A_LEVEL_SUBJECTS.length;
        const totalCourses = oLevelCount + aLevelCount;

        // Get data from localStorage or use defaults
        const totalUsers = parseInt(localStorage.getItem('adminTotalUsers')) || 0;
        const totalRevenue = parseInt(localStorage.getItem('adminTotalRevenue')) || 0;
        const totalPins = parseInt(localStorage.getItem('adminTotalPins')) || 0;
        const totalMessages = parseInt(localStorage.getItem('adminTotalMessages')) || 0;
        const verifiedUsers = parseInt(localStorage.getItem('adminVerifiedUsers')) || 0;
        const newUsers = parseInt(localStorage.getItem('adminNewUsers')) || 0;
        const subscribedUsers = parseInt(localStorage.getItem('adminSubscribedUsers')) || 0;

        // Update stats
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalCourses').textContent = totalCourses;
        document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString() + ' XAF';
        document.getElementById('totalPins').textContent = totalPins;
        document.getElementById('totalMessages').textContent = totalMessages;

        // Update sidebar badges
        document.getElementById('userCount').textContent = totalUsers;
        document.getElementById('courseCount').textContent = totalCourses;
        document.getElementById('pendingCount').textContent = totalPins;
        document.getElementById('messageCount').textContent = totalMessages;

        // Calculate stats
        const growthRate = totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0;
        document.getElementById('growthRate').textContent = growthRate + '%';
        document.getElementById('newUsers').textContent = newUsers;
        
        const conversionRate = totalUsers > 0 && subscribedUsers > 0 
            ? ((subscribedUsers / totalUsers) * 100).toFixed(1) 
            : 0;
        document.getElementById('conversionRate').textContent = conversionRate + '%';
        
        const pendingActions = totalMessages + totalPins;
        document.getElementById('pendingActions').textContent = pendingActions;

        // Update stat changes
        updateStatChanges({ totalUsers, totalCourses, totalRevenue, totalMessages, totalPins });

        // Render recent users and payments from localStorage or API
        const recentUsers = JSON.parse(localStorage.getItem('adminRecentUsers')) || [];
        const recentPayments = JSON.parse(localStorage.getItem('adminRecentPayments')) || [];
        renderRecentUsers(recentUsers);
        renderRecentPayments(recentPayments);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function updateStatChanges(data) {
    const userChange = document.getElementById('userChange');
    const courseChange = document.getElementById('courseChange');
    const revenueChange = document.getElementById('revenueChange');
    const messageChange = document.getElementById('messageChange');
    const pinChange = document.getElementById('pinChange');
    
    userChange.textContent = '+12%';
    userChange.className = 'stat-change positive';
    
    courseChange.textContent = '+8%';
    courseChange.className = 'stat-change positive';
    
    revenueChange.textContent = '+23%';
    revenueChange.className = 'stat-change positive';
    
    const pins = document.getElementById('totalPins').textContent;
    if (parseInt(pins) > 0) {
        pinChange.textContent = `${pins} active`;
        pinChange.className = 'stat-change positive';
    } else {
        pinChange.textContent = 'No active';
        pinChange.className = 'stat-change';
    }
    
    const newMessages = document.getElementById('totalMessages').textContent;
    if (parseInt(newMessages) > 0) {
        messageChange.textContent = `+${newMessages} new`;
        messageChange.className = 'stat-change positive';
    } else {
        messageChange.textContent = 'No new';
        messageChange.className = 'stat-change';
    }
}

function renderRecentUsers(users) {
    const tbody = document.getElementById('recentUsers');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">
                <i class="fas fa-users" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                No users yet
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.slice(0, 5).map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-small" style="background: ${user.is_verified ? 'var(--primary)' : 'var(--text-muted)'};">
                        ${(user.firstname || 'U')[0].toUpperCase()}${(user.lastname || '')[0].toUpperCase()}
                    </div>
                    <span>${user.firstname} ${user.lastname}</span>
                </div>
            </td>
            <td><span style="font-family: monospace;">${user.phone || 'N/A'}</span></td>
            <td><span class="badge ${user.is_verified ? 'badge-success' : 'badge-warning'}">${user.is_verified ? 'Verified' : 'Pending'}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function renderRecentPayments(payments) {
    const tbody = document.getElementById('recentPayments');
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">
                <i class="fas fa-credit-card" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                No payments yet
            </td></tr>
        `;
        return;
    }
    
    const statusColors = {
        completed: 'badge-success',
        pending: 'badge-warning',
        failed: 'badge-danger',
        refunded: 'badge-secondary'
    };
    
    tbody.innerHTML = payments.slice(0, 5).map(payment => `
        <tr>
            <td>${payment.user_name || 'Unknown'}</td>
            <td><strong>${(payment.amount || 0).toLocaleString()} XAF</strong></td>
            <td><span class="badge badge-info">${payment.subscription_type || 'N/A'}</span></td>
            <td>
                <span class="badge ${statusColors[payment.status] || 'badge-secondary'}">${payment.status || 'Unknown'}</span>
                ${payment.pin ? `<br><small style="color: var(--success);">🔑 ${payment.pin}</small>` : ''}
            </td>
        </tr>
    `).join('');
}

// ============================================
// CHARTS
// ============================================
async function loadCharts() {
    try {
        // Try to get data from API, fallback to localStorage
        let payments = JSON.parse(localStorage.getItem('adminPayments')) || [];
        
        try {
            const result = await API.getPayments({ limit: 1000 });
            if (result.success && result.data) {
                payments = result.data;
                localStorage.setItem('adminPayments', JSON.stringify(payments));
            }
        } catch (e) {
            console.log('Using cached payment data');
        }
        
        updateRevenueChart(payments);
        updateSubscriptionChart(payments);
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

function updateRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChart) { revenueChart.destroy(); }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#d1d5db' : '#6b7280';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    // Group by date
    const grouped = {};
    data.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString();
        if (!grouped[date]) grouped[date] = { revenue: 0, successful: 0 };
        grouped[date].revenue += p.amount || 0;
        if (p.status === 'completed') grouped[date].successful += p.amount || 0;
    });

    const labels = Object.keys(grouped);
    const revenueData = labels.map(d => grouped[d].revenue);
    const successfulData = labels.map(d => grouped[d].successful);

    const isBar = chartType === 'bar';
    
    revenueChart = new Chart(ctx, {
        type: isBar ? 'bar' : 'line',
        data: {
            labels: labels.slice(-30),
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData.slice(-30),
                    backgroundColor: isBar ? 'rgba(79, 70, 229, 0.8)' : 'rgba(79, 70, 229, 0.1)',
                    borderColor: '#4f46e5',
                    borderWidth: isBar ? 2 : 3,
                    borderRadius: isBar ? 4 : 0,
                    tension: 0.4,
                    fill: !isBar
                },
                {
                    label: 'Successful Revenue',
                    data: successfulData.slice(-30),
                    backgroundColor: isBar ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.1)',
                    borderColor: '#10b981',
                    borderWidth: isBar ? 2 : 3,
                    borderRadius: isBar ? 4 : 0,
                    tension: 0.4,
                    fill: !isBar
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, font: { size: 12, family: 'Inter' }, padding: 16, usePointStyle: true }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1f2937' : 'white',
                    titleColor: isDark ? '#f9fafb' : '#1f2937',
                    bodyColor: isDark ? '#d1d5db' : '#4b5563',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' XAF';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, callback: function(value) { return value.toLocaleString() + ' XAF'; } },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor, maxRotation: 45 },
                    grid: { color: gridColor, display: false }
                }
            }
        }
    });
}

function updateSubscriptionChart(data) {
    const ctx = document.getElementById('subscriptionChart').getContext('2d');
    if (subscriptionChart) { subscriptionChart.destroy(); }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#d1d5db' : '#6b7280';

    const colors = {
        daily: '#3b82f6',
        weekly: '#8b5cf6',
        monthly: '#4f46e5',
        annual: '#10b981'
    };

    const planLabels = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        annual: 'Annual'
    };

    const counts = {};
    data.forEach(p => {
        if (p.subscription_type) {
            counts[p.subscription_type] = (counts[p.subscription_type] || 0) + 1;
        }
    });

    const chartData = Object.keys(counts).map(key => ({
        label: planLabels[key] || key,
        value: counts[key],
        color: colors[key] || '#6b7280'
    }));

    subscriptionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(item => item.label),
            datasets: [{
                data: chartData.map(item => item.value),
                backgroundColor: chartData.map(item => item.color),
                borderWidth: 3,
                borderColor: isDark ? '#1f2937' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { size: 12, family: 'Inter' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1f2937' : 'white',
                    titleColor: isDark ? '#f9fafb' : '#1f2937',
                    bodyColor: isDark ? '#d1d5db' : '#4b5563',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// ACTIVITY FEED
// ============================================
function filterActivity(filter) {
    currentFilter = filter;
    document.querySelectorAll('.activity-filter button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
        if (btn.dataset.filter === filter) {
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--primary)';
        } else {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.color = 'var(--text-muted)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });
    loadActivityFeed();
}

async function loadActivityFeed() {
    try {
        const result = await API.getActivities({ limit: 10 });
        
        if (result.success) {
            let activities = result.data || [];
            
            if (currentFilter !== 'all') {
                activities = activities.filter(a => {
                    if (currentFilter === 'pin') {
                        return a.activity_type === 'pin_generated' || a.activity_type === 'pin_used';
                    }
                    return a.activity_type === currentFilter;
                });
            }
            
            renderActivityFeed(activities);
        }
    } catch (error) {
        console.error('Error loading activity feed:', error);
        // Use sample data if API fails
        renderActivityFeed([]);
    }
}

function renderActivityFeed(activities) {
    const feed = document.getElementById('activityFeed');
    
    if (!activities || activities.length === 0) {
        feed.innerHTML = `
            <div class="activity-empty">
                <i class="fas fa-inbox"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    const icons = {
        login: '🔑', registration: '📝', verification: '✅',
        payment: '💰', pin_generated: '🔑', pin_used: '🔐',
        enrollment: '📚', admin: '🛡️', course: '📖', user: '👤'
    };
    
    const colors = {
        login: 'login', registration: 'registration', verification: 'verification',
        payment: 'payment', pin_generated: 'payment', pin_used: 'registration',
        enrollment: 'enrollment', admin: 'admin', course: 'admin', user: 'user'
    };
    
    feed.innerHTML = activities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${colors[activity.activity_type] || 'login'}">
                ${icons[activity.activity_type] || '📋'}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.description || activity.activity_type}</div>
                <div class="activity-desc">${activity.user_name || 'System'} ${activity.pin ? `🔑 ${activity.pin}` : ''}</div>
                <div class="activity-time">${timeAgo(activity.created_at)}</div>
            </div>
        </div>
    `).join('');
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

// ============================================
// NOTIFICATIONS
// ============================================
function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function markAllRead() {
    document.getElementById('notificationBadge').style.display = 'none';
    document.getElementById('notificationsDropdown').style.display = 'none';
    document.getElementById('notificationsList').innerHTML = `
        <div style="text-align: center; padding: 30px 16px; color: var(--text-muted);">
            <i class="fas fa-check-circle" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
            <p>All notifications read!</p>
        </div>
    `;
}

async function checkNotifications() {
    try {
        const messages = await API.getMessages({ status: 'new', limit: 5 });
        const payments = await API.getPayments({ status: 'pending', limit: 5 });
        
        const newMessages = messages.data || [];
        const pendingPayments = payments.data || [];
        const total = newMessages.length + pendingPayments.length;
        
        const badge = document.getElementById('notificationBadge');
        
        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
        
        updateNotificationList(newMessages, pendingPayments);
        
    } catch (error) {
        console.error('Notification check failed:', error);
    }
}

function updateNotificationList(messages, payments) {
    const list = document.getElementById('notificationsList');
    let html = '';
    
    if (messages.length > 0) {
        html += `<div style="padding: 8px 16px;"><strong>📧 New Messages (${messages.length})</strong></div>`;
        messages.slice(0, 3).forEach(msg => {
            html += `
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 16px; cursor: pointer; transition: background 0.2s;" onclick="window.location.href='messages.html'" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                    <span style="font-size: 20px;">✉️</span>
                    <div>
                        <div style="font-weight: 500; font-size: 13px;">${msg.subject}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">From: ${msg.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${timeAgo(msg.created_at)}</div>
                    </div>
                </div>
            `;
        });
        if (messages.length > 3) {
            html += `<div style="padding: 4px 16px; font-size: 12px; color: var(--text-muted);">+${messages.length - 3} more</div>`;
        }
    }
    
    if (payments.length > 0) {
        html += `<div style="padding: 8px 16px; border-top: 1px solid var(--border-color);"><strong>💳 Pending Payments (${payments.length})</strong></div>`;
        payments.slice(0, 3).forEach(p => {
            html += `
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 16px; cursor: pointer; transition: background 0.2s;" onclick="window.location.href='payments.html'" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                    <span style="font-size: 20px;">⏳</span>
                    <div>
                        <div style="font-weight: 500; font-size: 13px;">${p.user_name || 'Unknown'} - ${(p.amount || 0).toLocaleString()} XAF</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${p.subscription_type || 'N/A'}</div>
                    </div>
                </div>
            `;
        });
        if (payments.length > 3) {
            html += `<div style="padding: 4px 16px; font-size: 12px; color: var(--text-muted);">+${payments.length - 3} more</div>`;
        }
    }
    
    if (!html) {
        html = `
            <div style="text-align: center; padding: 30px 16px; color: var(--text-muted);">
                <i class="fas fa-check-circle" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                <p>All caught up!</p>
            </div>
        `;
    }
    
    list.innerHTML = html;
}

// ============================================
// QUICK ACTIONS
// ============================================
function showQuickAction(type) {
    const modal = document.getElementById('quickActionModal');
    const title = document.getElementById('quickActionTitle');
    const body = document.getElementById('quickActionBody');
    
    if (type === 'user') {
        title.textContent = 'Add New User';
        body.innerHTML = `
            <form onsubmit="quickAddUser(event)">
                <div class="form-group">
                    <label>Full Name <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="qaName" placeholder="John Doe" required>
                </div>
                <div class="form-group">
                    <label>Phone Number <span style="color: var(--danger);">*</span></label>
                    <input type="tel" id="qaPhone" placeholder="677123456" required>
                    <small class="form-hint">Enter phone number without country code</small>
                </div>
                <div class="form-group">
                    <label>Password <span style="color: var(--danger);">*</span></label>
                    <input type="password" id="qaPassword" placeholder="Password123!" required minlength="8">
                </div>
                <button type="submit" class="btn-primary" style="width:100%; justify-content: center;">Create User</button>
            </form>
        `;
    } else if (type === 'payment') {
        title.textContent = 'Record Payment';
        body.innerHTML = `
            <form onsubmit="quickAddPayment(event)">
                <div class="form-group">
                    <label>User <span style="color: var(--danger);">*</span></label>
                    <select id="qaPaymentUser" required>
                        <option value="">Select user</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Plan <span style="color: var(--danger);">*</span></label>
                    <select id="qaPaymentPlan" required>
                        <option value="">Select plan</option>
                        <option value="daily">☀️ Daily - 150 XAF</option>
                        <option value="weekly">📅 Weekly - 800 XAF</option>
                        <option value="monthly">📆 Monthly - 2,500 XAF</option>
                        <option value="annual">📈 Annual - 15,000 XAF</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Method <span style="color: var(--danger);">*</span></label>
                    <select id="qaPaymentMethod" required>
                        <option value="">Select method</option>
                        <option value="orange-money">📱 Orange Money</option>
                        <option value="mtn-mobile-money">📱 MTN Mobile Money</option>
                        <option value="bank-transfer">🏦 Bank Transfer</option>
                        <option value="cash">💵 Cash</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary" style="width:100%; justify-content: center;">Record Payment</button>
            </form>
        `;
        API.getUsers({ limit: 1000 }).then(result => {
            if (result.success) {
                const select = document.getElementById('qaPaymentUser');
                const users = result.data || [];
                select.innerHTML = `
                    <option value="">Select user</option>
                    ${users.map(u => `<option value="${u.id}">${u.firstname} ${u.lastname} (${u.phone || 'No phone'})</option>`).join('')}
                `;
            }
        }).catch(() => {});
    }
    
    modal.style.display = 'flex';
}

async function quickAddUser(event) {
    event.preventDefault();
    const name = document.getElementById('qaName').value.trim().split(' ');
    const phone = document.getElementById('qaPhone').value.trim();
    const password = document.getElementById('qaPassword').value;
    
    try {
        await API.createUser({
            firstname: name[0] || '',
            lastname: name.slice(1).join(' ') || '',
            phone: phone,
            password: password
        });
        showToast('User created successfully!', 'success');
        closeQuickAction();
        refreshData();
    } catch (error) {
        showToast('Failed to create user: ' + error.message, 'error');
    }
}

async function quickAddPayment(event) {
    event.preventDefault();
    const userId = document.getElementById('qaPaymentUser').value;
    const plan = document.getElementById('qaPaymentPlan').value;
    const paymentMethod = document.getElementById('qaPaymentMethod').value;
    
    const planPrices = { daily: 150, weekly: 800, monthly: 2500, annual: 15000 };
    
    try {
        await API.createManualPayment({
            userId: parseInt(userId),
            plan: plan,
            amount: planPrices[plan],
            paymentMethod: paymentMethod
        });
        showToast('Payment recorded successfully!', 'success');
        closeQuickAction();
        refreshData();
    } catch (error) {
        showToast('Failed to record payment: ' + error.message, 'error');
    }
}

function closeQuickAction() {
    document.getElementById('quickActionModal').style.display = 'none';
}

// ============================================
// SEARCH
// ============================================
function globalSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query || query.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    Promise.all([
        API.getUsers({ search: query, limit: 5 }),
        API.getCourses({ search: query, limit: 5 })
    ]).then(([users, courses]) => {
        let html = '';
        
        if (users.success && users.data && users.data.length > 0) {
            html += `<div style="padding: 8px 16px;"><strong>Users</strong></div>`;
            users.data.slice(0, 3).forEach(user => {
                html += `<div class="search-item" onclick="window.location.href='users.html'" style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                    <i class="fas fa-user"></i> ${user.firstname} ${user.lastname}
                    <span style="margin-left: auto; font-size: 12px; color: var(--text-muted);">${user.phone || ''}</span>
                </div>`;
            });
        }
        
        if (courses.success && courses.data && courses.data.length > 0) {
            html += `<div style="padding: 8px 16px; border-top: 1px solid var(--border-color);"><strong>Courses</strong></div>`;
            courses.data.slice(0, 3).forEach(course => {
                html += `<div class="search-item" onclick="window.location.href='courses.html'" style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                    <i class="fas fa-book"></i> ${course.title}
                    <span style="margin-left: auto; font-size: 12px; color: var(--text-muted);">${course.category}</span>
                </div>`;
            });
        }
        
        if (!html) {
            html = `<div style="padding: 20px 16px; text-align: center; color: var(--text-muted);">No results found for "${query}"</div>`;
        }
        
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
        
    }).catch(() => {
        resultsContainer.innerHTML = `<div style="padding: 20px 16px; text-align: center; color: var(--text-muted);">Search failed</div>`;
        resultsContainer.style.display = 'block';
    });
}

// ============================================
// CHART CONTROLS
// ============================================
function toggleChartType() {
    chartType = chartType === 'bar' ? 'line' : 'bar';
    const icon = document.getElementById('chartTypeIcon');
    icon.className = chartType === 'bar' ? 'fas fa-chart-bar' : 'fas fa-chart-line';
    loadCharts();
}

function updateChartPeriod() {
    loadCharts();
}

// ============================================
// REFRESH
// ============================================
function refreshData() {
    const icon = document.getElementById('refreshIcon');
    icon.classList.add('fa-spin');
    
    showToast('Refreshing data...', 'info');
    
    Promise.all([
        loadDashboard(),
        loadCharts(),
        loadActivityFeed(),
        checkNotifications()
    ]).then(() => {
        icon.classList.remove('fa-spin');
        showToast('Data refreshed successfully!', 'success');
    }).catch(() => {
        icon.classList.remove('fa-spin');
        showToast('Failed to refresh data', 'error');
    });
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

// ============================================
// LOGOUT
// ============================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        API.clearToken();
        window.location.href = 'login.html';
    }
}

// Global event listeners
document.addEventListener('click', function(e) {
    if (!e.target.closest('.header-search')) {
        document.getElementById('searchResults').style.display = 'none';
    }
});

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
    }
});

// Make functions globally available
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.toggleNotifications = toggleNotifications;
window.markAllRead = markAllRead;
window.filterActivity = filterActivity;
window.showQuickAction = showQuickAction;
window.closeQuickAction = closeQuickAction;
window.refreshData = refreshData;
window.updateChartPeriod = updateChartPeriod;
window.toggleChartType = toggleChartType;
window.globalSearch = globalSearch;
window.logout = logout;
window.quickAddUser = quickAddUser;
window.quickAddPayment = quickAddPayment;