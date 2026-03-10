document.addEventListener('DOMContentLoaded', function () {

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const togglePassword = document.getElementById('togglePassword');


    // Toggle password visibility
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle eye icon
        const icon = this.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Validate on form submission
    form.addEventListener('submit', function (event) {
        let isValid = true;

        // Clear previous errors
        emailError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('error');
        passwordInput.classList.remove('error');

        // Email validation
        const email = emailInput.value.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!email) {
            emailError.textContent = 'Email is required';
            emailInput.classList.add('error');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            emailError.textContent = 'Please enter a valid email address';
            emailInput.classList.add('error');
            isValid = false;
        }

        // Password validation
        const password = passwordInput.value.trim();

        if (!password) {
            passwordError.textContent = 'Password is required';
            passwordInput.classList.add('error');
            isValid = false;
        } else if (password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordInput.classList.add('error');
            isValid = false;
        }


        emailInput.addEventListener('input', function () {
            const email = emailInput.value.trim();
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (emailRegex.test(email)) {
                emailError.textContent = '';
                emailInput.classList.remove('error');
            }
        });

        passwordInput.addEventListener('input', function () {
            const password = passwordInput.value.trim()
            if (password.length >= 6) {
                passwordError.textContent = '';
                passwordInput.classList.remove('error');
            }
        })



        if (!isValid) {
            event.preventDefault();

            // Focus on first error field
            if (emailInput.classList.contains('error')) {
                emailInput.focus();
            } else if (passwordInput.classList.contains('error')) {
                passwordInput.focus();
            }
        }
    });

    // Real-time validation on blur
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        emailError.textContent = '';
        emailInput.classList.remove('error');

        if (!email) {
            emailError.textContent = 'Email is required';
            emailInput.classList.add('error');
            return false;
        } else if (!emailRegex.test(email)) {
            emailError.textContent = 'Please enter a valid email address';
            emailInput.classList.add('error');
            return false;
        }

        return true;
    }

    function validatePassword() {
        const password = passwordInput.value.trim();

        passwordError.textContent = '';
        passwordInput.classList.remove('error');

        if (!password) {
            passwordError.textContent = 'Password is required';
            passwordInput.classList.add('error');
            return false;
        } else if (password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordInput.classList.add('error');
            return false;
        }

        return true;
    }
});
