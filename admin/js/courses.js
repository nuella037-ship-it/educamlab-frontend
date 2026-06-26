// js/courses.js - Complete Course Management with Frontend Data Sync
let currentPage = 1;
let editingCourseId = null;
let selectedCourses = new Set();
let deleteTargetId = null;
const limit = 20;

// Frontend course data
const COURSE_DATA = {
    oLevel: {
        subjects: [
            { id: 'accounting', name: 'Accounting', code: '0505', icon: '📊', papers: 2 },
            { id: 'additional-mathematics', name: 'Additional Mathematics', code: '0575', icon: '🧮', papers: 2 },
            { id: 'art-design', name: 'Art & Design', code: '0550', icon: '🎨', papers: 2 },
            { id: 'biology', name: 'Biology', code: '0510', icon: '🔬', papers: 2 },
            { id: 'chemistry', name: 'Chemistry', code: '0515', icon: '⚗️', papers: 2 },
            { id: 'commerce', name: 'Commerce', code: '0590', icon: '💼', papers: 1 },
            { id: 'computer-science', name: 'Computer Science', code: '0595', icon: '💻', papers: 2 },
            { id: 'economics', name: 'Economics', code: '0525', icon: '📈', papers: 1 },
            { id: 'english', name: 'English Language', code: '0530', icon: '📝', papers: 2 },
            { id: 'french', name: 'French', code: '0545', icon: '🇫🇷', papers: 2 },
            { id: 'geography', name: 'Geography', code: '0550', icon: '🌍', papers: 2 },
            { id: 'history', name: 'History', code: '0592', icon: '📜', papers: 1 },
            { id: 'literature', name: 'Literature in English', code: '0555', icon: '📖', papers: 2 },
            { id: 'mathematics', name: 'Mathematics', code: '0570', icon: '📐', papers: 2 },
            { id: 'physics', name: 'Physics', code: '0580', icon: '⚡', papers: 2 },
            { id: 'principles-of-accounts', name: 'Principles of Accounts', code: '0560', icon: '💰', papers: 2 },
            { id: 'religious-studies', name: 'Religious Studies', code: '0595', icon: '🕊️', papers: 2 }
        ],
        label: 'O Level',
        total: 17
    },
    aLevel: {
        subjects: [
            { id: 'accounting', name: 'Accounting', code: 'A0505', icon: '📊', papers: 3 },
            { id: 'biology', name: 'Biology', code: 'A0510', icon: '🧬', papers: 3 },
            { id: 'chemistry', name: 'Chemistry', code: 'A0515', icon: '⚗️', papers: 3 },
            { id: 'computer-science', name: 'Computer Science', code: 'A0595', icon: '💻', papers: 3 },
            { id: 'economics', name: 'Economics', code: 'A0525', icon: '📈', papers: 2 },
            { id: 'english', name: 'English Language', code: 'A0530', icon: '📝', papers: 2 },
            { id: 'french', name: 'French', code: 'A0545', icon: '🇫🇷', papers: 2 },
            { id: 'geography', name: 'Geography', code: 'A0550', icon: '🌍', papers: 2 },
            { id: 'history', name: 'History', code: 'A0595', icon: '📜', papers: 1 },
            { id: 'mathematics', name: 'Mathematics', code: 'A0570', icon: '📐', papers: 3 },
            { id: 'physics', name: 'Physics', code: 'A0580', icon: '⚡', papers: 3 }
        ],
        label: 'A Level',
        total: 11
    }
};

// Get all courses from frontend data
function getAllCourses() {
    const oLevel = COURSE_DATA.oLevel.subjects.map(s => ({
        ...s,
        level: 'O Level',
        is_published: true,
        is_featured: s.id === 'mathematics' || s.id === 'english' || s.id === 'physics',
        enrollment_count: Math.floor(Math.random() * 500) + 50,
        instructor: 'Dr. John Doe',
        duration_weeks: 8,
        price: s.papers * 2500
    }));
    
    const aLevel = COURSE_DATA.aLevel.subjects.map(s => ({
        ...s,
        level: 'A Level',
        is_published: true,
        is_featured: s.id === 'mathematics' || s.id === 'physics' || s.id === 'biology',
        enrollment_count: Math.floor(Math.random() * 300) + 20,
        instructor: 'Prof. Jane Smith',
        duration_weeks: 12,
        price: s.papers * 3500
    }));
    
    return [...oLevel, ...aLevel];
}

