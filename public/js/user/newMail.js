window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0].type;

    if (event.persisted || navType === "back_forward") {
        document.body.style.display = "none";
        window.location.replace('/userProfile');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('emailForm');
    const emailInput = document.getElementById('email');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.getElementById('submitBtn');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();

            if (email === "") {
                if (errorMsg) errorMsg.style.display = 'none';
                emailInput.classList.remove('invalid');
                return;
            }

            if (!emailRegex.test(email)) {
                if (errorMsg) errorMsg.style.display = 'block';
                emailInput.classList.add('invalid');
            } else {
                if (errorMsg) errorMsg.style.display = 'none';
                emailInput.classList.remove('invalid');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            const email = emailInput ? emailInput.value.trim() : '';

            if (!emailRegex.test(email)) {
                e.preventDefault();
                if (errorMsg) errorMsg.style.display = 'block';
                if (emailInput) {
                    emailInput.classList.add('invalid');
                    emailInput.focus();
                }
            } else {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }
            }
        });
    }

    // Remove resubmit warning
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
});
