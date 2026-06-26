// js/course-detail.js - Course Detail Page (Phone-Based)
// ============================================
// EDU CAM LAB - COURSE DETAIL
// Complete course detail functionality
// ============================================

let currentCourse = null;
let selectedRating = 0;
let allCourses = [];

// ============================================
// AUTH CHECK
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadCourse();
});

// ============================================
// BUILD COURSES DATA
// ============================================
function buildAllCourses() {
    if (typeof EDUCATON_DATA === 'undefined') {
        console.warn('EDUCATON_DATA not found, using empty data');
        return [];
    }
    
    const courses = [];

    // O Level subjects
    Object.entries(EDUCATON_DATA.oLevels?.subjects || {}).forEach(([key, subject]) => {
        courses.push({
            id: `o-${key}`,
            title: `${subject.name} - O Level`,
            description: subject.description || `Complete O Level resources for ${subject.name}`,
            exam: 'o-level',
            level: 'O Level',
            code: subject.code,
            papers: subject.papers || [],
            years: subject.years || [],
            hasPamphlet: !!subject.pamphlet,
            icon: '📘',
            badge: 'O Level',
            badgeType: 'premium',
            price: 'Free',
            students: 0,
            rating: '4.5',
            features: ['Past Questions', 'Revision Notes', 'Marking Schemes', 'Exam Tips']
        });
    });

    // A Level subjects
    Object.entries(EDUCATON_DATA.aLevels?.subjects || {}).forEach(([key, subject]) => {
        courses.push({
            id: `a-${key}`,
            title: `${subject.name} - A Level`,
            description: subject.description || `Complete A Level resources for ${subject.name}`,
            exam: 'a-level',
            level: 'A Level',
            code: subject.code,
            papers: subject.papers || [],
            years: subject.years || [],
            hasPamphlet: !!subject.pamphlet,
            icon: '📗',
            badge: 'A Level',
            badgeType: 'premium',
            price: 'Free',
            students: 0,
            rating: '4.5',
            features: ['Past Questions', 'Revision Notes', 'Marking Schemes', 'Exam Tips']
        });
    });

    // BACC series
    Object.entries(EDUCATON_DATA.bacc?.series || {}).forEach(([key, serie]) => {
        courses.push({
            id: `bacc-${key}`,
            title: `BACC - ${serie.name}`,
            description: `Complete BACC resources for ${serie.name}`,
            exam: 'bacc',
            level: 'BACC',
            subjects: serie.subjects || [],
            icon: '📕',
            badge: 'BACC',
            badgeType: 'premium',
            price: 'Free',
            students: 0,
            rating: '4.5',
            features: ['All Subjects', 'Revision Notes', 'Past Questions', 'Study Guides']
        });
    });

    // BEPC subjects
    (EDUCATON_DATA.bepc?.subjects || []).forEach(subject => {
        courses.push({
            id: `bepc-${subject.name.toLowerCase().replace(/\s+/g, '-')}`,
            title: `BEPC - ${subject.name}`,
            description: `Complete BEPC resources for ${subject.name}`,
            exam: 'bepc',
            level: 'BEPC',
            icon: '📙',
            badge: 'BEPC',
            badgeType: 'premium',
            price: 'Free',
            students: 0,
            rating: '4.5',
            features: ['Revision Notes', 'Practice Questions', 'Study Guides']
        });
    });

    // Technical GCE streams
    Object.entries(EDUCATON_DATA.technicalGCE?.streams || {}).forEach(([key, stream]) => {
        courses.push({
            id: `tech-${key}`,
            title: `Technical GCE - ${stream.name}`,
            description: `Complete Technical GCE resources for ${stream.name}`,
            exam: 'technical',
            level: 'Technical GCE',
            subjects: stream.subjects || [],
            icon: '⚙️',
            badge: 'Technical GCE',
            badgeType: 'premium',
            price: 'Free',
            students: 0,
            rating: '4.5',
            features: ['Technical Subjects', 'Practical Guides', 'Past Questions', 'Industry Insights']
        });
    });

    return courses;
}

// ============================================
// GET COURSE BY ID
// ============================================
function getCourseById(id) {
    return allCourses.find(c => c.id === id);
}

