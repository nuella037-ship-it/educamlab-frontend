// js/users.js - Complete User Management with Phone + PIN Support
let currentPage = 1;
let currentUserId = null;
let selectedUsers = new Set();
let deleteTargetId = null;
let pinTargetId = null;
const limit = 20;

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadUsers();
    loadUserStats();

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

async function loadUserStats() {
    try {
        const result = await API.getUsers({ limit: 1000 });
        if (result.success) {
            const users = result.data || [];
            const total = users.length;
            const verified = users.filter(u => u.is_verified).length;
            const unverified = total - verified;
            const admins = users.filter(u => u.role === 'admin').length;
            const subscribed = users.filter(u => u.subscription_type && u.subscription_type !== 'none').length;
            const newUsers = users.filter(u => {
                const days = (new Date() - new Date(u.created_at)) / (1000 * 60 * 60 * 24);
                return days <= 30;
            }).length;
            const hasPin = users.filter(u => u.pin).length;
            
            document.getElementById('totalUsers').textContent = total;
            document.getElementById('verifiedUsers').textContent = verified;
            document.getElementById('unverifiedUsers').textContent = unverified;
            document.getElementById('adminUsers').textContent = admins;
            document.getElementById('subscribedUsers').textContent = subscribed;
            document.getElementById('newUsers').textContent = newUsers;
            document.getElementById('pinUsers').textContent = hasPin;
            document.getElementById('userCount').textContent = total;
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

async function loadUsers(page = 1) {
    currentPage = page;
    
    const search = document.getElementById('searchInput').value;
    const role = document.getElementById('roleFilter').value;
    const isVerified = document.getElementById('statusFilter').value;
    const subscription = document.getElementById('subscriptionFilter').value;
    const pinFilter = document.getElementById('pinFilter').value;

    try {
        const result = await API.getUsers({
            page,
            limit,
            search: search || undefined,
            role: role || undefined,
            isVerified: isVerified || undefined,
            subscription: subscription || undefined,
            pinFilter: pinFilter || undefined
        });

        if (result.success) {
            renderUsers(result.data || []);
            renderPagination(result.pagination || {});
            document.getElementById('tableInfo').textContent = 
                `Showing ${result.data ? result.data.length : 0} of ${result.pagination?.total || 0} users`;
            selectedUsers.clear();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr><td colspan="10" class="text-center error">
                <i class="fas fa-exclamation-triangle"></i> Failed to load users. Please try again.
            </td></tr>
        `;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center" style="padding: 60px 20px;">
                    <i class="fas fa-users-slash" style="font-size: 48px; display: block; margin-bottom: 16px; color: var(--text-muted);"></i>
                    <h3 style="margin-bottom: 8px;">No users found</h3>
                    <p style="color: var(--text-muted);">Try adjusting your search or filters.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const isVerified = user.is_verified;
        const roleColors = {
            admin: 'badge-danger',
            moderator: 'badge-warning',
            user: 'badge-info'
        };
        const roleIcons = {
            admin: '🔒',
            moderator: '🛡️',
            user: '👤'
        };
        
        const subscriptionStatus = user.subscription_type && user.subscription_type !== 'none' 
            ? user.subscription_expires && new Date(user.subscription_expires) > new Date()
                ? '🟢 Active'
                : '🔴 Expired'
            : '⚪ None';
        
        const subscriptionClass = subscriptionStatus.includes('Active') ? 'badge-success' 
            : subscriptionStatus.includes('Expired') ? 'badge-danger' 
            : 'badge-secondary';
        
        return `
            <tr>
                <td>
                    <input type="checkbox" class="user-select" data-id="${user.id}" 
                           onchange="toggleUserSelect(${user.id})">
                </td>
                <td>#${user.id}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small" style="background: ${isVerified ? 'var(--primary)' : 'var(--text-muted)'};">
                            ${(user.firstname || 'U')[0].toUpperCase()}${(user.lastname || '')[0].toUpperCase()}
                        </div>
                        <div>
                            <div class="user-name">${user.firstname} ${user.lastname}</div>
                        </div>
                    </div>
                </td>
                <td><strong style="font-family: monospace;">${user.phone || 'N/A'}</strong></td>
                <td><span class="badge ${roleColors[user.role] || 'badge-info'}">${roleIcons[user.role] || '👤'} ${user.role || 'user'}</span></td>
                <td>
                    <span class="badge ${isVerified ? 'badge-success' : 'badge-warning'}">
                        ${isVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                </td>
                <td><span class="badge ${subscriptionClass}">${subscriptionStatus}</span></td>
                <td>
                    ${user.pin ? `
                        <span class="badge badge-success" style="font-family: monospace; letter-spacing: 1px;">
                            🔑 ${user.pin}
                        </span>
                        <button onclick="copyPin('${user.pin}')" class="btn-sm btn-secondary" title="Copy PIN">
                            <i class="fas fa-copy"></i>
                        </button>
                    ` : `
                        <span class="badge badge-secondary">No PIN</span>
                    `}
                </td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewUser(${user.id})" class="btn-sm btn-info" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="showRoleModal(${user.id}, '${user.firstname} ${user.lastname}', '${user.phone}', '${user.role || 'user'}')" class="btn-sm btn-warning" title="Change Role">
                            <i class="fas fa-user-tag"></i>
                        </button>
                        ${!user.pin ? `
                            <button onclick="showPinModal(${user.id})" class="btn-sm btn-success" title="Generate PIN">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : `
                            <button onclick="showPinModal(${user.id})" class="btn-sm btn-secondary" title="Manage PIN">
                                <i class="fas fa-edit"></i>
                            </button>
                        `}
                        <button onclick="deleteUser(${user.id})" class="btn-sm btn-danger" title="Delete">
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
    
    html += `<button onclick="loadUsers(1)" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
    </button>`;
    html += `<button onclick="loadUsers(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
    </button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="loadUsers(1)">1</button>`;
        if (startPage > 2) html += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadUsers(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<button onclick="loadUsers(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button onclick="loadUsers(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
    </button>`;
    html += `<button onclick="loadUsers(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

function toggleUserSelect(id) {
    if (selectedUsers.has(id)) {
        selectedUsers.delete(id);
    } else {
        selectedUsers.add(id);
    }
    updateSelectAllState();
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.user-select');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        const id = parseInt(cb.dataset.id);
        if (cb.checked) {
            selectedUsers.add(id);
        } else {
            selectedUsers.delete(id);
        }
    });
}

function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.user-select');
    const selectAll = document.getElementById('selectAll');
    if (checkboxes.length > 0) {
        selectAll.checked = checkboxes.length === selectedUsers.size;
    }
}

async function bulkUserAction() {
    const action = document.getElementById('bulkAction').value;
    if (!action) {
        showToast('Please select an action', 'warning');
        return;
    }
    
    if (selectedUsers.size === 0) {
        showToast('Please select at least one user', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to ${action} ${selectedUsers.size} user(s)?`)) {
        return;
    }
    
    const userIds = Array.from(selectedUsers);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of userIds) {
        try {
            switch (action) {
                case 'delete':
                    await API.deleteUser(id);
                    successCount++;
                    break;
                case 'verify':
                    await API.updateUserVerification(id, true);
                    successCount++;
                    break;
                case 'unverify':
                    await API.updateUserVerification(id, false);
                    successCount++;
                    break;
                case 'make-admin':
                    await API.updateUserRole(id, 'admin');
                    successCount++;
                    break;
                case 'make-moderator':
                    await API.updateUserRole(id, 'moderator');
                    successCount++;
                    break;
                case 'make-user':
                    await API.updateUserRole(id, 'user');
                    successCount++;
                    break;
                case 'generate-pin':
                    const pin = await API.generatePin(id, {});
                    if (pin.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                    break;
                case 'revoke-pin':
                    // Need to get user's current PIN
                    const userData = await API.getUser(id);
                    if (userData.success && userData.data.pin) {
                        const revoke = await API.revokePin(id, userData.data.pin);
                        if (revoke.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } else {
                        failCount++;
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            failCount++;
            console.error(`Failed to ${action} user ${id}:`, error);
        }
    }
    
    showToast(`${action} completed: ${successCount} successful, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    selectedUsers.clear();
    loadUsers(currentPage);
    loadUserStats();
}

// ============================================
// CREATE USER
// ============================================
function showCreateUserModal() {
    document.getElementById('createUserForm').reset();
    document.getElementById('createUserModal').style.display = 'flex';
}

function closeCreateUserModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

async function createUser(event) {
    event.preventDefault();
    
    const data = {
        firstname: document.getElementById('createFirstName').value.trim(),
        lastname: document.getElementById('createLastName').value.trim(),
        phone: document.getElementById('createPhone').value.trim(),
        password: document.getElementById('createPassword').value,
        role: document.getElementById('createRole').value
    };
    
    if (!data.phone || !data.password) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }
    
    const btn = document.getElementById('createUserBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    btn.disabled = true;
    
    try {
        await API.createUser(data);
        showToast('User created successfully!', 'success');
        closeCreateUserModal();
        loadUsers(currentPage);
        loadUserStats();
    } catch (error) {
        showToast('Failed to create user: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ============================================
// VIEW USER
// ============================================
async function viewUser(id) {
    try {
        const result = await API.getUser(id);
        if (result.success) {
            const user = result.data;
            
            const subscriptionStatus = user.subscription_type && user.subscription_type !== 'none'
                ? user.subscription_expires && new Date(user.subscription_expires) > new Date()
                    ? '🟢 Active'
                    : '🔴 Expired'
                : '⚪ None';
            
            const pins = await API.getUserPins(id);
            const pinList = pins.success ? pins.data || [] : [];
            
            document.getElementById('userDetails').innerHTML = `
                <div class="user-profile-detail">
                    <div class="user-profile-header" style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                        <div class="user-avatar-large" style="width: 80px; height: 80px; border-radius: 50%; background: ${user.is_verified ? 'var(--primary)' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; flex-shrink: 0;">
                            ${(user.firstname || 'U')[0].toUpperCase()}${(user.lastname || '')[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 style="margin-bottom: 4px;">${user.firstname} ${user.lastname}</h2>
                            <p style="margin: 2px 0; font-size: 18px; font-weight: 600; color: var(--primary);">
                                <i class="fas fa-phone"></i> ${user.phone || 'N/A'}
                            </p>
                            <p>
                                <span class="badge ${user.is_verified ? 'badge-success' : 'badge-warning'}">
                                    ${user.is_verified ? '✅ Verified' : '⏳ Pending'}
                                </span>
                                <span class="badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'moderator' ? 'badge-warning' : 'badge-info'}">
                                    ${user.role || 'user'}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="user-profile-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
                        <div class="stat-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <span class="stat-label" style="display: block; font-size: 12px; color: var(--text-muted);">Phone</span>
                            <span class="stat-value" style="font-family: monospace; font-size: 16px;">${user.phone || 'N/A'}</span>
                        </div>
                        <div class="stat-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <span class="stat-label" style="display: block; font-size: 12px; color: var(--text-muted);">Joined</span>
                            <span class="stat-value">${new Date(user.created_at).toLocaleString()}</span>
                        </div>
                        <div class="stat-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <span class="stat-label" style="display: block; font-size: 12px; color: var(--text-muted);">Subscription</span>
                            <span class="stat-value">${subscriptionStatus}</span>
                        </div>
                        <div class="stat-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <span class="stat-label" style="display: block; font-size: 12px; color: var(--text-muted);">Enrollments</span>
                            <span class="stat-value">${user.enrollments ? user.enrollments.length : 0}</span>
                        </div>
                        <div class="stat-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <span class="stat-label" style="display: block; font-size: 12px; color: var(--text-muted);">Payments</span>
                            <span class="stat-value">${user.payments ? user.payments.length : 0}</span>
                        </div>
                    </div>
                    
                    <!-- PIN Section -->
                    <div class="user-profile-section" style="margin-bottom: 20px;">
                        <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <i class="fas fa-key" style="color: var(--primary);"></i> PIN Codes
                            <button onclick="showPinModal(${user.id})" class="btn-sm btn-primary" style="margin-left: auto;">
                                <i class="fas ${pinList.length > 0 ? 'fa-edit' : 'fa-plus'}"></i>
                                ${pinList.length > 0 ? 'Manage' : 'Generate'}
                            </button>
                        </h4>
                        ${pinList.length > 0 ? `
                            <div class="pin-list">
                                ${pinList.map(pin => `
                                    <div class="pin-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--border-color);">
                                        <div>
                                            <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: var(--primary); letter-spacing: 3px;">${pin.code}</span>
                                            <span style="font-size: 12px; color: var(--text-muted); margin-left: 12px;">${pin.plan || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span class="badge ${pin.is_active ? 'badge-success' : 'badge-danger'}">
                                                ${pin.is_active ? '🟢 Active' : '🔴 Revoked'}
                                            </span>
                                            <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">${new Date(pin.created_at).toLocaleDateString()}</span>
                                            ${pin.is_active ? `
                                                <button onclick="revokeUserPin(${user.id}, '${pin.code}')" class="btn-sm btn-danger" style="margin-left: 8px;" title="Revoke PIN">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                            <button onclick="copyPin('${pin.code}')" class="btn-sm btn-secondary" title="Copy PIN">
                                                <i class="fas fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p style="color: var(--text-muted); text-align: center; padding: 20px;">
                                <i class="fas fa-key" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
                                No PIN codes generated for this user.
                            </p>
                        `}
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="user-profile-section">
                        <h4 style="margin-bottom: 12px;">Recent Activity</h4>
                        <div class="activity-list">
                            ${user.activities && user.activities.length > 0 ? 
                                user.activities.slice(0, 5).map(a => `
                                    <div class="activity-item" style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                        <span class="activity-icon" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary);">
                                            ${a.activity_type === 'login' ? '🔑' : a.activity_type === 'registration' ? '📝' : a.activity_type === 'payment' ? '💰' : a.activity_type === 'pin_generated' ? '🔑' : a.activity_type === 'pin_used' ? '🔐' : '📋'}
                                        </span>
                                        <div>
                                            <div>${a.description || a.activity_type}</div>
                                            <div class="activity-time" style="font-size: 12px; color: var(--text-muted);">${new Date(a.created_at).toLocaleString()}</div>
                                        </div>
                                        ${a.pin ? `<span style="margin-left: auto; font-family: monospace; font-size: 14px; font-weight: 700; color: var(--primary);">${a.pin}</span>` : ''}
                                    </div>
                                `).join('') :
                                '<p style="color: var(--text-muted);">No recent activity</p>'
                            }
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('userModal').style.display = 'flex';
        }
    } catch (error) {
        showToast('Failed to load user details: ' + error.message, 'error');
    }
}

function closeModal() {
    document.getElementById('userModal').style.display = 'none';
}

// ============================================
// ROLE MANAGEMENT
// ============================================
function showRoleModal(id, name, phone, currentRole) {
    currentUserId = id;
    document.getElementById('roleUserName').textContent = name;
    document.getElementById('roleUserPhone').textContent = phone || 'No phone';
    document.getElementById('roleUserAvatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('newRole').value = currentRole;
    document.getElementById('roleModal').style.display = 'flex';
}

async function updateRole() {
    if (!currentUserId) return;
    
    const role = document.getElementById('newRole').value;
    
    try {
        await API.updateUserRole(currentUserId, role);
        showToast('User role updated successfully!', 'success');
        closeRoleModal();
        loadUsers(currentPage);
        loadUserStats();
    } catch (error) {
        showToast('Failed to update role: ' + error.message, 'error');
    }
}

function closeRoleModal() {
    document.getElementById('roleModal').style.display = 'none';
    currentUserId = null;
}

// ============================================
// PIN MANAGEMENT
// ============================================
async function showPinModal(userId) {
    pinTargetId = userId;
    
    try {
        const user = await API.getUser(userId);
        const pins = await API.getUserPins(userId);
        
        const userData = user.success ? user.data : null;
        const pinList = pins.success ? pins.data || [] : [];
        
        document.getElementById('pinDetails').innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div class="user-avatar-large" style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: white; margin: 0 auto;">
                    ${userData ? (userData.firstname || 'U')[0].toUpperCase() : 'U'}
                </div>
                <p style="margin-top: 8px;"><strong>${userData ? userData.firstname + ' ' + userData.lastname : 'User'}</strong></p>
                <p style="color: var(--text-muted); font-size: 14px;"><i class="fas fa-phone"></i> ${userData ? userData.phone : ''}</p>
            </div>
            
            ${pinList.length > 0 ? `
                <div style="margin-bottom: 16px;">
                    <h4>Existing PINs</h4>
                    ${pinList.map(pin => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
                            <span style="font-family: monospace; font-size: 18px; font-weight: 700; color: var(--primary); letter-spacing: 2px;">${pin.code}</span>
                            <div>
                                <span class="badge ${pin.is_active ? 'badge-success' : 'badge-danger'}">
                                    ${pin.is_active ? 'Active' : 'Revoked'}
                                </span>
                                <button onclick="copyPin('${pin.code}')" class="btn-sm btn-secondary">
                                    <i class="fas fa-copy"></i>
                                </button>
                                ${pin.is_active ? `
                                    <button onclick="revokeUserPin(${userId}, '${pin.code}')" class="btn-sm btn-danger">
                                        <i class="fas fa-times"></i> Revoke
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <p style="text-align: center; color: var(--text-muted); padding: 16px;">
                    <i class="fas fa-key" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
                    No PIN codes for this user.
                </p>
            `}
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                <h4>Generate New PIN</h4>
                <div class="form-group">
                    <label>Plan</label>
                    <select id="pinPlan" class="filter-select" style="width: 100%;">
                        <option value="daily">☀️ Daily</option>
                        <option value="weekly">📅 Weekly</option>
                        <option value="monthly" selected>📆 Monthly</option>
                        <option value="annual">📈 Annual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="sendPinSms" checked>
                        Send PIN via SMS
                    </label>
                    <small class="form-hint">PIN will be sent as SMS to the user's phone number</small>
                </div>
                <button onclick="generateUserPin(${userId})" class="btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-key"></i> Generate PIN
                </button>
            </div>
        `;
        
        document.getElementById('pinModal').style.display = 'flex';
    } catch (error) {
        showToast('Failed to load PIN data: ' + error.message, 'error');
    }
}

async function generateUserPin(userId) {
    const plan = document.getElementById('pinPlan').value;
    const sendSms = document.getElementById('sendPinSms').checked;
    
    try {
        const result = await API.generatePin(userId, { plan });
        if (result.success) {
            const pin = result.data.code;
            showToast(`PIN generated successfully! Code: ${pin}`, 'success');
            
            if (sendSms) {
                try {
                    const user = await API.getUser(userId);
                    if (user.success && user.data.phone) {
                        await API.sendPinSms(user.data.phone, pin);
                        showToast(`PIN sent via SMS to ${user.data.phone}`, 'success');
                    }
                } catch (smsError) {
                    showToast('PIN generated but SMS failed to send', 'warning');
                }
            }
            
            closePinModal();
            loadUsers(currentPage);
            loadUserStats();
        } else {
            showToast('Failed to generate PIN', 'error');
        }
    } catch (error) {
        showToast('Failed to generate PIN: ' + error.message, 'error');
    }
}

async function revokeUserPin(userId, pinCode) {
    if (!confirm(`Are you sure you want to revoke PIN ${pinCode}?`)) {
        return;
    }
    
    try {
        const result = await API.revokePin(userId, pinCode);
        if (result.success) {
            showToast('PIN revoked successfully!', 'success');
            closePinModal();
            loadUsers(currentPage);
            loadUserStats();
        } else {
            showToast('Failed to revoke PIN', 'error');
        }
    } catch (error) {
        showToast('Failed to revoke PIN: ' + error.message, 'error');
    }
}

function closePinModal() {
    document.getElementById('pinModal').style.display = 'none';
    pinTargetId = null;
}

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
// DELETE USER
// ============================================
function deleteUser(id) {
    deleteTargetId = id;
    document.getElementById('deleteMessage').textContent = 'This will permanently delete this user and all associated data.';
    document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
    if (!deleteTargetId) return;
    
    try {
        await API.deleteUser(deleteTargetId);
        showToast('User deleted successfully!', 'success');
        closeDeleteModal();
        loadUsers(currentPage);
        loadUserStats();
    } catch (error) {
        showToast('Failed to delete user: ' + error.message, 'error');
    }
    deleteTargetId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteTargetId = null;
}

function refreshUsers() {
    showToast('Refreshing user data...', 'info');
    loadUsers(currentPage);
    loadUserStats();
}

function exportUsers() {
    const rows = document.querySelectorAll('#usersTableBody tr');
    if (rows.length === 0 || rows[0].classList.contains('text-center')) {
        showToast('No users to export', 'warning');
        return;
    }
    
    let csv = 'ID,Name,Phone,Role,Status,Subscription,PIN,Joined\n';
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 9) {
            const id = cols[1]?.textContent.trim() || '';
            const name = cols[2]?.querySelector('.user-name')?.textContent.trim() || '';
            const phone = cols[3]?.textContent.trim() || '';
            const role = cols[4]?.textContent.trim() || '';
            const status = cols[5]?.textContent.includes('Verified') ? 'Verified' : 'Pending';
            const subscription = cols[6]?.textContent.trim() || '';
            const pin = cols[7]?.textContent.includes('PIN') ? cols[7]?.textContent.trim().replace('🔑', '').trim() : '';
            const joined = cols[8]?.textContent.trim() || '';
            csv += `${id},${name},${phone},${role},${status},${subscription},${pin},${joined}\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Users exported successfully!', 'success');
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
window.loadUsers = loadUsers;
window.viewUser = viewUser;
window.deleteUser = deleteUser;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.showRoleModal = showRoleModal;
window.updateRole = updateRole;
window.closeModal = closeModal;
window.closeRoleModal = closeRoleModal;
window.toggleUserSelect = toggleUserSelect;
window.toggleSelectAll = toggleSelectAll;
window.bulkUserAction = bulkUserAction;
window.exportUsers = exportUsers;
window.refreshUsers = refreshUsers;
window.showPinModal = showPinModal;
window.generateUserPin = generateUserPin;
window.revokeUserPin = revokeUserPin;
window.closePinModal = closePinModal;
window.copyPin = copyPin;
window.showCreateUserModal = showCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;
window.createUser = createUser;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;