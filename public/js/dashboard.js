// js/dashboard.js - Dashboard Logic
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if authenticated
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    loadUserData();
    loadPinStatus();
    loadStats();
    loadCourses();
});

// Load user data
async function loadUserData() {
    try {
        const profile = await API.getProfile();
        if (profile.success) {
            const user = profile.data;
            Auth.setUserData(user);
            document.getElementById('userName').textContent = Auth.getUserName();
            document.getElementById('userAvatar').textContent = Auth.getInitials();
            
            const hour = new Date().getHours();
            let greeting = 'Good morning';
            if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
            else if (hour >= 17) greeting = 'Good evening';
            document.getElementById('greeting').textContent = `👋 ${greeting},`;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load PIN status
async function loadPinStatus() {
    try {
        const result = await API.getMyPins();
        if (result.success) {
            const pins = result.data || [];
            const activePin = pins.find(p => p.is_active);
            
            const pinDisplay = document.getElementById('userPin');
            const pinStatus = document.getElementById('pinStatus');
            
            if (activePin) {
                pinDisplay.textContent = activePin.code;
                pinStatus.textContent = '✅ Active';
                pinStatus.style.color = '#10b981';
            } else {
                pinDisplay.textContent = 'No PIN assigned';
                pinStatus.textContent = '⏳ Inactive';
                pinStatus.style.color = '#f59e0b';
            }
        }
    } catch (error) {
        console.error('Error loading PIN:', error);
    }
}

// Load stats
async function loadStats() {
    try {
        const result = await API.getUserStats();
        if (result.success) {
            const data = result.data;
            document.getElementById('enrolledCount').textContent = data.stats?.totalEnrolled || 0;
            document.getElementById('completedCount').textContent = data.stats?.completed || 0;
            document.getElementById('progressPercent').textContent = (data.stats?.avgProgress || 0) + '%';
            document.getElementById('streakCount').textContent = data.stats?.streak || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load courses
async function loadCourses() {
    try {
        const result = await API.getEnrolledCourses();
        if (result.success) {
            const courses = result.data || [];
            const container = document.getElementById('recentCourses');
            
            if (courses.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align:center; padding:40px;">No courses enrolled yet. <a href="courses.html">Browse courses</a></p>`;
                return;
            }
            
            container.innerHTML = courses.slice(0, 3).map(course => `
                <div class="course-card" onclick="window.location.href='course-detail.html?id=${course.id}'">
                    <div class="course-icon">${course.icon || '📚'}</div>
                    <h4>${course.title}</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${course.progress || 0}%;"></div>
                    </div>
                    <span class="progress-text">${course.progress || 0}%</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}