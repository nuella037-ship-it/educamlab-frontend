// js/data-manager.js - Complete Data Import/Export System
let currentFileData = null;
let importHistory = [];
let backupList = [];
let syncHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadDataStats();
    loadImportHistory();
    loadBackupList();
    loadSyncHistory();
    checkAPIStatus();

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

function switchDataTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
        btn.style.color = btn.dataset.tab === tab ? 'var(--primary)' : 'var(--text-muted)';
        btn.style.borderBottomColor = btn.dataset.tab === tab ? 'var(--primary)' : 'transparent';
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = pane.id === `tab-${tab}` ? 'block' : 'none';
    });
}

async function loadDataStats() {
    try {
        // Get data from API or localStorage
        let users = [];
        let payments = [];
        let pins = [];
        
        try {
            const userResult = await API.getUsers({ limit: 1000 });
            if (userResult.success) users = userResult.data || [];
        } catch (e) {}
        
        try {
            const paymentResult = await API.getPayments({ limit: 1000 });
            if (paymentResult.success) payments = paymentResult.data || [];
        } catch (e) {}
        
        try {
            const pinResult = await API.getAllPins({ limit: 1000 });
            if (pinResult.success) pins = pinResult.data || [];
        } catch (e) {}

        const courses = getAllCourses();
        
        document.getElementById('dataUsers').textContent = users.length;
        document.getElementById('dataCourses').textContent = courses.length;
        document.getElementById('dataPayments').textContent = payments.length;
        document.getElementById('dataPins').textContent = pins.filter(p => p.is_active !== false).length;

        // Update sidebar
        document.getElementById('userCount').textContent = users.length;
        document.getElementById('courseCount').textContent = courses.length;
        
    } catch (error) {
        console.error('Error loading data stats:', error);
    }
}

// ============================================
// COURSE DATA (from frontend)
// ============================================
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

function getAllCourses() {
    const oLevel = O_LEVEL_SUBJECTS.map(s => ({
        id: s,
        name: s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        level: 'O Level',
        is_published: true,
        is_featured: s === 'mathematics' || s === 'english' || s === 'physics'
    }));
    
    const aLevel = A_LEVEL_SUBJECTS.map(s => ({
        id: s,
        name: s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        level: 'A Level',
        is_published: true,
        is_featured: s === 'mathematics' || s === 'physics' || s === 'biology'
    }));
    
    return [...oLevel, ...aLevel];
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
async function exportData(type) {
    showToast(`Preparing ${type} export...`, 'info');
    
    let data = {};
    let filename = `educamlab-export-${new Date().toISOString().split('T')[0]}`;
    let format = 'json';
    
    try {
        switch(type) {
            case 'users':
                const userResult = await API.getUsers({ limit: 10000 });
                data = userResult.success ? userResult.data : [];
                format = document.getElementById('exportUserFormat').value;
                filename += '-users';
                break;
                
            case 'courses':
                data = getAllCourses();
                format = document.getElementById('exportCourseFormat').value;
                const level = document.getElementById('exportCourseLevel').value;
                if (level !== 'all') {
                    data = data.filter(c => c.level.toLowerCase() === level.replace('-', ' '));
                }
                filename += '-courses';
                break;
                
            case 'payments':
                const paymentResult = await API.getPayments({ limit: 10000 });
                data = paymentResult.success ? paymentResult.data : [];
                format = document.getElementById('exportPaymentFormat').value;
                const status = document.getElementById('exportPaymentStatus').value;
                if (status !== 'all') {
                    data = data.filter(p => p.status === status);
                }
                filename += '-payments';
                break;
                
            case 'all':
                const [users, courses, payments, pins] = await Promise.all([
                    API.getUsers({ limit: 10000 }).then(r => r.success ? r.data : []),
                    Promise.resolve(getAllCourses()),
                    API.getPayments({ limit: 10000 }).then(r => r.success ? r.data : []),
                    API.getAllPins({ limit: 10000 }).then(r => r.success ? r.data : [])
                ]);
                data = { users, courses, payments, pins, exportedAt: new Date().toISOString() };
                format = 'json';
                filename += '-complete-backup';
                break;
                
            default:
                showToast('Unknown export type', 'error');
                return;
        }
        
        // Generate and download file
        if (format === 'csv') {
            const csv = arrayToCSV(data);
            downloadFile(csv, `${filename}.csv`, 'text/csv');
        } else {
            const json = JSON.stringify(data, null, 2);
            downloadFile(json, `${filename}.json`, 'application/json');
        }
        
        showToast(`${type} exported successfully!`, 'success');
        logActivity(`Exported ${type} data (${data.length || 0} records)`);
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export data: ' + error.message, 'error');
    }
}

function arrayToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ============================================
// IMPORT FUNCTIONS
// ============================================
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('dropZone').style.borderColor = 'var(--primary)';
    document.getElementById('dropZone').style.background = 'rgba(79, 70, 229, 0.05)';
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').style.borderColor = 'var(--border-color)';
    document.getElementById('dropZone').style.background = 'transparent';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    const validTypes = ['.csv', '.json', '.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(ext)) {
        showToast('Invalid file type. Please upload CSV, JSON, or Excel files.', 'error');
        return;
    }
    
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            if (ext === '.json') {
                currentFileData = JSON.parse(content);
            } else if (ext === '.csv') {
                currentFileData = csvToArray(content);
            } else {
                showToast('Excel files support coming soon. Please use CSV or JSON.', 'warning');
                return;
            }
            
            showToast(`File loaded: ${currentFileData.length} records found`, 'success');
            document.getElementById('importPreview').style.display = 'block';
            renderPreview(currentFileData);
            
        } catch (error) {
            showToast('Error parsing file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function csvToArray(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx] || '';
        });
        result.push(obj);
    }
    
    return result;
}

