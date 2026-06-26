// admin/js/activity.js - Complete Activity Log with Real-Time Tracking
let currentPage = 1;
let activityData = [];
let realTimeSocket = null;
let isRealTimeEnabled = false;
let realTimeBuffer = [];
let realTimeInterval = null;
const limit = 50;

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadActivities();
    loadActivityStats();
    initRealTimeTracking();

    // Date filter toggle
    document.getElementById('dateFilter').addEventListener('change', function() {
        const dateRange = document.getElementById('dateRange');
        if (this.value === 'custom') {
            dateRange.style.display = 'flex';
        } else {
            dateRange.style.display = 'none';
        }
        loadActivities();
    });

    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
});

// ============================================
// REAL-TIME TRACKING
// ============================================
function initRealTimeTracking() {
    const statusBadge = document.createElement('div');
    statusBadge.id = 'realtimeStatus';
    statusBadge.className = 'realtime-status offline';
    statusBadge.innerHTML = '<i class="fas fa-circle"></i> Offline';
    statusBadge.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 12px;';
    
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft) {
        const subtitle = headerLeft.querySelector('.subtitle');
        if (subtitle) {
            subtitle.appendChild(statusBadge);
        }
    }
    
    // Start real-time tracking
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'realtimeToggle';
    toggleBtn.className = 'btn-sm btn-secondary';
    toggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Live';
    toggleBtn.style.cssText = 'margin-left: 8px;';
    toggleBtn.onclick = toggleRealTime;
    
    if (document.querySelector('.header-right')) {
        document.querySelector('.header-right').appendChild(toggleBtn);
    }

    // Add auto-refresh toggle
    const autoRefreshBtn = document.createElement('button');
    autoRefreshBtn.id = 'autoRefreshToggle';
    autoRefreshBtn.className = 'btn-sm btn-secondary';
    autoRefreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Auto';
    autoRefreshBtn.style.cssText = 'margin-left: 4px;';
    autoRefreshBtn.onclick = toggleAutoRefresh;
    
    document.querySelector('.header-right').appendChild(autoRefreshBtn);

    // Track user activity
    trackUserActivity();
}

function toggleRealTime() {
    isRealTimeEnabled = !isRealTimeEnabled;
    const btn = document.getElementById('realtimeToggle');
    const status = document.getElementById('realtimeStatus');
    
    if (isRealTimeEnabled) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Stop Live';
        btn.className = 'btn-sm btn-danger';
        status.className = 'realtime-status online';
        status.style.color = '#10b981';
        status.innerHTML = '<i class="fas fa-circle"></i> Live';
        
        startRealTimeUpdates();
        showToast('Real-time tracking started!', 'success');
        logActivity('Started real-time tracking');
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Start Live';
        btn.className = 'btn-sm btn-secondary';
        status.className = 'realtime-status offline';
        status.style.color = 'var(--text-muted)';
        status.innerHTML = '<i class="fas fa-circle"></i> Offline';
        
        stopRealTimeUpdates();
        showToast('Real-time tracking stopped', 'info');
        logActivity('Stopped real-time tracking');
    }
}

function startRealTimeUpdates() {
    if (realTimeInterval) clearInterval(realTimeInterval);
    
    // Simulate real-time updates every 3 seconds
    realTimeInterval = setInterval(() => {
        if (isRealTimeEnabled) {
            fetchRealTimeActivity();
        }
    }, 3000);
}

function stopRealTimeUpdates() {
    if (realTimeInterval) {
        clearInterval(realTimeInterval);
        realTimeInterval = null;
    }
}

async function fetchRealTimeActivity() {
    try {
        const result = await API.getActivities({ limit: 5 });
        if (result.success) {
            const newActivities = result.data || [];
            if (newActivities.length > 0) {
                // Check for new activities (compare with current data)
                const latestIds = new Set(activityData.slice(0, 5).map(a => a.id));
                const newItems = newActivities.filter(a => !latestIds.has(a.id));
                
                if (newItems.length > 0) {
                    // Add new items to the top
                    activityData = [...newItems, ...activityData];
                    
                    // Update UI
                    renderActivities(activityData.slice(0, limit));
                    updateActivityFeed(newItems);
                    showRealTimeNotification(newItems.length);
                    
                    // Update stats
                    loadActivityStats();
                }
            }
        }
    } catch (error) {
        console.error('Real-time fetch error:', error);
    }
}

function updateActivityFeed(newItems) {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    
    // Get the latest activity item
    const latest = newItems[0];
    if (!latest) return;
    
    // Add to feed with animation
    const item = createActivityItem(latest);
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 10 items
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
}

