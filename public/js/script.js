// ============================================
// EDU CAM LAB - PAGE-SPECIFIC SCRIPTS
// Production-ready page controllers with phone-based auth
// ============================================

// ============================================
// PAGE CONTROLLER
// ============================================

const PageController = {
    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        // Initialize mobile menu first (critical for all pages)
        this._initMobileMenu();
        
        // Initialize dark mode toggle
        this._initDarkModeToggle();
        
        const page = this.getCurrentPage();
        this[page]?.();
        
        if (window.App?.config?.debug) {
            console.log(`📄 Page controller: ${page}`);
        }
    },

    getCurrentPage() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        return path.replace('.html', '');
    },

    // ============================================
    // MOBILE MENU HANDLER (FIXED)
    // ============================================

    _initMobileMenu() {
        const menuBtn = document.getElementById('menuToggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (!menuBtn || !navLinks) return;

        // Toggle menu on button click
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('open');
            // Toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (navLinks.classList.contains('open') && 
                !navLinks.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                navLinks.classList.remove('open');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('open');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });

        // Close menu on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    },

    // ============================================
    // DARK MODE TOGGLE
    // ============================================

    _initDarkModeToggle() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;

        // Set initial state
        const isDark = localStorage.getItem('theme') === 'dark';
        toggle.checked = isDark;
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        toggle.addEventListener('change', function() {
            if (this.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (window.App) window.App.showToast('🌙 Dark mode enabled', 'success');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                if (window.App) window.App.showToast('☀️ Light mode enabled', 'success');
            }
            
            // Update status text if exists
            const status = document.getElementById('darkModeStatus');
            if (status) {
                status.innerHTML = this.checked ? 
                    'Dark mode is currently <strong>enabled</strong>' : 
                    'Dark mode is currently <strong>disabled</strong>';
            }
        });
    },

    // ============================================
    // PAGE HANDLERS
    // ============================================

    // -------- INDEX PAGE --------
    index() {
        this._initSmoothScroll();
        this._initScrollAnimations();
        this._initCounters();
        this._consoleBranding();
    },

    // -------- COURSES PAGE --------
    courses() {
        this._initCourses();
    },

    // -------- COURSE DETAIL PAGE --------
    'course-detail'() {
        this._initCourseDetail();
    },

    // -------- DASHBOARD PAGE --------
    dashboard() {
        if (!Auth.requireAuth()) return;
        this._initDashboard();
    },

    // -------- PROFILE PAGE --------
    profile() {
        if (!Auth.requireAuth()) return;
        this._initProfile();
    },

    // -------- SETTINGS PAGE --------
    settings() {
        if (!Auth.requireAuth()) return;
        this._initSettings();
    },

    // -------- LOGIN PAGE --------
    login() {
        this._initLogin();
    },

    // -------- REGISTER PAGE --------
    register() {
        this._initRegister();
    },

    // -------- VERIFY PAGE --------
    verify() {
        this._initVerify();
    },

    // -------- FORGOT PASSWORD PAGE --------
    'forgot-password'() {
        this._initForgotPassword();
    },

    // -------- RESET PASSWORD PAGE --------
    'reset-password'() {
        this._initResetPassword();
    },

    // -------- CONTACT PAGE --------
    contact() {
        this._initContact();
    },

    // ============================================
    // PAGE-SPECIFIC HELPERS
    // ============================================

    // -------- INDEX HELPERS --------
    _initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.pushState(null, null, this.getAttribute('href'));
                }
            });
        });
    },

    _initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.exam-card, .feature-card, .stat-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    },

    _initCounters() {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.target);
                    const suffix = el.dataset.suffix || '';
                    this._animateCounter(el, target, suffix);
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.stat-number').forEach(el => {
            counterObserver.observe(el);
        });
    },

    _animateCounter(element, target, suffix = '') {
        let current = 0;
        const increment = Math.ceil(target / 40);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = current.toLocaleString() + suffix;
        }, 30);
    },

    _consoleBranding() {
        console.log('%c📚 EduCamLab', 'font-size: 32px; font-weight: 800; color: #4f46e5;');
        console.log('%cCameroon\'s #1 Exam Preparation Platform', 'font-size: 16px; color: #6b7280;');
        console.log('%c🚀 Join 10,000+ students excelling in their exams!', 'font-size: 14px; color: #10b981;');
    },

    // -------- COURSES HELPERS --------
    _initCourses() {
        this._buildCourses();
        this._loadFiltersFromURL();
        this._applyFilters();
        this._updateStats();
        this._initCourseSearch();
    },

    _initCourseSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this._applyFilters();
            }, 300));
        }
    },

    _buildCourses() {
        const data = window.EDUCATON_DATA;
        if (!data) {
            console.warn('EDUCATON_DATA not found');
            this.courses = [];
            return;
        }

        const courses = [];

        // O Level
        Object.entries(data.oLevels?.subjects || {}).forEach(([key, subject]) => {
            courses.push({
                id: `o-${key}`,
                title: `${subject.name} - O Level`,
                description: `${subject.papers?.length || 0} papers with past questions`,
                exam: 'o-level',
                category: 'past-questions',
                level: 'O Level',
                code: subject.code,
                papers: subject.papers?.length || 0,
                years: subject.years || [],
                icon: '📘',
                popular: true
            });
        });

        // A Level
        Object.entries(data.aLevels?.subjects || {}).forEach(([key, subject]) => {
            courses.push({
                id: `a-${key}`,
                title: `${subject.name} - A Level`,
                description: `${subject.papers?.length || 0} papers with past questions`,
                exam: 'a-level',
                category: 'past-questions',
                level: 'A Level',
                code: subject.code,
                papers: subject.papers?.length || 0,
                years: subject.years || [],
                icon: '📗',
                popular: true
            });
        });

        // BACC
        Object.entries(data.bacc?.series || {}).forEach(([key, serie]) => {
            courses.push({
                id: `bacc-${key}`,
                title: `BACC - ${serie.name}`,
                description: `${serie.subjects?.length || 0} subjects with resources`,
                exam: 'bacc',
                category: 'courses',
                level: 'BACC',
                subjects: serie.subjects || [],
                icon: '📕',
                popular: ['Série B', 'Série C'].includes(serie.name)
            });
        });

        // BEPC
        (data.bepc?.subjects || []).forEach(subject => {
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

        // Technical GCE
        Object.entries(data.technicalGCE?.streams || {}).forEach(([key, stream]) => {
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
        Object.entries(data.quizzes || {}).forEach(([key, quiz]) => {
            if (quiz.subjects) {
                quiz.subjects.forEach(subject => {
                    courses.push({
                        id: `quiz-${key}-${subject.name.toLowerCase().replace(/\s+/g, '-')}`,
                        title: `${subject.name} Quiz (${quiz.title})`,
                        description: `${subject.questions || 0} questions • ${subject.duration || 'N/A'}`,
                        exam: key === 'bacc' ? 'bacc' : key === 'bepc' ? 'bepc' : 'technical',
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

        this.courses = courses;
    },

    _loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        const examMap = { 'o-level': 'o-level', 'a-level': 'a-level', 'bacc': 'bacc', 'bepc': 'bepc', 'technical': 'technical' };
        const categoryMap = { 'past-questions': 'past-questions', 'pamphlets': 'pamphlets', 'quizzes': 'quizzes', 'courses': 'courses' };
        
        const exam = params.get('exam');
        const category = params.get('category');
        const search = params.get('search');

        const examFilter = document.getElementById('examFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchInput');

        if (exam && examMap[exam] && examFilter) examFilter.value = examMap[exam];
        if (category && categoryMap[category] && categoryFilter) categoryFilter.value = categoryMap[category];
        if (search && searchInput) searchInput.value = search;
    },

    _applyFilters() {
        const search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
        const exam = document.getElementById('examFilter')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const sort = document.getElementById('sortFilter')?.value || 'popular';

        this.filteredCourses = (this.courses || []).filter(c => {
            if (search && !c.title.toLowerCase().includes(search) && !(c.description || '').toLowerCase().includes(search)) return false;
            if (exam && c.exam !== exam) return false;
            if (category && c.category !== category) return false;
            return true;
        });

        switch (sort) {
            case 'popular': this.filteredCourses.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0)); break;
            case 'title': this.filteredCourses.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'title-desc': this.filteredCourses.sort((a, b) => b.title.localeCompare(a.title)); break;
        }

        this.currentPage = 1;
        this._updateDisplay();
    },

    _updateDisplay() {
        const start = (this.currentPage - 1) * 12;
        const pageItems = this.filteredCourses.slice(start, start + 12);
        this._renderCourses(pageItems);
        this._renderPagination(this.filteredCourses.length);
        
        const infoEl = document.getElementById('resultsInfo');
        if (infoEl) infoEl.textContent = `Showing ${this.filteredCourses.length} results`;
    },

    _renderCourses(courses) {
        const grid = document.getElementById('courseGrid');
        if (!grid) return;

        if (!courses || courses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                    <i class="fas fa-search" style="font-size:48px;display:block;margin-bottom:16px;opacity:0.3;"></i>
                    <h3 style="color:var(--text-primary);">No courses found</h3>
                    <p style="color:var(--text-muted);">Try adjusting your search or filters</p>
                    <button onclick="window.App?.resetFilters?.()" class="btn btn-primary" style="margin-top:16px;">
                        <i class="fas fa-undo"></i> Reset Filters
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = courses.map(c => `
            <div class="course-card" onclick="window.location.href='course-detail.html?id=${c.id}'">
                <div class="course-image" style="display:flex;align-items:center;justify-content:center;font-size:48px;height:120px;background:linear-gradient(135deg,var(--primary-light),var(--primary));color:white;position:relative;">
                    ${c.icon || '📚'}
                    <span class="course-badge" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;color:white;">
                        ${c.exam?.toUpperCase() || ''}
                    </span>
                </div>
                <div class="course-body" style="padding:16px;">
                    <div class="course-tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                        <span class="tag" style="font-size:11px;padding:2px 10px;border-radius:12px;background:var(--bg-secondary);color:var(--text-muted);">${c.level || ''}</span>
                        <span class="tag" style="font-size:11px;padding:2px 10px;border-radius:12px;background:var(--bg-secondary);color:var(--text-muted);">${c.category || 'Course'}</span>
                    </div>
                    <h3 style="font-size:18px;font-weight:700;margin-bottom:6px;color:var(--text-primary);">${c.title}</h3>
                    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">${c.description || ''}</p>
                    <div class="course-footer" style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border-color);">
                        <span class="price free" style="font-size:20px;font-weight:800;color:var(--success);">Free</span>
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();window.location.href='course-detail.html?id=${c.id}'" style="padding:8px 16px;font-size:13px;">
                            <i class="fas fa-arrow-right"></i> View
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    _renderPagination(totalItems) {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / 12);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        let html = '';
        html += `<button class="page-btn" onclick="window.App?.goToPage?.(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<button class="page-btn active">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                html += `<button class="page-btn" onclick="window.App?.goToPage?.(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span class="page-btn" style="border:none;background:transparent;">...</span>`;
            }
        }

        html += `<button class="page-btn" onclick="window.App?.goToPage?.(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>`;

        container.innerHTML = html;
    },

    _updateStats() {
        const totalEl = document.getElementById('totalCourses');
        if (totalEl) totalEl.textContent = this.courses.length;

        const subjects = new Set();
        this.courses.forEach(c => { if (c.level) subjects.add(c.level); if (c.exam) subjects.add(c.exam); });
        const subjectsEl = document.getElementById('totalSubjects');
        if (subjectsEl) subjectsEl.textContent = subjects.size;
    },

    // ============================================
    // COURSE DETAIL HELPERS (UPDATED WITH AUTH CHECK)
    // ============================================

    _initCourseDetail() {
        this._loadCourse();
    },

    _loadCourse() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
            this._showCourseError();
            return;
        }

        const course = this.courses?.find(c => c.id === id);
        if (course) {
            this.currentCourse = course;
            
            // CHECK AUTHENTICATION
            if (!this._isAuthenticated()) {
                this._showLoginRequired(course);
                return;
            }
            
            this._renderCourseDetail(course);
            return;
        }

        this._fetchCourseFromAPI(id);
    },

    _isAuthenticated() {
        return localStorage.getItem('token') !== null && typeof Auth !== 'undefined' && Auth.isAuthenticated();
    },

    _showLoginRequired(course) {
        const loading = document.getElementById('loadingState');
        const content = document.getElementById('courseContent');
        const loginRequired = document.getElementById('loginRequired');
        
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'none';
        
        // Update breadcrumb with course name
        if (course) {
            document.getElementById('breadcrumbExam').textContent = course.exam?.toUpperCase() || '';
            document.getElementById('breadcrumbSubject').textContent = course.title || '';
        }
        
        if (loginRequired) {
            loginRequired.style.display = 'block';
            // Update the sample preview with course-specific info if available
            if (course) {
                const previewTitle = loginRequired.querySelector('h4');
                if (previewTitle) previewTitle.textContent = `📖 ${course.title} - Preview`;
            }
        }
    },

    async _fetchCourseFromAPI(id) {
        try {
            const result = await API.getCourseById(id);
            if (result.success) {
                this.currentCourse = result.data;
                
                // CHECK AUTHENTICATION
                if (!this._isAuthenticated()) {
                    this._showLoginRequired(result.data);
                    return;
                }
                
                this._renderCourseDetail(result.data);
            } else {
                this._showCourseError();
            }
        } catch {
            this._showCourseError();
        }
    },

    _showCourseError() {
        const loading = document.getElementById('loadingState');
        const error = document.getElementById('errorState');
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'block';
    },

    _renderCourseDetail(course) {
        const loading = document.getElementById('loadingState');
        const content = document.getElementById('courseContent');
        const loginRequired = document.getElementById('loginRequired');
        
        if (loading) loading.style.display = 'none';
        if (loginRequired) loginRequired.style.display = 'none';
        if (content) content.style.display = 'block';

        const badgeEl = document.getElementById('courseBadge');
        if (badgeEl) {
            badgeEl.textContent = course.badge || course.level || 'Course';
            badgeEl.className = `badge ${course.badgeType === 'premium' ? 'badge-info' : 'badge-success'}`;
        }

        const titleEl = document.getElementById('courseTitle');
        if (titleEl) titleEl.textContent = course.title;

        const descEl = document.getElementById('courseDescription');
        if (descEl) descEl.textContent = course.description || '';

        const codeEl = document.getElementById('courseCode');
        if (codeEl) codeEl.textContent = `Code: ${course.code || 'N/A'}`;

        const metaLevel = document.getElementById('metaLevel');
        const metaPapers = document.getElementById('metaPapers');
        if (metaLevel) metaLevel.textContent = course.level || 'N/A';
        if (metaPapers) metaPapers.textContent = course.papers ? `${course.papers.length} Papers` : 'N/A';

        const detailGrid = document.getElementById('detailGrid');
        if (detailGrid) {
            const details = [
                { label: 'Level', value: course.level || 'N/A' },
                { label: 'Code', value: course.code || 'N/A' },
                { label: 'Papers', value: course.papers?.length || 'N/A' }
            ];
            detailGrid.innerHTML = details.map(d => `
                <div class="detail-item" style="padding:12px 16px;background:var(--bg-secondary);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span class="label" style="font-size:14px;color:var(--text-muted);">${d.label}</span>
                    <span class="value" style="font-weight:600;color:var(--text-primary);">${d.value}</span>
                </div>
            `).join('');
        }

        const papersList = document.getElementById('papersList');
        if (papersList && course.papers?.length) {
            papersList.innerHTML = course.papers.map(p => `
                <div class="paper-item" onclick="window.App?.viewPaper?.('${p}')" style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border-color);cursor:pointer;transition:var(--transition);">
                    <span class="paper-icon" style="font-size:18px;">📄</span>
                    <span class="paper-name" style="font-weight:500;color:var(--text-primary);">${p}</span>
                    <span class="paper-year" style="margin-left:auto;font-size:12px;color:var(--text-muted);">${course.years?.[0] || ''}</span>
                </div>
            `).join('');
        }

        const yearsTags = document.getElementById('yearsTags');
        if (yearsTags && course.years?.length) {
            yearsTags.innerHTML = course.years.map(y => `
                <span class="year-tag" onclick="window.App?.viewYear?.('${y}')" style="padding:6px 16px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:20px;font-size:13px;cursor:pointer;transition:var(--transition);">${y}</span>
            `).join('');
        }

        const priceEl = document.getElementById('coursePrice');
        if (priceEl) {
            priceEl.textContent = course.price || 'Free';
            priceEl.className = `price ${course.price === 'Free' ? 'free' : ''}`;
        }

        const relatedGrid = document.getElementById('relatedGrid');
        if (relatedGrid) {
            const related = (this.courses || [])
                .filter(c => c.id !== course.id && c.exam === course.exam)
                .slice(0, 4);
            if (related.length) {
                relatedGrid.innerHTML = related.map(c => `
                    <div class="related-card" onclick="window.location.href='course-detail.html?id=${c.id}'" style="background:var(--bg-card);border-radius:var(--border-radius);padding:16px;border:1px solid var(--border-color);cursor:pointer;transition:var(--transition);">
                        <div style="font-size:32px;">${c.icon || '📚'}</div>
                        <h4 style="font-size:14px;font-weight:600;margin:8px 0 4px;color:var(--text-primary);">${c.title}</h4>
                        <p style="font-size:13px;color:var(--text-muted);">${c.level || ''}</p>
                    </div>
                `).join('');
            } else {
                relatedGrid.innerHTML = `<p style="color:var(--text-muted);text-align:center;">No related courses found.</p>`;
            }
        }
    },

    // -------- DASHBOARD HELPERS --------
    async _initDashboard() {
        await this._loadUserData();
        await this._loadPinStatus();
        await this._loadStats();
        await this._loadCourses();
    },

    async _loadUserData() {
        try {
            const result = await API.getProfile();
            if (result.success) {
                const user = result.data;
                Auth.setUserData(user);
                const nameEl = document.getElementById('userName');
                const avatarEl = document.getElementById('userAvatar');
                const greetingEl = document.getElementById('greeting');
                if (nameEl) nameEl.textContent = Auth.getUserName();
                if (avatarEl) avatarEl.textContent = Auth.getUserInitials();
                if (greetingEl) greetingEl.textContent = `👋 ${Utils.getGreeting()},`;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },

    async _loadPinStatus() {
        try {
            const result = await API.getMyPins();
            if (result.success) {
                const pins = result.data || [];
                const activePin = pins.find(p => p.is_active);
                const pinDisplay = document.getElementById('userPin');
                const pinStatus = document.getElementById('pinStatus');
                if (pinDisplay) pinDisplay.textContent = activePin ? activePin.code : 'No PIN assigned';
                if (pinStatus) {
                    pinStatus.textContent = activePin ? '✅ Active' : '⏳ Inactive';
                    pinStatus.style.color = activePin ? '#10b981' : '#f59e0b';
                }
            }
        } catch (error) {
            console.error('Error loading PIN:', error);
        }
    },

    async _loadStats() {
        try {
            const result = await API.getDashboardStats();
            if (result.success) {
                const data = result.data;
                const enrolled = document.getElementById('enrolledCount');
                const completed = document.getElementById('completedCount');
                const progress = document.getElementById('progressPercent');
                const streak = document.getElementById('streakCount');
                if (enrolled) enrolled.textContent = data.totalEnrolled || 0;
                if (completed) completed.textContent = data.completed || 0;
                if (progress) progress.textContent = (data.avgProgress || 0) + '%';
                if (streak) streak.textContent = data.streak || 0;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    async _loadCourses() {
        try {
            const result = await API.getUserCourses();
            const container = document.getElementById('recentCourses');
            if (!container) return;

            const courses = result.success ? result.data || [] : [];
            if (!courses.length) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px 20px;">
                        <i class="fas fa-book-open" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.3;"></i>
                        <h3 style="color:var(--text-primary);">No courses enrolled yet</h3>
                        <p style="color:var(--text-muted);">Start your exam preparation journey today</p>
                        <a href="courses.html" class="btn btn-primary" style="margin-top:12px;">
                            <i class="fas fa-search"></i> Browse Courses
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = courses.slice(0, 3).map(c => `
                <div class="course-card" onclick="window.location.href='course-detail.html?id=${c.id}'" style="background:var(--bg-card);border-radius:var(--border-radius);overflow:hidden;border:1px solid var(--border-color);cursor:pointer;transition:var(--transition);box-shadow:var(--shadow);">
                    <div class="course-image" style="display:flex;align-items:center;justify-content:center;font-size:36px;height:100px;background:linear-gradient(135deg,var(--primary-light),var(--primary));color:white;">
                        ${c.icon || '📚'}
                    </div>
                    <div class="course-body" style="padding:16px;">
                        <h4 style="font-size:16px;font-weight:600;margin-bottom:4px;color:var(--text-primary);">${c.title}</h4>
                        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${c.level || ''}</p>
                        <div class="progress-container" style="margin-bottom:8px;">
                            <div class="progress-label" style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:2px;">
                                <span>Progress</span>
                                <span>${c.progress || 0}%</span>
                            </div>
                            <div class="progress-bar" style="width:100%;height:4px;background:var(--bg-secondary);border-radius:2px;overflow:hidden;">
                                <div class="progress-fill" style="width:${c.progress || 0}%;height:100%;border-radius:2px;background:var(--primary);transition:width 0.6s ease;"></div>
                            </div>
                        </div>
                        <div class="course-footer" style="display:flex;justify-content:flex-end;padding-top:12px;border-top:1px solid var(--border-color);">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();window.location.href='course-detail.html?id=${c.id}'" style="padding:6px 14px;font-size:13px;">
                                <i class="fas fa-arrow-right"></i> Continue
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    },

    // -------- PROFILE HELPERS --------
    async _initProfile() {
        await this._loadProfile();
        this._initProfileForms();
    },

    async _loadProfile() {
        try {
            const result = await API.getProfile();
            if (result.success) {
                const user = result.data;
                document.getElementById('firstName').value = user.firstname || '';
                document.getElementById('lastName').value = user.lastname || '';
                document.getElementById('phone').value = user.phone || '';
                document.getElementById('profileName').textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Student';
                document.getElementById('avatarPreview').textContent = (user.firstname || 'S')[0].toUpperCase();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            if (window.App) window.App.showToast('Failed to load profile', 'error');
        }
    },

    _initProfileForms() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const firstname = document.getElementById('firstName')?.value.trim();
                const lastname = document.getElementById('lastName')?.value.trim();
                if (!firstname || !lastname) {
                    if (window.App) window.App.showToast('Please fill in all fields', 'error');
                    return;
                }
                try {
                    const result = await API.updateProfile({ firstname, lastname });
                    if (result.success) {
                        if (window.App) window.App.showToast('Profile updated successfully!', 'success');
                        await window.PageController._loadProfile();
                    }
                } catch (error) {
                    if (window.App) window.App.showToast('Failed to update profile', 'error');
                }
            });
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const current = document.getElementById('currentPassword')?.value;
                const newPass = document.getElementById('newPassword')?.value;
                const confirm = document.getElementById('confirmPassword')?.value;
                if (!current || !newPass || !confirm) {
                    if (window.App) window.App.showToast('Please fill in all fields', 'error');
                    return;
                }
                if (newPass !== confirm) {
                    if (window.App) window.App.showToast('Passwords do not match', 'error');
                    return;
                }
                if (newPass.length < 8) {
                    if (window.App) window.App.showToast('Password must be at least 8 characters', 'error');
                    return;
                }
                try {
                    const result = await API.changePassword({ currentPassword: current, newPassword: newPass });
                    if (result.success) {
                        if (window.App) window.App.showToast('Password changed successfully!', 'success');
                        passwordForm.reset();
                    }
                } catch (error) {
                    if (window.App) window.App.showToast('Failed to change password', 'error');
                }
            });
        }
    },

    // -------- SETTINGS HELPERS --------
    _initSettings() {
        this._loadPreferences();
        this._initSettingsForms();
        this._handleHashRouting();
    },

    _loadPreferences() {
        // Dark mode
        if (localStorage.getItem('theme') === 'dark') {
            const toggle = document.getElementById('darkModeToggle');
            const status = document.getElementById('darkModeStatus');
            if (toggle) toggle.checked = true;
            if (status) status.innerHTML = 'Dark mode is currently <strong>enabled</strong>';
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Font size
        const savedSize = localStorage.getItem('fontSize');
        if (savedSize) {
            window.fontSizeLevel = parseInt(savedSize);
            const display = document.getElementById('fontSizeDisplay');
            if (display) display.textContent = ['Small', 'Medium', 'Large', 'Extra Large'][window.fontSizeLevel];
            document.body.style.fontSize = [14, 16, 18, 20][window.fontSizeLevel] + 'px';
        }

        // Study mode
        const studyMode = localStorage.getItem('studyMode');
        if (studyMode) {
            const el = document.getElementById('studyMode');
            if (el) el.value = studyMode;
        }

        // Daily goal
        const dailyGoal = localStorage.getItem('dailyGoal');
        if (dailyGoal) {
            const el = document.getElementById('dailyGoal');
            if (el) el.value = dailyGoal;
        }

        // Notifications
        const push = localStorage.getItem('pushNotifications');
        if (push !== null) {
            const el = document.getElementById('pushNotifications');
            if (el) el.checked = push === 'true';
        }
        const reminders = localStorage.getItem('studyReminders');
        if (reminders !== null) {
            const el = document.getElementById('studyReminders');
            if (el) el.checked = reminders === 'true';
        }
        const email = localStorage.getItem('emailUpdates');
        if (email !== null) {
            const el = document.getElementById('emailUpdates');
            if (el) el.checked = email === 'true';
        }
    },

    _initSettingsForms() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', function() {
                const tab = this.dataset.tab;
                document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach(p => {
                    p.classList.toggle('active', p.id === `tab-${tab}`);
                    p.style.display = p.id === `tab-${tab}` ? 'block' : 'none';
                });
                window.location.hash = tab;
            });
        });
    },

    _handleHashRouting() {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const tab = document.querySelector(`.sidebar-item[data-tab="${hash}"]`);
            if (tab) tab.click();
        }
    },

    // -------- LOGIN HELPERS --------
    _initLogin() {
        if (Auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }
        this._createParticles();
        this._initLoginForm();
        this._initPhoneInput();
    },

    _initPhoneInput() {
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 9);
            });
        }
    },

    _initLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const phone = document.getElementById('phoneNumber')?.value.trim();
            const password = document.getElementById('password')?.value;
            const pin = document.getElementById('pinCode')?.value.trim().toUpperCase();

            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid 9-digit phone number', 'error');
                return;
            }

            if (!password && !pin) {
                if (window.App) window.App.showToast('Please enter your password or PIN', 'error');
                return;
            }

            const btn = document.getElementById('loginBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Signing in...';
            }

            try {
                let result;
                if (pin) {
                    result = await API.loginWithPin(phone, pin);
                } else {
                    if (password.length < 8) {
                        if (window.App) window.App.showToast('Password must be at least 8 characters', 'error');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                        return;
                    }
                    result = await API.login(phone, password);
                }

                if (result.success) {
                    if (result.data?.user) Auth.setUserData(result.data.user);
                    if (window.App) window.App.showToast('Welcome back!', 'success');
                    setTimeout(() => Auth.redirectAfterLogin('dashboard.html'), 1000);
                } else {
                    if (window.App) window.App.showToast(result.message || 'Login failed', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                }
            } catch (error) {
                if (window.App) window.App.showToast(error.message || 'Login failed', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        });
    },

    // -------- REGISTER HELPERS --------
    _initRegister() {
        if (Auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }
        this._createParticles();
        this._initRegisterForm();
        this._initRegisterValidation();
    },

    _initRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const firstname = document.getElementById('firstName')?.value.trim();
            const lastname = document.getElementById('lastName')?.value.trim();
            const phone = document.getElementById('phoneNumber')?.value.trim();
            const password = document.getElementById('password')?.value;
            const confirm = document.getElementById('confirmPassword')?.value;
            const terms = document.getElementById('termsCheckbox')?.checked;

            if (!firstname || firstname.length < 2) {
                if (window.App) window.App.showToast('First name must be at least 2 characters', 'error');
                return;
            }
            if (!lastname || lastname.length < 2) {
                if (window.App) window.App.showToast('Last name must be at least 2 characters', 'error');
                return;
            }
            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid 9-digit phone number', 'error');
                return;
            }
            if (!password || password.length < 8) {
                if (window.App) window.App.showToast('Password must be at least 8 characters', 'error');
                return;
            }
            if (password !== confirm) {
                if (window.App) window.App.showToast('Passwords do not match', 'error');
                return;
            }
            if (!terms) {
                if (window.App) window.App.showToast('Please agree to the Terms of Service', 'error');
                return;
            }

            const btn = document.getElementById('registerBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Creating account...';
            }

            try {
                const result = await API.register({ firstname, lastname, phone, password });
                if (result.success) {
                    sessionStorage.setItem('verifyPhone', phone);
                    localStorage.setItem('registrationData', JSON.stringify({ firstname, lastname, phone }));
                    if (window.App) window.App.showToast('Registration successful! Redirecting to verification...', 'success');
                    setTimeout(() => window.location.href = `verify.html?phone=${phone}`, 1500);
                } else {
                    if (window.App) window.App.showToast(result.message || 'Registration failed', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                }
            } catch (error) {
                if (window.App) window.App.showToast(error.message || 'Registration failed', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            }
        });
    },

    _initRegisterValidation() {
        const phone = document.getElementById('phoneNumber');
        if (phone) {
            phone.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 9);
            });
        }

        const password = document.getElementById('password');
        if (password) {
            password.addEventListener('input', function() {
                const score = Utils.getPasswordStrength?.(this.value) || 0;
                const bars = document.querySelectorAll('#passwordStrength .bar');
                const label = document.getElementById('strengthLabel');
                bars.forEach((bar, i) => {
                    bar.className = 'bar';
                    if (i < score) {
                        bar.classList.add('active');
                        bar.style.background = score <= 2 ? '#ef4444' : score === 3 ? '#f59e0b' : '#10b981';
                    } else {
                        bar.style.background = 'var(--border-color)';
                    }
                });
                if (label) {
                    const levels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
                    label.textContent = this.value.length > 0 ? levels[score] : 'Enter a password';
                    label.style.color = this.value.length > 0 ? (score <= 2 ? '#ef4444' : score === 3 ? '#f59e0b' : '#10b981') : 'var(--text-muted)';
                }
            });
        }

        const confirm = document.getElementById('confirmPassword');
        if (confirm) {
            confirm.addEventListener('input', function() {
                const hint = document.getElementById('passwordMatchHint');
                const pass = document.getElementById('password')?.value || '';
                if (this.value.length > 0) {
                    if (pass === this.value) {
                        hint.textContent = '✓ Passwords match';
                        hint.style.color = '#10b981';
                    } else {
                        hint.textContent = '✗ Passwords do not match';
                        hint.style.color = '#ef4444';
                    }
                } else {
                    hint.textContent = 'Passwords must match';
                    hint.style.color = '';
                }
            });
        }
    },

    // -------- VERIFY HELPERS --------
    _initVerify() {
        this._createParticles();
        this._loadPhoneFromStorage();
        this._initVerifyForm();
        this._initResendOTP();
    },

    _loadPhoneFromStorage() {
        const params = new URLSearchParams(window.location.search);
        let phone = params.get('phone');
        if (!phone) {
            const data = localStorage.getItem('registrationData');
            if (data) {
                try { phone = JSON.parse(data).phone; } catch {}
            }
        }
        if (!phone) phone = sessionStorage.getItem('verifyPhone');

        const phoneInput = document.getElementById('phoneNumber');
        const phoneDisplay = document.getElementById('phoneDisplay');
        if (phoneInput) phoneInput.value = phone || '';
        if (phoneDisplay) phoneDisplay.textContent = phone ? `+237 ${phone}` : 'your phone';
        if (phone) sessionStorage.setItem('verifyPhone', phone);
    },

    _initVerifyForm() {
        const form = document.getElementById('verifyForm');
        if (!form) return;

        const otpInput = document.getElementById('otpCode');
        if (otpInput) {
            otpInput.addEventListener('input', function() {
                this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                if (this.value.length === 6) {
                    this.style.borderColor = '#10b981';
                    this.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.15)';
                    setTimeout(() => {
                        this.style.borderColor = '';
                        this.style.boxShadow = '';
                    }, 1500);
                }
            });
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const phone = document.getElementById('phoneNumber')?.value.trim() || sessionStorage.getItem('verifyPhone');
            const otp = document.getElementById('otpCode')?.value.trim();

            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid phone number', 'error');
                return;
            }
            if (!otp || otp.length !== 6) {
                if (window.App) window.App.showToast('Please enter a valid 6-character code', 'error');
                return;
            }

            const btn = document.getElementById('verifyBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Verifying...';
            }

            try {
                const result = await API.verifyOTP(phone, otp);
                if (result.success) {
                    if (result.token) localStorage.setItem('token', result.token);
                    if (result.user) localStorage.setItem('userData', JSON.stringify(result.user));
                    localStorage.removeItem('registrationData');
                    sessionStorage.removeItem('verifyPhone');
                    if (window.App) window.App.showToast('Account verified!', 'success');
                    setTimeout(() => {
                        window.open('https://wa.me/237654122717', '_blank');
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    if (window.App) window.App.showToast(result.message || 'Invalid verification code', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Account';
                }
            } catch (error) {
                if (window.App) window.App.showToast(error.message || 'Verification failed', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Account';
            }
        });
    },

    _initResendOTP() {
        const resendBtn = document.getElementById('resendBtn');
        if (!resendBtn) return;

        resendBtn.addEventListener('click', function() {
            const phone = sessionStorage.getItem('verifyPhone') || document.getElementById('phoneNumber')?.value.trim();
            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid phone number first', 'error');
                return;
            }
            if (window.App) window.App.showToast('New verification code sent!', 'success');
            // Reset OTP input
            const otpInput = document.getElementById('otpCode');
            if (otpInput) otpInput.value = '';
            otpInput?.focus();
        });
    },

    // -------- FORGOT PASSWORD HELPERS --------
    _initForgotPassword() {
        if (Auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }
        this._initForgotForm();
    },

    _initForgotForm() {
        const form = document.getElementById('forgotForm');
        if (!form) return;

        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 9);
            });
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const phone = document.getElementById('phone')?.value.trim();

            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid 9-digit phone number', 'error');
                return;
            }

            const btn = document.getElementById('resetBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Sending...';
            }

            try {
                const result = await API.forgotPassword(phone);
                if (result.success) {
                    localStorage.setItem('resetPhone', phone);
                    form.style.display = 'none';
                    const success = document.getElementById('successState');
                    if (success) success.style.display = 'block';
                    if (window.App) window.App.showToast('Reset link sent to your phone!', 'success');
                } else {
                    if (window.App) window.App.showToast(result.message || 'Failed to send reset link', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
                }
            } catch (error) {
                if (window.App) window.App.showToast(error.message || 'Failed to send reset link', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
            }
        });
    },

    // -------- RESET PASSWORD HELPERS --------
    _initResetPassword() {
        if (Auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }
        this._initResetForm();
        this._extractToken();
    },

    _initResetForm() {
        const form = document.getElementById('resetForm');
        if (!form) return;

        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 9);
            });
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const phone = document.getElementById('phone')?.value.trim();
            const newPass = document.getElementById('newPassword')?.value;
            const confirm = document.getElementById('confirmPassword')?.value;

            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid 9-digit phone number', 'error');
                return;
            }
            if (!newPass || newPass.length < 8) {
                if (window.App) window.App.showToast('Password must be at least 8 characters', 'error');
                return;
            }
            if (newPass !== confirm) {
                if (window.App) window.App.showToast('Passwords do not match', 'error');
                return;
            }

            const btn = document.getElementById('resetBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Resetting...';
            }

            try {
                const token = document.getElementById('token')?.value || '';
                const result = await API.resetPassword(phone, newPass, token);
                if (result.success) {
                    form.style.display = 'none';
                    const success = document.getElementById('successState');
                    if (success) success.style.display = 'block';
                    if (window.App) window.App.showToast('Password reset successfully!', 'success');
                    setTimeout(() => window.location.href = 'login.html', 3000);
                } else {
                    if (window.App) window.App.showToast(result.message || 'Failed to reset password', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
                }
            } catch (error) {
                if (window.App) window.App.showToast(error.message || 'Failed to reset password', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
            }
        });
    },

    _extractToken() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            const tokenInput = document.getElementById('token');
            if (tokenInput) tokenInput.value = token;
        }
    },

    // -------- CONTACT HELPERS --------
    _initContact() {
        this._initContactForm();
        this._initContactValidation();
    },

    _initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('contactName')?.value.trim();
            const phone = document.getElementById('contactPhone')?.value.trim();
            const subject = document.getElementById('contactSubject')?.value;
            const message = document.getElementById('contactMessage')?.value.trim();

            if (!name || name.length < 2) {
                if (window.App) window.App.showToast('Please enter your full name', 'error');
                return;
            }
            if (!phone || phone.length !== 9) {
                if (window.App) window.App.showToast('Please enter a valid 9-digit phone number', 'error');
                return;
            }
            if (!subject) {
                if (window.App) window.App.showToast('Please select a subject', 'error');
                return;
            }
            if (!message || message.length < 10) {
                if (window.App) window.App.showToast('Please enter a message (min 10 characters)', 'error');
                return;
            }

            const btn = document.getElementById('contactBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Sending...';
            }

            try {
                const result = await API.submitContact({ name, phone, subject, message });
                if (result.success) {
                    form.style.display = 'none';
                    const success = document.getElementById('successState');
                    if (success) success.style.display = 'block';
                    if (window.App) window.App.showToast('Message sent successfully!', 'success');
                } else {
                    if (window.App) window.App.showToast(result.message || 'Failed to send message', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }
            } catch (error) {
                if (window.App) window.App.showToast(error.message || 'Failed to send message', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            }
        });
    },

    _initContactValidation() {
        const phone = document.getElementById('contactPhone');
        if (phone) {
            phone.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 9);
            });
        }

        const message = document.getElementById('contactMessage');
        const charCount = document.getElementById('charCount');
        if (message && charCount) {
            message.addEventListener('input', function() {
                charCount.textContent = this.value.length;
            });
        }
    },

    // -------- COMMON HELPERS --------
    _createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 3 + 2) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (Math.random() * 20 + 15) + 's';
            particle.style.animationDelay = (Math.random() * 15) + 's';
            container.appendChild(particle);
        }
    },

    // -------- GLOBAL FUNCTIONS (Exposed) --------
    resetFilters() {
        const search = document.getElementById('searchInput');
        const exam = document.getElementById('examFilter');
        const category = document.getElementById('categoryFilter');
        const sort = document.getElementById('sortFilter');
        if (search) search.value = '';
        if (exam) exam.value = '';
        if (category) category.value = '';
        if (sort) sort.value = 'popular';
        this._applyFilters();
    },

    goToPage(page) {
        const total = Math.ceil(this.filteredCourses?.length / 12 || 0);
        if (page < 1 || page > total) return;
        this.currentPage = page;
        this._updateDisplay();
        document.getElementById('courseGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    viewPaper(paper) {
        if (!Auth.isAuthenticated()) {
            if (window.App) window.App.showToast('Please login to access past questions', 'info');
            return;
        }
        if (window.App) window.App.showToast(`📄 Viewing: ${paper}`, 'info');
    },

    viewYear(year) {
        if (!Auth.isAuthenticated()) {
            if (window.App) window.App.showToast('Please login to access past questions', 'info');
            return;
        }
        if (window.App) window.App.showToast(`📅 Viewing past questions from ${year}`, 'info');
    },

    viewRelatedCourse(id) {
        window.location.href = `course-detail.html?id=${id}`;
    },

    enrollCourse() {
        if (!Auth.isAuthenticated()) {
            if (confirm('Please login to enroll in this course.')) {
                window.location.href = 'login.html?redirect=course-detail.html';
            }
            return;
        }
        if (window.App) window.App.showToast('🎓 Enrolled successfully!', 'success');
    },

    setRating(rating) {
        window.selectedRating = rating;
        document.querySelectorAll('#starsInput .star, .stars-input .star').forEach(star => {
            const value = parseInt(star.dataset.value);
            star.classList.toggle('active', value <= rating);
            star.style.color = value <= rating ? '#f59e0b' : 'var(--gray-300)';
        });
    },

    submitReview() {
        if (!Auth.isAuthenticated()) {
            if (confirm('Please login to leave a review.')) {
                window.location.href = 'login.html';
            }
            return;
        }
        if (!window.selectedRating) {
            if (window.App) window.App.showToast('Please select a rating', 'warning');
            return;
        }
        const text = document.getElementById('reviewText')?.value.trim();
        if (!text) {
            if (window.App) window.App.showToast('Please write a review', 'warning');
            return;
        }
        if (window.App) window.App.showToast('Review submitted successfully!', 'success');
        window.selectedRating = 0;
        document.querySelectorAll('.star').forEach(s => s.style.color = 'var(--gray-300)');
        if (document.getElementById('reviewText')) document.getElementById('reviewText').value = '';
    },

    resendOTP() {
        const phone = sessionStorage.getItem('verifyPhone') || document.getElementById('phoneNumber')?.value.trim();
        if (!phone || phone.length !== 9) {
            if (window.App) window.App.showToast('Please enter a valid phone number first', 'error');
            return;
        }
        if (window.App) window.App.showToast('New verification code sent!', 'success');
    }
};

// ============================================
// AUTO-INIT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize App first if available
    if (window.App && !App.state?.initialized) {
        document.addEventListener('app:ready', function() {
            PageController.init();
        });
        // Fallback: initialize after a short delay
        setTimeout(function() {
            if (!PageController._initialized) {
                PageController.init();
                PageController._initialized = true;
            }
        }, 500);
    } else {
        setTimeout(function() {
            PageController.init();
            PageController._initialized = true;
        }, 100);
    }
});

// Expose globally
window.PageController = PageController;
window.App = window.App || {};

// Map App functions to PageController
window.App.resetFilters = () => PageController.resetFilters();
window.App.goToPage = (page) => PageController.goToPage(page);
window.App.viewPaper = (paper) => PageController.viewPaper(paper);
window.App.viewYear = (year) => PageController.viewYear(year);
window.App.viewRelatedCourse = (id) => PageController.viewRelatedCourse(id);
window.App.enrollCourse = () => PageController.enrollCourse();
window.App.setRating = (rating) => PageController.setRating(rating);
window.App.submitReview = () => PageController.submitReview();
window.App.resendOTP = () => PageController.resendOTP();

console.log('📄 PageController loaded');