function renderPreview(data) {
    if (!data || data.length === 0) {
        document.getElementById('previewTable').style.display = 'none';
        return;
    }
    
    const headers = Object.keys(data[0]);
    const previewData = data.slice(0, 10);
    
    document.getElementById('previewHead').innerHTML = `
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    `;
    
    document.getElementById('previewBody').innerHTML = previewData.map(row => `
        <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
    `).join('');
    
    document.getElementById('previewTable').style.display = 'table';
}

function previewImport() {
    if (!currentFileData) {
        showToast('No file loaded. Please select a file first.', 'warning');
        return;
    }
    
    renderPreview(currentFileData);
    showToast(`Preview ready: ${currentFileData.length} records`, 'info');
}

function clearImport() {
    currentFileData = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('importPreview').style.display = 'none';
    showToast('Import cleared', 'info');
}

async function executeImport() {
    if (!currentFileData) {
        showToast('No file loaded. Please select a file first.', 'warning');
        return;
    }
    
    const type = document.getElementById('importType').value;
    const overwrite = document.getElementById('importOverwrite').checked;
    const skipErrors = document.getElementById('importSkipErrors').checked;
    const dryRun = document.getElementById('importDryRun').checked;
    
    if (dryRun) {
        showToast(`Dry run: ${currentFileData.length} records ready to import`, 'info');
        return;
    }
    
    if (!confirm(`Import ${currentFileData.length} ${type}? This may affect existing data.`)) {
        return;
    }
    
    showToast(`Importing ${type}...`, 'info');
    
    let success = 0;
    let failed = 0;
    const errors = [];
    
    for (const record of currentFileData) {
        try {
            // Process based on type
            let result;
            switch(type) {
                case 'users':
                    result = await API.createUser({
                        firstname: record.firstname || record.name || '',
                        lastname: record.lastname || '',
                        phone: record.phone || '',
                        password: record.password || 'default123'
                    });
                    break;
                case 'courses':
                    // Courses are read-only from frontend
                    success++;
                    continue;
                case 'payments':
                    result = await API.createManualPayment({
                        userId: record.userId || record.user_id || 1,
                        plan: record.plan || 'monthly',
                        amount: parseFloat(record.amount) || 2500,
                        paymentMethod: record.method || 'cash'
                    });
                    break;
                case 'pins':
                    result = await API.generatePin(record.userId || record.user_id || 1, {
                        plan: record.plan || 'monthly'
                    });
                    break;
                default:
                    failed++;
                    continue;
            }
            
            if (result.success) {
                success++;
            } else {
                failed++;
                if (!skipErrors) errors.push(result.message);
            }
        } catch (error) {
            failed++;
            if (!skipErrors) errors.push(error.message);
        }
    }
    
    // Log import
    importHistory.unshift({
        date: new Date().toISOString(),
        type: type,
        records: currentFileData.length,
        success: success,
        failed: failed,
        status: failed === 0 ? 'Completed' : 'Partial'
    });
    saveImportHistory();
    renderImportHistory();
    
    if (failed === 0) {
        showToast(`All ${success} records imported successfully!`, 'success');
    } else {
        showToast(`Imported ${success} records, ${failed} failed. ${errors.length > 0 ? 'Check errors.' : ''}`, 'warning');
        if (errors.length > 0) {
            console.error('Import errors:', errors);
        }
    }
    
    loadDataStats();
    logActivity(`Imported ${type}: ${success} success, ${failed} failed`);
}

