document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submitButton');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const togglePassword = document.getElementById('togglePassword');
    const passwordHelp = document.getElementById('passwordHelp');

    // Real-time validation
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);

    // Password visibility toggle
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate all fields
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (isEmailValid && isPasswordValid) {
            // Disable button and show spinner
            submitButton.disabled = true;
            buttonText.textContent = 'Authenticating...';
            buttonSpinner.classList.remove('d-none');

            // Submit form
            this.submit();
        } else {
            // Focus on first invalid field
            if (!isEmailValid) {
                emailInput.focus();
            } else if (!isPasswordValid) {
                passwordInput.focus();
            }
        }
    });

    // Email validation
    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

        if (!email) {
            showError(emailInput, emailError, 'Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            showError(emailInput, emailError, 'Please enter a valid email address');
            return false;
        } else if (email.length > 100) {
            showError(emailInput, emailError, 'Email must be less than 100 characters');
            return false;
        } else {
            clearError(emailInput, emailError);
            return true;
        }
    }

    // Password validation
    function validatePassword() {
        const password = passwordInput.value.trim();

        if (!password) {
            showError(passwordInput, passwordError, 'Password is required');
            return false;
        } else {
            clearError(passwordInput, passwordError);
            return true;
        }
    }

    // Helper functions
    function showError(input, errorElement, message) {
        input.classList.add('is-invalid');
        errorElement.textContent = message;
        input.setAttribute('aria-invalid', 'true');
    }

    function clearError(input, errorElement) {
        input.classList.remove('is-invalid');
        errorElement.textContent = '';
        input.setAttribute('aria-invalid', 'false');
    }
});
