window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0].type;

    if (event.persisted || navType === "back_forward") {
        document.body.style.display = "none";
        window.location.replace('/login');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('emailForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');

    if (form) {
        form.addEventListener('submit', function (e) {
            const verifyBtn = document.getElementById("verifyBtn");
            const emailValue = emailInput ? emailInput.value.trim() : '';
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;

            if (!emailPattern.test(emailValue)) {
                if (emailError) emailError.style.display = 'block';
                e.preventDefault();
            } else {
                if (emailError) emailError.style.display = 'none';
                if (verifyBtn) {
                    verifyBtn.classList.add("loading");
                    const loader = verifyBtn.querySelector(".loader");
                    const btnText = verifyBtn.querySelector(".btn-text");
                    if (loader) loader.style.display = "inline-block";
                    if (btnText) btnText.textContent = "Sending...";
                }
            }
        });
    }
});