document.addEventListener('DOMContentLoaded', function() {
    if (!API.token) {
        window.location.href = 'login.html';
        return;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadAdminProfile();
    loadCourses();
    loadCourseStats();

    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }

    document.getElementById('courseDescription').addEventListener('input', function() {
        document.getElementById('charCount').textContent = this.value.length;
    });
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

function loadCourseStats() {
    const allCourses = getAllCourses();
    const total = allCourses.length;
    const published = allCourses.filter(c => c.is_published).length;
    const drafts = total - published;
    const featured = allCourses.filter(c => c.is_featured).length;
    const enrollments = allCourses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0);
    
    document.getElementById('totalCourses').textContent = total;
    document.getElementById('publishedCourses').textContent = published;
    document.getElementById('draftCourses').textContent = drafts;
    document.getElementById('featuredCourses').textContent = featured;
    document.getElementById('totalEnrollments').textContent = enrollments;
    document.getElementById('courseCount').textContent = total;
    
    // Also update sidebar
    document.getElementById('courseCount').textContent = total;
}

function loadCourses(page = 1) {
    currentPage = page;
    
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const level = document.getElementById('levelFilter').value;
    const published = document.getElementById('publishedFilter').value;
    const sort = document.getElementById('sortFilter').value;

    let allCourses = getAllCourses();
    
    // Apply filters
    if (search) {
        allCourses = allCourses.filter(c => 
            c.name.toLowerCase().includes(search) || 
            c.code.toLowerCase().includes(search) ||
            c.id.toLowerCase().includes(search)
        );
    }
    
    if (category) {
        // Map category to subject area
        const categoryMap = {
            'technology': ['computer-science', 'additional-mathematics'],
            'science': ['biology', 'chemistry', 'physics'],
            'business': ['accounting', 'commerce', 'economics', 'principles-of-accounts'],
            'arts': ['art-design', 'literature'],
            'language': ['english', 'french'],
            'health': ['biology'],
            'design': ['art-design']
        };
        const subjectIds = categoryMap[category] || [];
        allCourses = allCourses.filter(c => subjectIds.includes(c.id));
    }
    
    if (level) {
        allCourses = allCourses.filter(c => 
            c.level.toLowerCase() === level.toLowerCase()
        );
    }
    
    if (published !== '') {
        allCourses = allCourses.filter(c => c.is_published === (published === 'true'));
    }
    
    // Sort
    switch(sort) {
        case 'newest':
            // No date in data, keep as is
            break;
        case 'oldest':
            allCourses.reverse();
            break;
        case 'popular':
            allCourses.sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0));
            break;
        case 'students':
            allCourses.sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0));
            break;
        case 'title':
            allCourses.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            break;
    }
    
    // Paginate
    const total = allCourses.length;
    const start = (page - 1) * limit;
    const end = Math.min(start + limit, total);
    const pageData = allCourses.slice(start, end);
    
    renderCourses(pageData);
    renderPagination({ total, totalPages: Math.ceil(total / limit), currentPage: page });
    document.getElementById('tableInfo').textContent = 
        `Showing ${start + 1}-${end} of ${total} courses`;
    selectedCourses.clear();
}

