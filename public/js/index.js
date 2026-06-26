// js/index.js - Homepage (Production Ready)
// ============================================
// EDU CAM LAB - HOMEPAGE
// Complete homepage functionality
// ============================================

// ============================================
// SMOOTH SCROLL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'
                });
                history.pushState(null, null, this.getAttribute('href'));
            }
        });
    });

    // ============================================
    // NAVBAR ACTIVE STATE
    // ============================================
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // ============================================
    // SCROLL ANIMATION (Intersection Observer)
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.exam-card, .feature-card, .testimonial-card, .stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // ============================================
    // COUNTER ANIMATION
    // ============================================
    function animateCounter(element, target, suffix = '') {
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
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                animateCounter(el, target, suffix);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(el => {
        counterObserver.observe(el);
    });
});

// ============================================
// CONSOLE BRANDING
// ============================================
console.log('%c📚 EduCamLab', 'font-size: 32px; font-weight: 800; color: #4f46e5;');
console.log('%cCameroon\'s #1 Exam Preparation Platform', 'font-size: 16px; color: #6b7280;');
console.log('%c🚀 Join 10,000+ students excelling in their exams!', 'font-size: 14px; color: #10b981;');
