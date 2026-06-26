// js/contact.js - Contact Page (Phone-Based)
// ============================================
// EDU CAM LAB - CONTACT PAGE
// Complete contact form functionality
// ============================================

// ============================================
// FORM VALIDATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('name');
    const subjectSelect = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('charCount');

    if (nameInput) {
        nameInput.addEventListener('input', function() {
            const hint = document.getElementById('nameHint');
            if (!hint) return;
            if (this.value.length >= 2) {
                this.classList.add('success');
                this.classList.remove('error');
                hint.textContent = '✓ Valid name';
                hint.className = 'form-hint success';
            } else if (this.value.length > 0) {
                this.classList.add('error');
                this.classList.remove('success');
                hint.textContent = '⚠️ Name must be at least 2 characters';
                hint.className = 'form-hint error';
            } else {
                this.classList.remove('error', 'success');
                hint.textContent = 'Enter your full name';
                hint.className = 'form-hint';
            }
        });
    }

    if (subjectSelect) {
        subjectSelect.addEventListener('change', function() {
            const hint = document.getElementById('subjectHint');
            if (!hint) return;
            if (this.value) {
                this.classList.add('success');
                this.classList.remove('error');
                hint.textContent = '✓ Subject selected';
                hint.className = 'form-hint success';
            } else {
                this.classList.remove('success');
                this.classList.add('error');
                hint.textContent = '⚠️ Please select a subject';
                hint.className = 'form-hint error';
            }
        });
    }

    if (messageInput && charCount) {
        messageInput.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            const hint = document.getElementById('messageHint');
            if (!hint) return;

            if (length >= 2000) {
                this.classList.add('error');
                this.classList.remove('success');
                hint.innerHTML = '<span style="color: #ef4444;">⚠️ Maximum 2000 characters reached</span>';
                hint.className = 'form-hint error';
            } else if (length >= 10) {
                this.classList.remove('error');
                this.classList.add('success');
                hint.innerHTML = `<span style="color: #10b981;">✓ ${length} / 2000 characters</span>`;
                hint.className = 'form-hint success';
            } else if (length > 0) {
                this.classList.add('error');
                this.classList.remove('success');
                hint.innerHTML = `<span style="color: #ef4444;">⚠️ Minimum 10 characters (${length}/10)</span>`;
                hint.className = 'form-hint error';
            } else {
                this.classList.remove('error', 'success');
                hint.innerHTML = '<span id="charCount">0</span> / 2000 characters';
                hint.className = 'form-hint';
            }
        });
    }
});

// ============================================
// FORM SUBMISSION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const subjectSelect = document.getElementById('subject');
        const messageInput = document.getElementById('message');
        
        const container = document.getElementById('messageContainer');
        const btn = document.getElementById('submitBtn');
        const form = this;
        const successState = document.getElementById('successState');

        if (!nameInput || !subjectSelect || !messageInput) return;

        const name = nameInput.value.trim();
        const subject = subjectSelect.value;
        const message = messageInput.value.trim();

        if (container) container.innerHTML = '';

        if (!name || name.length < 2) {
            showMessage(container, 'error', 'Please enter your full name (minimum 2 characters)');
            nameInput.focus();
            return;
        }

        if (!subject) {
            showMessage(container, 'error', 'Please select a subject');
            subjectSelect.focus();
            return;
        }

        if (!message || message.length < 10) {
            showMessage(container, 'error', 'Please enter a message (minimum 10 characters)');
            messageInput.focus();
            return;
        }

        if (message.length > 2000) {
            showMessage(container, 'error', 'Message cannot exceed 2000 characters');
            messageInput.focus();
            return;
        }

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Sending...';

        try {
            const result = await API.sendContact({
                name,
                subject,
                message
            });

            if (result.success) {
                form.style.display = 'none';
                if (successState) successState.style.display = 'block';
                if (successState) successState.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                showMessage(container, 'error', result.message || 'Failed to send message. Please try again.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Contact form error:', error);
            showMessage(container, 'error', error.message || 'Failed to send message. Please try again.');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
});

// ============================================
// MESSAGE DISPLAY
// ============================================
function showMessage(container, type, message) {
    if (!container) return;

    const icons = {
        error: 'fa-exclamation-circle',
        success: 'fa-check-circle',
        info: 'fa-info-circle'
    };

    container.innerHTML = `
        <div class="message message-${type}" role="alert">
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// RESET FORM
// ============================================
function resetForm() {
    const form = document.getElementById('contactForm');
    const successState = document.getElementById('successState');

    if (form) form.style.display = 'block';
    if (successState) successState.style.display = 'none';

    document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(el => {
        el.classList.remove('success', 'error');
    });

    document.querySelectorAll('.form-hint').forEach(el => {
        el.className = 'form-hint';
    });

    const charCount = document.getElementById('charCount');
    if (charCount) charCount.textContent = '0';
    
    const container = document.getElementById('messageContainer');
    if (container) container.innerHTML = '';

    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.focus();

    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.resetForm = resetForm;