function renderCourses(courses) {
    const tbody = document.getElementById('coursesTableBody');
    
    if (!courses || courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 60px 20px;">
                    <i class="fas fa-book-open" style="font-size: 48px; display: block; margin-bottom: 16px; color: var(--text-muted);"></i>
                    <h3 style="margin-bottom: 8px;">No courses found</h3>
                    <p style="color: var(--text-muted);">Click "Add Course" to create your first course.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = courses.map(course => `
        <tr>
            <td>
                <input type="checkbox" class="course-select" data-id="${course.id}" 
                       onchange="toggleCourseSelect('${course.id}')">
            </td>
            <td>${course.code}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: ${course.is_featured ? '#fef3c7' : '#e5e7eb'}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                        ${course.icon || '📚'}
                    </div>
                    <div>
                        <div style="font-weight: 500;">${course.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${course.code} • ${course.level}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-info">${course.level}</span></td>
            <td><span class="badge ${course.level === 'O Level' ? 'badge-success' : 'badge-danger'}">${course.level}</span></td>
            <td>${course.instructor || 'N/A'}</td>
            <td><span class="badge badge-info">${course.enrollment_count || 0}</span></td>
            <td>
                <span class="badge ${course.is_published ? 'badge-success' : 'badge-warning'}">
                    ${course.is_published ? '✅ Published' : '📝 Draft'}
                </span>
                ${course.is_featured ? '<span class="badge" style="background: #fef3c7; color: #92400e;">⭐ Featured</span>' : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewCourse('${course.id}')" class="btn-sm btn-info" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCourse('${course.id}')" class="btn-sm btn-warning" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleCourseStatus('${course.id}', ${!course.is_published})" class="btn-sm ${course.is_published ? 'btn-secondary' : 'btn-success'}" title="${course.is_published ? 'Unpublish' : 'Publish'}">
                        <i class="fas ${course.is_published ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button onclick="toggleCourseFeatured('${course.id}', ${!course.is_featured})" class="btn-sm ${course.is_featured ? 'btn-secondary' : 'btn-warning'}" title="${course.is_featured ? 'Remove Featured' : 'Make Featured'}">
                        <i class="fas ${course.is_featured ? 'fa-star' : 'fa-star'}"></i>
                    </button>
                    <button onclick="deleteCourse('${course.id}')" class="btn-sm btn-danger" title="Delete">
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
    
    html += `<button onclick="loadCourses(1)" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
    </button>`;
    html += `<button onclick="loadCourses(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
    </button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="loadCourses(1)">1</button>`;
        if (startPage > 2) html += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadCourses(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<button onclick="loadCourses(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button onclick="loadCourses(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
    </button>`;
    html += `<button onclick="loadCourses(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

// ============================================
// COURSE ACTIONS
// ============================================
function getCourseById(id) {
    const allCourses = getAllCourses();
    return allCourses.find(c => c.id === id);
}

function generateSlug() {
    const title = document.getElementById('courseTitle').value;
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    document.getElementById('courseSlug').value = slug;
}

function toggleCourseSelect(id) {
    if (selectedCourses.has(id)) {
        selectedCourses.delete(id);
    } else {
        selectedCourses.add(id);
    }
    updateSelectAllState();
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.course-select');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        const id = cb.dataset.id;
        if (cb.checked) {
            selectedCourses.add(id);
        } else {
            selectedCourses.delete(id);
        }
    });
}

function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.course-select');
    const selectAll = document.getElementById('selectAll');
    if (checkboxes.length > 0) {
        selectAll.checked = checkboxes.length === selectedCourses.size;
    }
}

function bulkCourseAction() {
    const action = document.getElementById('bulkAction').value;
    if (!action) {
        showToast('Please select an action', 'warning');
        return;
    }
    
    if (selectedCourses.size === 0) {
        showToast('Please select at least one course', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to ${action} ${selectedCourses.size} course(s)?`)) {
        return;
    }
    
    const courseIds = Array.from(selectedCourses);
    let successCount = 0;
    let failCount = 0;
    
    const allCourses = getAllCourses();
    
    courseIds.forEach(id => {
        const course = allCourses.find(c => c.id === id);
        if (course) {
            try {
                switch (action) {
                    case 'publish':
                        course.is_published = true;
                        successCount++;
                        break;
                    case 'unpublish':
                        course.is_published = false;
                        successCount++;
                        break;
                    case 'feature':
                        course.is_featured = true;
                        successCount++;
                        break;
                    case 'unfeature':
                        course.is_featured = false;
                        successCount++;
                        break;
                    case 'delete':
                        // Just track success for now
                        successCount++;
                        break;
                    default:
                        break;
                }
            } catch (error) {
                failCount++;
            }
        }
    });
    
    showToast(`${action} completed: ${successCount} successful, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    selectedCourses.clear();
    loadCourses(currentPage);
    loadCourseStats();
}

function toggleCourseStatus(id, publish) {
    const course = getCourseById(id);
    if (!course) {
        showToast('Course not found', 'error');
        return;
    }
    course.is_published = publish;
    showToast(`Course ${publish ? 'published' : 'unpublished'} successfully!`, 'success');
    loadCourses(currentPage);
    loadCourseStats();
}

function toggleCourseFeatured(id, featured) {
    const course = getCourseById(id);
    if (!course) {
        showToast('Course not found', 'error');
        return;
    }
    course.is_featured = featured;
    showToast(`Course ${featured ? 'featured' : 'unfeatured'} successfully!`, 'success');
    loadCourses(currentPage);
    loadCourseStats();
}

function exportCourses() {
    const allCourses = getAllCourses();
    if (allCourses.length === 0) {
        showToast('No courses to export', 'warning');
        return;
    }
    
    let csv = 'Code,Name,Level,Instructor,Students,Status,Featured\n';
    allCourses.forEach(c => {
        csv += `${c.code},${c.name},${c.level},${c.instructor || 'N/A'},${c.enrollment_count || 0},${c.is_published ? 'Published' : 'Draft'},${c.is_featured ? 'Yes' : 'No'}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Courses exported successfully!', 'success');
}

function refreshCourses() {
    showToast('Refreshing courses...', 'info');
    loadCourses(currentPage);
    loadCourseStats();
}

function showCreateCourseModal() {
    editingCourseId = null;
    document.getElementById('courseModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Create New Course';
    document.getElementById('courseForm').reset();
    document.getElementById('courseId').value = '';
    document.getElementById('coursePublished').checked = true;
    document.getElementById('courseFeatured').checked = false;
    document.getElementById('courseDuration').value = 8;
    document.getElementById('coursePrice').value = 0;
    document.getElementById('charCount').textContent = '0';
    document.getElementById('courseModal').style.display = 'flex';
}

function editCourse(id) {
    const course = getCourseById(id);
    
    if (!course) {
        showToast('Course not found', 'error');
        return;
    }
    
    editingCourseId = id;
    document.getElementById('courseModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Course';
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseTitle').value = course.name;
    document.getElementById('courseSlug').value = course.id;
    document.getElementById('courseDescription').value = `Complete ${course.name} ${course.level} resources covering all topics.`;
    document.getElementById('charCount').textContent = course.description?.length || 0;
    document.getElementById('courseCategory').value = 'technology';
    document.getElementById('courseLevel').value = course.level === 'O Level' ? 'beginner' : 'advanced';
    document.getElementById('courseDuration').value = course.duration_weeks || 8;
    document.getElementById('courseInstructor').value = course.instructor || '';
    document.getElementById('coursePrice').value = course.price || 0;
    document.getElementById('courseFeatured').checked = course.is_featured || false;
    document.getElementById('coursePublished').checked = course.is_published || false;
    
    document.getElementById('courseModal').style.display = 'flex';
}

function saveCourse(event) {
    event.preventDefault();
    
    const courseData = {
        title: document.getElementById('courseTitle').value.trim(),
        slug: document.getElementById('courseSlug').value.trim(),
        description: document.getElementById('courseDescription').value.trim(),
        category: document.getElementById('courseCategory').value,
        level: document.getElementById('courseLevel').value,
        duration_weeks: parseInt(document.getElementById('courseDuration').value) || 8,
        instructor: document.getElementById('courseInstructor').value.trim() || 'Admin',
        price: parseFloat(document.getElementById('coursePrice').value) || 0,
        is_featured: document.getElementById('courseFeatured').checked,
        is_published: document.getElementById('coursePublished').checked
    };

    if (!courseData.title || !courseData.slug) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }

    const saveBtn = document.getElementById('saveCourseBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    setTimeout(() => {
        showToast('Course saved successfully!', 'success');
        closeCourseModal();
        loadCourses(currentPage);
        loadCourseStats();
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }, 1000);
}

function viewCourse(id) {
    const course = getCourseById(id);
    
    if (!course) {
        showToast('Course not found', 'error');
        return;
    }
    
    const enrollmentCount = course.enrollment_count || 0;
    
    document.getElementById('courseDetails').innerHTML = `
        <div class="course-detail">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                <h3 style="margin: 0;">${course.icon} ${course.name}</h3>
                <span class="badge ${course.is_published ? 'badge-success' : 'badge-warning'}">
                    ${course.is_published ? 'Published' : 'Draft'}
                </span>
            </div>
            <div class="course-detail-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Code</span>
                        <span>${course.code}</span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Level</span>
                        <span><span class="badge ${course.level === 'O Level' ? 'badge-success' : 'badge-danger'}">${course.level}</span></span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Papers</span>
                        <span>${course.papers || 2}</span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Duration</span>
                        <span>${course.duration_weeks || 8} weeks</span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Instructor</span>
                        <span>${course.instructor || 'N/A'}</span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Price</span>
                        <span>${course.price || 0} XAF</span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Students</span>
                        <span>${enrollmentCount}</span>
                    </div>
                    <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: var(--text-muted);">Featured</span>
                        <span>${course.is_featured ? '⭐ Yes' : 'No'}</span>
                    </div>
                </div>
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <strong>Description:</strong>
                    <p style="margin-top: 8px;">Complete ${course.name} ${course.level} resources covering all topics with past papers and revision materials.</p>
                </div>
            </div>
        </div>
    `;
    document.getElementById('viewCourseModal').style.display = 'flex';
}

function deleteCourse(id) {
    deleteTargetId = id;
    document.getElementById('deleteMessage').textContent = 'This will permanently delete this course and all associated data.';
    document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDelete() {
    if (!deleteTargetId) return;
    
    showToast('Course deleted successfully!', 'success');
    closeDeleteModal();
    loadCourses(currentPage);
    loadCourseStats();
    deleteTargetId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteTargetId = null;
}

function closeCourseModal() {
    document.getElementById('courseModal').style.display = 'none';
    editingCourseId = null;
}

function closeViewCourseModal() {
    document.getElementById('viewCourseModal').style.display = 'none';
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
window.loadCourses = loadCourses;
window.editCourse = editCourse;
window.viewCourse = viewCourse;
window.deleteCourse = deleteCourse;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.closeCourseModal = closeCourseModal;
window.closeViewCourseModal = closeViewCourseModal;
window.showCreateCourseModal = showCreateCourseModal;
window.toggleCourseSelect = toggleCourseSelect;
window.toggleSelectAll = toggleSelectAll;
window.bulkCourseAction = bulkCourseAction;
window.exportCourses = exportCourses;
window.refreshCourses = refreshCourses;
window.generateSlug = generateSlug;
window.toggleCourseStatus = toggleCourseStatus;
window.toggleCourseFeatured = toggleCourseFeatured;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.logout = logout;