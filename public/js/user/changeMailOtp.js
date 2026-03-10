
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        // Hide content instantly
        document.body.style.display = "none";
        // Force reload from server
        window.location.href = '/';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input');
            const email = emailInput ? emailInput.value : '';
            alert('Email submitted: ' + email);
            // Here you would typically send the data to your server
        });
    }
});
