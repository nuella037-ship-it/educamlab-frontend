// js/courses.js - Courses Page (Phone-Based)
// ============================================
// EDU CAM LAB - COURSES PAGE
// Complete course listing with filtering and pagination
// ============================================

let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
const itemsPerPage = 12;

// ============================================
// BUILD COURSES DATA
// ============================================
function buildCourses() {
    if (typeof EDUCATON_DATA === 'undefined') {
        console.warn('EDUCATON_DATA not found');
        return [];
    }
    
    const courses = [];

    // O Level subjects
    Object.entries(EDUCATON_DATA.oLevels?.subjects || {}).forEach(([key, subject]) => {
        courses.push({
            id: `o-${key}`,
            title: `${subject.name} - O Level`,
            description: `${subject.papers?.length || 0} papers with past questions and revision materials`,
            exam: 'o-level',
            category: 'past-questions',
            level: 'O Level',
            code: subject.code,
            papers: subject.papers?.length || 0,
            years: subject.years || [],
            hasPamphlet: !!subject.pamphlet,
            icon: '📘',
            popular: true,
            difficulty: subject.difficulty || 'Intermediate'
        });
    });

    // A Level subjects
    Object.entries(EDUCATON_DATA.aLevels?.subjects || {}).forEach(([key, subject]) => {
        courses.push({
            id: `a-${key}`,
            title: `${subject.name} - A Level`,
            description: `${subject.papers?.length || 0} papers with past questions and revision materials`,
            exam: 'a-level',
            category: 'past-questions',
            level: 'A Level',
            code: subject.code,
            papers: subject.papers?.length || 0,
            years: subject.years || [],
            hasPamphlet: !!subject.pamphlet,
            icon: '📗',
            popular: true,
            difficulty: subject.difficulty || 'Advanced'
        });
    });

    // BACC series
    Object.entries(EDUCATON_DATA.bacc?.series || {}).forEach(([key, serie]) => {
        courses.push({
            id: `bacc-${key}`,
            title: `${serie.name}`,
            description: `${serie.subjects?.length || 0} subjects with comprehensive resources`,
            exam: 'bacc',
            category: 'courses',
            level: 'BACC',
            subjects: serie.subjects || [],
            icon: '📕',
            popular: ['Série B', 'Série C'].includes(serie.name)
        });
    });

    // BEPC subjects
    (EDUCATON_DATA.bepc?.subjects || []).forEach(subject => {
        courses.push({
            id: `bepc-${subject.name.toLowerCase().replace(/\s+/g, '-')}`,
            title: `BEPC - ${subject.name}`,
            description: `Complete BEPC resources for ${subject.name}`,
            exam: 'bepc',
            category: 'courses',
            level: 'BEPC',
            icon: '📙',
            popular: ['French', 'English', 'Mathematics'].includes(subject.name)
        });
    });

    // Technical GCE streams
    Object.entries(EDUCATON_DATA.technicalGCE?.streams || {}).forEach(([key, stream]) => {
        courses.push({
            id: `tech-${key}`,
            title: `Technical GCE - ${stream.name}`,
            description: `${stream.subjects?.length || 0} subjects with technical resources`,
            exam: 'technical',
            category: 'courses',
            level: 'Technical GCE',
            subjects: stream.subjects || [],
            icon: '⚙️',
            popular: true
        });
    });

    // Quizzes
    Object.entries(EDUCATON_DATA.quizzes || {}).forEach(([key, quiz]) => {
        if (quiz.subjects) {
            quiz.subjects.forEach(subject => {
                courses.push({
                    id: `quiz-${key}-${subject.name.toLowerCase().replace(/\s+/g, '-')}`,
                    title: `${subject.name} Quiz (${quiz.title})`,
                    description: `${subject.questions || 0} questions • ${subject.duration || 'N/A'}`,
                    exam: key === 'bacc' ? 'bacc' : key === 'bepc' ? 'bepc' : key === 'technical-gce' ? 'technical' : key,
                    category: 'quizzes',
                    level: quiz.title || 'Quiz',
                    questions: subject.questions || 0,
                    duration: subject.duration || 'N/A',
                    icon: '🧪',
                    popular: true
                });
            });
        }
    });

    return courses;
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderCourses(courses) {
    const grid = document.getElementById('courseGrid');
    if (!grid) return;
    
    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No courses found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
                <button onclick="resetFilters()" class="btn btn-primary" style="margin-top: 16px;">
                    <i class="fas fa-undo"></i> Reset Filters
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = courses.map(course => `
        <div class="course-card" onclick="viewCourse('${course.id}')">
            <div class="course-image">
                ${course.icon || '📚'}
                ${course.isSample ? '<span class="course-badge">Free Sample</span>' : ''}
                ${course.download ? '<span class="course-badge">📥 Download</span>' : ''}
            </div>
            <div class="course-body">
                <div class="course-tags">
                    <span class="tag">${course.level || 'All Levels'}</span>
                    <span class="tag">${course.exam ? course.exam.toUpperCase() : ''}</span>
                    ${course.category ? `<span class="tag">${course.category.replace('-', ' ').toUpperCase()}</span>` : ''}
                    ${course.difficulty ? `<span class="tag">${course.difficulty}</span>` : ''}
                </div>
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="course-meta">
                    ${course.papers ? `<span><i class="fas fa-file-alt"></i> ${course.papers} Papers</span>` : ''}
                    ${course.years && course.years.length > 0 ? `<span><i class="fas fa-calendar"></i> ${course.years.slice(0, 3).join(', ')}</span>` : ''}
                    ${course.questions ? `<span><i class="fas fa-question-circle"></i> ${course.questions} Qs</span>` : ''}
                    ${course.duration ? `<span><i class="fas fa-clock"></i> ${course.duration}</span>` : ''}
                    ${course.subjects ? `<span><i class="fas fa-book"></i> ${course.subjects.length} Subjects</span>` : ''}
                    ${course.code ? `<span><i class="fas fa-tag"></i> ${course.code}</span>` : ''}
                </div>
                <div class="course-footer">
                    <span class="price free">🔓 Access</span>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewCourse('${course.id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(totalItems) {
    const container = document.getElementById('paginationContainer');
    const info = document.getElementById('paginationInfo');
    if (!container || !info) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        info.textContent = `Showing ${totalItems} ${totalItems === 1 ? 'result' : 'results'}`;
        return;
    }

    let html = '';
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="page-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            html += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="page-btn" style="border: none; background: transparent;">...</span>`;
        }
    }

    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;

    container.innerHTML = html;
    
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, totalItems);
    info.textContent = `Showing ${start}-${end} of ${totalItems} results`;
}

