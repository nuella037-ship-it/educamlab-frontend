// js/reminders.js
class StudyReminder {
    constructor() {
        this.requestPermission();
    }
    
    requestPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    setReminder(subject, time) {
        // Schedule notification
        const schedule = new Date(time);
        const now = new Date();
        const delay = schedule - now;
        
        setTimeout(() => {
            new Notification('📚 Study Time!', {
                body: `Time to study ${subject}!`,
                icon: '/assets/logo.png'
            });
        }, delay);
    }
}