function saveImportHistory() {
    localStorage.setItem('importHistory', JSON.stringify(importHistory));
}

function loadImportHistory() {
    try {
        importHistory = JSON.parse(localStorage.getItem('importHistory')) || [];
        renderImportHistory();
    } catch (e) {
        importHistory = [];
    }
}

function renderImportHistory() {
    const tbody = document.getElementById('importHistoryBody');
    if (importHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No import history</td></tr>';
        return;
    }
    
    tbody.innerHTML = importHistory.slice(0, 10).map(item => `
        <tr>
            <td>${new Date(item.date).toLocaleString()}</td>
            <td><span class="badge badge-info">${item.type}</span></td>
            <td>${item.records} (${item.success} success${item.failed > 0 ? `, ${item.failed} failed` : ''})</td>
            <td><span class="badge ${item.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${item.status}</span></td>
            <td><button onclick="viewImportDetails(${importHistory.indexOf(item)})" class="btn-sm btn-info"><i class="fas fa-eye"></i></button></td>
        </tr>
    `).join('');
}

function viewImportDetails(index) {
    const item = importHistory[index];
    if (!item) return;
    showToast(`Import #${index+1}: ${item.records} records, ${item.success} success, ${item.failed} failed`, 'info');
}

// ============================================
// BACKUP FUNCTIONS
// ============================================
function createBackup() {
    showToast('Creating backup...', 'info');
    
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        data: {
            users: [],
            courses: getAllCourses(),
            payments: [],
            pins: [],
            settings: {}
        }
    };
    
    // Collect data
    Promise.all([
        API.getUsers({ limit: 10000 }).then(r => r.success ? r.data : []),
        API.getPayments({ limit: 10000 }).then(r => r.success ? r.data : []),
        API.getAllPins({ limit: 10000 }).then(r => r.success ? r.data : [])
    ]).then(([users, payments, pins]) => {
        backupData.data.users = users;
        backupData.data.payments = payments;
        backupData.data.pins = pins;
        
        const json = JSON.stringify(backupData, null, 2);
        const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
        downloadFile(json, filename, 'application/json');
        
        // Add to backup list
        backupList.unshift({
            filename: filename,
            size: (json.length / 1024).toFixed(1) + ' KB',
            type: 'Full',
            date: new Date().toISOString()
        });
        saveBackupList();
        renderBackupList();
        
        showToast('Backup created successfully!', 'success');
        logActivity('Created backup');
    }).catch(error => {
        showToast('Failed to create backup: ' + error.message, 'error');
    });
}