// ============================================
// FILTER FUNCTIONS
// ============================================
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const examFilter = document.getElementById('examFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const exam = examFilter ? examFilter.value : '';
    const category = categoryFilter ? categoryFilter.value : '';
    const sort = sortFilter ? sortFilter.value : 'popular';

    filteredCourses = allCourses.filter(course => {
        if (search && !course.title.toLowerCase().includes(search) && 
            !course.description.toLowerCase().includes(search) &&
            !(course.code && course.code.toLowerCase().includes(search))) {
            return false;
        }

        if (exam && course.exam !== exam) return false;
        if (category && course.category !== category) return false;

        return true;
    });

    switch (sort) {
        case 'popular':
            filteredCourses.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
            break;
        case 'newest':
            filteredCourses.sort((a, b) => (a.year || '').localeCompare(b.year || ''));
            break;
        case 'title':
            filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredCourses.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            break;
    }

    currentPage = 1;
    updateDisplay();
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const examFilter = document.getElementById('examFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (searchInput) searchInput.value = '';
    if (examFilter) examFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (sortFilter) sortFilter.value = 'popular';
    applyFilters();
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    updateDisplay();
    const grid = document.getElementById('courseGrid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateDisplay() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredCourses.slice(start, end);
    
    renderCourses(pageItems);
    renderPagination(filteredCourses.length);
    const infoEl = document.getElementById('resultsInfo');
    if (infoEl) infoEl.textContent = `Showing ${filteredCourses.length} results`;
}

// ============================================
// VIEW COURSE
// ============================================
function viewCourse(id) {
    window.location.href = `course-detail.html?id=${id}`;
}

// ============================================
// URL PARAMETER SUPPORT
// ============================================
function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const exam = params.get('exam');
    const category = params.get('category');
    const search = params.get('search');
    
    const examFilter = document.getElementById('examFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    const examMap = {
        'o-level': 'o-level',
        'a-level': 'a-level',
        'bacc': 'bacc',
        'bepc': 'bepc',
        'technical': 'technical'
    };
    
    const categoryMap = {
        'past-questions': 'past-questions',
        'pamphlets': 'pamphlets',
        'quizzes': 'quizzes',
        'courses': 'courses'
    };
    
    if (exam && examMap[exam] && examFilter) {
        examFilter.value = examMap[exam];
    }
    
    if (category && categoryMap[category] && categoryFilter) {
        categoryFilter.value = categoryMap[category];
    }
    
    if (search && searchInput) {
        searchInput.value = search;
    }
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    const totalEl = document.getElementById('totalCourses');
    const subjectsEl = document.getElementById('totalSubjects');
    const papersEl = document.getElementById('totalPapers');
    
    if (totalEl) totalEl.textContent = allCourses.length;
    
    const subjects = new Set();
    const papers = allCourses.filter(c => c.papers).reduce((sum, c) => sum + c.papers, 0);
    
    allCourses.forEach(c => {
        if (c.level) subjects.add(c.level);
        if (c.exam) subjects.add(c.exam);
    });

    if (subjectsEl) subjectsEl.textContent = subjects.size;
    if (papersEl) papersEl.textContent = papers + allCourses.filter(c => c.category === 'quizzes').length;
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    allCourses = buildCourses();
    loadFiltersFromURL();
    applyFilters();
    updateStats();
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.goToPage = goToPage;
window.viewCourse = viewCourse;