function createActivityItem(activity) {
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
    
    const div = document.createElement('div');
    div.className = 'activity-item realtime-pulse';
    div.style.cssText = 'animation: slideIn 0.3s ease; border-left: 3px solid #10b981; padding-left: 12px;';
    div.innerHTML = `
        <div class="activity-icon ${colors[activity.activity_type] || 'login'}">
            ${icons[activity.activity_type] || '📋'}
        </div>
        <div class="activity-content">
            <div class="activity-title">🟢 ${activity.description || activity.activity_type}</div>
            <div class="activity-desc">${activity.user_name || 'System'} ${activity.pin ? `🔑 ${activity.pin}` : ''}</div>
            <div class="activity-time">Just now</div>
        </div>
        <span style="font-size: 10px; color: #10b981; font-weight: 700;">LIVE</span>
    `;
    
    return div;
}

function showRealTimeNotification(count) {
    const badge = document.getElementById('notificationBadge');
    const currentCount = parseInt(badge.textContent) || 0;
    const newCount = currentCount + count;
    
    if (newCount > 0) {
        badge.textContent = newCount;
        badge.style.display = 'inline';
        badge.style.animation = 'bounce 0.5s ease';
        setTimeout(() => {
            badge.style.animation = '';
        }, 500);
    }
}

function trackUserActivity() {
    // Track page views and interactions
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button, a, input, select');
        if (target) {
            const elementType = target.tagName.toLowerCase();
            const elementId = target.id || target.className || 'unknown';
            logUserInteraction(elementType, elementId);
        }
    });
}

function logUserInteraction(type, element) {
    // Only track if real-time is enabled
    if (!isRealTimeEnabled) return;
    
    // Send to server (simulated)
    console.log(`[RealTime] User interaction: ${type} on ${element}`);
}

function toggleAutoRefresh() {
    const btn = document.getElementById('autoRefreshToggle');
    const isActive = btn.style.color === 'var(--primary)';
    
    if (isActive) {
        btn.style.color = 'var(--text-muted)';
        btn.style.background = 'var(--bg-secondary)';
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Auto';
        showToast('Auto-refresh disabled', 'info');
    } else {
        btn.style.color = 'var(--primary)';
        btn.style.background = 'rgba(79, 70, 229, 0.1)';
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Auto';
        showToast('Auto-refresh enabled (30s)', 'success');
        
        // Set up auto-refresh
        if (window.autoRefreshInterval) clearInterval(window.autoRefreshInterval);
        window.autoRefreshInterval = setInterval(() => {
            loadActivities(currentPage);
        }, 30000);
    }
}

// ============================================
// ADD TO CSS
// ============================================
// These styles should be added to admin/css/style.css

/*
.realtime-pulse {
    animation: pulse-green 2s ease-in-out infinite;
}

@keyframes pulse-green {
    0%, 100% { border-left-color: #10b981; }
    50% { border-left-color: #6ee7b7; }
}

@keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
}

.realtime-status.online {
    color: #10b981;
}

.realtime-status.offline {
    color: var(--text-muted);
}

.activity-item.realtime-pulse {
    background: rgba(16, 185, 129, 0.05);
}
*/

// ============================================
// EXPORT FUNCTIONS
// ============================================
function exportActivity() {
    if (activityData.length === 0) {
        showToast('No activities to export', 'warning');
        return;
    }
    
    let csv = 'ID,Timestamp,User,Activity,Type,PIN,IP Address\n';
    activityData.forEach(a => {
        csv += `${a.id},${new Date(a.created_at).toLocaleString()},${a.user_name || 'System'},${a.description || a.activity_type},${a.activity_type || 'Unknown'},${a.pin || ''},${a.ip_address || 'N/A'}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Activity log exported successfully!', 'success');
}

function clearActivity() {
    document.getElementById('clearMessage').textContent = 'All activity logs will be permanently deleted. This action cannot be undone.';
    document.getElementById('clearModal').style.display = 'flex';
}

async function confirmClear() {
    try {
        const result = await API.clearActivities();
        if (result.success) {
            showToast('Activity log cleared successfully!', 'success');
            closeClearModal();
            loadActivities(1);
            loadActivityStats();
            if (isRealTimeEnabled) {
                fetchRealTimeActivity();
            }
        } else {
            showToast('Failed to clear activities', 'error');
        }
    } catch (error) {
        showToast('Failed to clear activities: ' + error.message, 'error');
    }
}

function closeClearModal() {
    document.getElementById('clearModal').style.display = 'none';
}

// ============================================
// TOAST NOTIFICATION
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
        if (isRealTimeEnabled) {
            stopRealTimeUpdates();
        }
        API.clearToken();
        window.location.href = 'login.html';
    }
}

// Override existing functions with enhanced versions
window.toggleRealTime = toggleRealTime;
window.toggleAutoRefresh = toggleAutoRefresh;
window.exportActivity = exportActivity;
window.clearActivity = clearActivity;
window.confirmClear = confirmClear;
window.closeClearModal = closeClearModal;