// ============================================
// GET RELATED COURSES
// ============================================
function getRelatedCourses(course, limit = 4) {
    return allCourses
        .filter(c => c.id !== course.id && c.exam === course.exam)
        .slice(0, limit);
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderCourseDetail(course) {
    // Badge
    const badgeEl = document.getElementById('courseBadge');
    if (badgeEl) {
        badgeEl.textContent = course.badge || course.level || 'Course';
        badgeEl.className = `course-badge ${course.badgeType || 'premium'}`;
    }

    // Title & Subtitle
    const titleEl = document.getElementById('courseTitle');
    const subtitleEl = document.getElementById('courseSubtitle');
    const breadcrumbEl = document.getElementById('breadcrumbTitle');
    
    if (titleEl) titleEl.textContent = course.title;
    if (subtitleEl) subtitleEl.textContent = course.description?.split('.')[0] + '.' || '';
    if (breadcrumbEl) breadcrumbEl.textContent = course.title;

    // Code
    const codeEl = document.getElementById('courseCode');
    if (codeEl) {
        const span = codeEl.querySelector('span');
        if (span) span.textContent = course.code || 'N/A';
    }

    // Meta
    const metaLevel = document.getElementById('metaLevel');
    const metaPapers = document.getElementById('metaPapers');
    const metaStudents = document.getElementById('metaStudents');
    const metaRating = document.getElementById('metaRating');
    
    if (metaLevel) metaLevel.textContent = course.level || 'N/A';
    if (metaPapers) metaPapers.textContent = course.papers ? `${course.papers.length} Papers` : 'N/A';
    if (metaStudents) metaStudents.textContent = course.students ? `${course.students} Students` : '0 Students';
    if (metaRating) metaRating.textContent = course.rating ? `⭐ ${course.rating}` : '⭐ N/A';

    // Description
    const descEl = document.getElementById('courseDescription');
    if (descEl) descEl.textContent = course.description || '';

    // Details Grid
    const detailGrid = document.getElementById('detailGrid');
    if (detailGrid) {
        const details = [
            { label: 'Level', value: course.level || 'N/A' },
            { label: 'Code', value: course.code || 'N/A' },
            { label: 'Subjects', value: course.subjects ? course.subjects.length : course.papers ? course.papers.length : 'N/A' },
            { label: 'Papers', value: course.papers ? course.papers.length : 'N/A' }
        ];
        detailGrid.innerHTML = details.map(d => `
            <div class="detail-item">
                <span class="label">${d.label}</span>
                <span class="value">${d.value}</span>
            </div>
        `).join('');
    }

    // Papers
    const papersSection = document.getElementById('papersSection');
    const papersList = document.getElementById('papersList');
    if (course.papers && course.papers.length > 0) {
        if (papersSection) papersSection.style.display = 'block';
        if (papersList) {
            papersList.innerHTML = course.papers.map(paper => `
                <div class="paper-item" onclick="viewPaper('${paper}')">
                    <span class="paper-icon">📄</span>
                    <span class="paper-name">${paper}</span>
                    <span class="paper-year">${course.years ? course.years[0] : ''}</span>
                </div>
            `).join('');
        }
    } else {
        if (papersSection) papersSection.style.display = 'none';
    }

    // Years
    const yearsSection = document.getElementById('yearsSection');
    const yearsTags = document.getElementById('yearsTags');
    if (course.years && course.years.length > 0) {
        if (yearsSection) yearsSection.style.display = 'block';
        if (yearsTags) {
            yearsTags.innerHTML = course.years.map(year => `
                <span class="year-tag" onclick="viewYear('${year}')">${year}</span>
            `).join('');
        }
    } else {
        if (yearsSection) yearsSection.style.display = 'none';
    }

    // Price
    const priceEl = document.getElementById('coursePrice');
    if (priceEl) {
        priceEl.textContent = course.price || 'Free';
        priceEl.className = `price ${course.price === 'Free' ? 'free' : ''}`;
    }

    const periodEl = document.getElementById('coursePeriod');
    if (periodEl) periodEl.textContent = 'Full Access';
    
    const studentsEl = document.getElementById('courseStudents');
    if (studentsEl) studentsEl.textContent = `${course.students || 0} students enrolled`;

    // Enroll button
    const enrollBtn = document.getElementById('enrollBtn');
    if (enrollBtn) {
        enrollBtn.innerHTML = '<i class="fas fa-user-plus"></i> Enroll Now';
        enrollBtn.className = 'btn btn-primary';
    }

    // Related Courses
    const relatedGrid = document.getElementById('relatedGrid');
    if (relatedGrid) {
        const related = getRelatedCourses(course);
        if (related.length > 0) {
            relatedGrid.innerHTML = related.map(c => `
                <div class="related-card" onclick="viewRelatedCourse('${c.id}')">
                    <div class="related-icon">${c.icon || '📚'}</div>
                    <h4>${c.title}</h4>
                    <p>${c.level || ''}</p>
                </div>
            `).join('');
        } else {
            relatedGrid.innerHTML = `<p style="color: var(--text-muted);">No related courses found.</p>`;
        }
    }
}

// ============================================
// ACTIONS
// ============================================
function viewPaper(paper) {
    if (!Auth.isAuthenticated()) {
        showToast('Please login to access past questions', 'info');
        return;
    }
    showToast(`📄 Viewing: ${paper} - Full access available`, 'info');
}

function viewYear(year) {
    if (!Auth.isAuthenticated()) {
        showToast('Please login to access past questions', 'info');
        return;
    }
    showToast(`📅 Viewing past questions from ${year}`, 'info');
}

function viewRelatedCourse(id) {
    window.location.href = `course-detail.html?id=${id}`;
}

function enrollCourse() {
    if (!Auth.isAuthenticated()) {
        if (confirm('Please login to enroll in this course.')) {
            window.location.href = 'login.html?redirect=course-detail.html';
        }
        return;
    }

    if (currentCourse && currentCourse.isSample) {
        showToast('📝 This is a sample. Enroll for full access to all resources.', 'info');
        return;
    }

    showToast('🎓 You are enrolled in this course! Full access granted.', 'success');
}

// ============================================
// REVIEW SYSTEM
// ============================================
function setRating(rating) {
    selectedRating = rating;
    document.querySelectorAll('#starsInput .star').forEach(star => {
        const value = parseInt(star.dataset.value);
        star.classList.toggle('active', value <= rating);
    });
}

function submitReview() {
    if (!Auth.isAuthenticated()) {
        if (confirm('Please login to leave a review.')) {
            window.location.href = 'login.html';
        }
        return;
    }

    if (selectedRating === 0) {
        const msgEl = document.getElementById('reviewMessage');
        if (msgEl) {
            msgEl.innerHTML = `
                <div style="padding: 12px; background: #fef3c7; border-radius: 8px; color: #92400e;">
                    <i class="fas fa-exclamation-triangle"></i> Please select a rating.
                </div>
            `;
        }
        return;
    }

    const reviewText = document.getElementById('reviewText');
    if (!reviewText) return;
    const text = reviewText.value.trim();
    
    if (!text) {
        const msgEl = document.getElementById('reviewMessage');
        if (msgEl) {
            msgEl.innerHTML = `
                <div style="padding: 12px; background: #fef3c7; border-radius: 8px; color: #92400e;">
                    <i class="fas fa-exclamation-triangle"></i> Please write a review.
                </div>
            `;
        }
        return;
    }

    showToast('Review submitted successfully!', 'success');
    setRating(0);
    reviewText.value = '';
    setTimeout(() => {
        const msgEl = document.getElementById('reviewMessage');
        if (msgEl) msgEl.innerHTML = '';
    }, 3000);
}

// ============================================
// LOAD COURSE
// ============================================
async function loadCourse() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('slug');

    if (!id) {
        const loadingEl = document.getElementById('loadingState');
        const errorEl = document.getElementById('errorState');
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        return;
    }

    try {
        allCourses = buildAllCourses();
        currentCourse = getCourseById(id);

        if (!currentCourse) {
            const loadingEl = document.getElementById('loadingState');
            const errorEl = document.getElementById('errorState');
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            return;
        }

        const loadingEl = document.getElementById('loadingState');
        const contentEl = document.getElementById('courseContent');
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        renderCourseDetail(currentCourse);

    } catch (error) {
        console.error('Error loading course:', error);
        const loadingEl = document.getElementById('loadingState');
        const errorEl = document.getElementById('errorState');
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
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
// GLOBAL FUNCTIONS
// ============================================
window.setRating = setRating;
window.submitReview = submitReview;
window.enrollCourse = enrollCourse;
window.viewPaper = viewPaper;
window.viewYear = viewYear;
window.viewRelatedCourse = viewRelatedCourse;
window.showToast = showToast;