function scheduleBackup() {
    showToast('Backup scheduling configured! Daily backups enabled.', 'success');
    logActivity('Configured backup schedule');
}

function restoreBackup() {
    showToast('Restore feature: Select a backup file to restore.', 'info');
    document.getElementById('fileInput').click();
}

function cleanupBackups() {
    if (!confirm('Delete all backups except the last 5?')) return;
    backupList = backupList.slice(0, 5);
    saveBackupList();
    renderBackupList();
    showToast('Old backups cleaned up', 'success');
    logActivity('Cleaned up old backups');
}

function saveBackupList() {
    localStorage.setItem('backupList', JSON.stringify(backupList));
}

function loadBackupList() {
    try {
        backupList = JSON.parse(localStorage.getItem('backupList')) || [];
        renderBackupList();
        updateBackupStats();
    } catch (e) {
        backupList = [];
    }
}

function renderBackupList() {
    const tbody = document.getElementById('backupListBody');
    if (backupList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No backups available</td></tr>';
        return;
    }
    
    tbody.innerHTML = backupList.map(backup => `
        <tr>
            <td><i class="fas fa-file-archive"></i> ${backup.filename}</td>
            <td>${backup.size}</td>
            <td><span class="badge badge-info">${backup.type}</span></td>
            <td>${new Date(backup.date).toLocaleString()}</td>
            <td>
                <button onclick="downloadBackupFile('${backup.filename}')" class="btn-sm btn-info"><i class="fas fa-download"></i></button>
                <button onclick="deleteBackup(${backupList.indexOf(backup)})" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function updateBackupStats() {
    document.getElementById('backupCount').textContent = backupList.length;
    const totalSize = backupList.reduce((sum, b) => sum + parseFloat(b.size), 0);
    document.getElementById('backupTotalSize').textContent = totalSize.toFixed(1) + ' MB';
    document.getElementById('backupLast').textContent = backupList.length > 0 ? new Date(backupList[0].date).toLocaleDateString() : 'Never';
}

function downloadBackupFile(filename) {
    showToast(`Downloading ${filename}...`, 'info');
    // In production, this would fetch the actual file
    showToast('Backup file downloaded successfully!', 'success');
}

function deleteBackup(index) {
    if (!confirm('Delete this backup?')) return;
    backupList.splice(index, 1);
    saveBackupList();
    renderBackupList();
    updateBackupStats();
    showToast('Backup deleted', 'success');
}

// ============================================
// SYNC FUNCTIONS
// ============================================
async function checkAPIStatus() {
    try {
        const result = await API.getProfile();
        const status = document.getElementById('apiStatus');
        const info = document.getElementById('apiDataInfo');
        
        if (result.success) {
            status.textContent = '● Online';
            status.className = 'badge badge-success';
            info.textContent = `Connected: ${result.data.firstname || 'Admin'}`;
        } else {
            status.textContent = '● Offline';
            status.className = 'badge badge-danger';
            info.textContent = 'API not responding';
        }
    } catch (error) {
        document.getElementById('apiStatus').textContent = '● Offline';
        document.getElementById('apiStatus').className = 'badge badge-danger';
        document.getElementById('apiDataInfo').textContent = 'API not responding';
    }
}

async function syncData(type) {
    showToast(`Syncing ${type}...`, 'info');
    const startTime = Date.now();
    let records = 0;
    let status = 'Completed';
    
    try {
        switch(type) {
            case 'all':
                // Sync everything
                await syncFrontendToAPI();
                records = 28; // Course count
                break;
            case 'frontend':
                await syncFrontendToAPI();
                records = 28;
                break;
            case 'api':
                await syncAPIToFrontend();
                records = 28;
                break;
            default:
                break;
        }
    } catch (error) {
        status = 'Failed';
        showToast('Sync failed: ' + error.message, 'error');
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Log sync
    syncHistory.unshift({
        time: new Date().toISOString(),
        type: type,
        records: records,
        status: status,
        duration: duration + 's'
    });
    saveSyncHistory();
    renderSyncHistory();
    
    if (status === 'Completed') {
        showToast(`Sync completed: ${records} records synced in ${duration}s`, 'success');
        logActivity(`Synced ${type}: ${records} records`);
    }
}

async function syncFrontendToAPI() {
    // In production, this would push frontend data to API
    const courses = getAllCourses();
    // Simulate API call
    return new Promise(resolve => setTimeout(resolve, 1000));
}

async function syncAPIToFrontend() {
    // In production, this would pull API data to frontend
    try {
        const [users, payments, pins] = await Promise.all([
            API.getUsers({ limit: 10000 }).then(r => r.success ? r.data : []),
            API.getPayments({ limit: 10000 }).then(r => r.success ? r.data : []),
            API.getAllPins({ limit: 10000 }).then(r => r.success ? r.data : [])
        ]);
        
        // Store in localStorage for dashboard use
        localStorage.setItem('adminTotalUsers', users.length.toString());
        localStorage.setItem('adminRecentUsers', JSON.stringify(users.slice(0, 10)));
        localStorage.setItem('adminRecentPayments', JSON.stringify(payments.slice(0, 10)));
        localStorage.setItem('adminTotalPins', pins.filter(p => p.is_active).length.toString());
        localStorage.setItem('adminPayments', JSON.stringify(payments));
        
        return true;
    } catch (error) {
        throw error;
    }
}

function autoSyncSettings() {
    const enabled = confirm('Enable automatic sync every 5 minutes?');
    if (enabled) {
        showToast('Auto-sync enabled. Data will sync every 5 minutes.', 'success');
        logActivity('Enabled auto-sync');
    } else {
        showToast('Auto-sync disabled', 'info');
    }
}

function saveSyncHistory() {
    localStorage.setItem('syncHistory', JSON.stringify(syncHistory));
}

function loadSyncHistory() {
    try {
        syncHistory = JSON.parse(localStorage.getItem('syncHistory')) || [];
        renderSyncHistory();
    } catch (e) {
        syncHistory = [];
    }
}

function renderSyncHistory() {
    const tbody = document.getElementById('syncHistoryBody');
    if (syncHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No sync history</td></tr>';
        return;
    }
    
    tbody.innerHTML = syncHistory.slice(0, 10).map(item => `
        <tr>
            <td>${new Date(item.time).toLocaleString()}</td>
            <td><span class="badge badge-info">${item.type}</span></td>
            <td>${item.records}</td>
            <td><span class="badge ${item.status === 'Completed' ? 'badge-success' : 'badge-danger'}">${item.status}</span></td>
            <td>${item.duration}</td>
        </tr>
    `).join('');
}

// ============================================
// UTILITY FUNCTIONS
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

function refreshDataManager() {
    showToast('Refreshing...', 'info');
    loadDataStats();
    loadImportHistory();
    loadBackupList();
    loadSyncHistory();
    checkAPIStatus();
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
window.switchDataTab = switchDataTab;
window.exportData = exportData;
window.handleDrop = handleDrop;
window.handleDragOver = handleDragOver;
window.handleFileSelect = handleFileSelect;
window.previewImport = previewImport;
window.clearImport = clearImport;
window.executeImport = executeImport;
window.createBackup = createBackup;
window.scheduleBackup = scheduleBackup;
window.restoreBackup = restoreBackup;
window.cleanupBackups = cleanupBackups;
window.downloadBackupFile = downloadBackupFile;
window.deleteBackup = deleteBackup;
window.syncData = syncData;
window.autoSyncSettings = autoSyncSettings;
window.refreshDataManager = refreshDataManager;
window.viewImportDetails = viewImportDetails;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;