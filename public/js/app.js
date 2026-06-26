// js/app.js - Main Application Logic
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuBtn = document.getElementById('menuToggle');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            document.querySelector('.nav-links').classList.toggle('open');
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-links').classList.remove('open');
        });
    });

    // Update user info in header if authenticated
    if (Auth.isAuthenticated()) {
        updateHeaderUser();
    }
});

function updateHeaderUser() {
    const name = Auth.getUserName();
    const avatar = Auth.getInitials();
    
    // Update avatar in header
    const avatarEl = document.querySelector('.user-avatar-small');
    if (avatarEl) {
        avatarEl.textContent = avatar;
    }
}