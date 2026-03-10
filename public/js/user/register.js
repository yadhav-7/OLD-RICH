document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    const nameError = document.getElementById('register-error1');
    const emailError = document.getElementById('register-error2');
    const phoneError = document.getElementById('register-error3');
    const passwordError = document.getElementById('register-error4');
    const confirmPasswordError = document.getElementById('register-error5');

    // Password strength elements
    const strengthMeterFill = document.getElementById('strength-meter-fill');
    const lengthRequirement = document.getElementById('length-requirement');
    const numberRequirement = document.getElementById('number-requirement');
    const letterRequirement = document.getElementById('letter-requirement');
    const specialRequirement = document.getElementById('special-requirement');

    // Password toggle elements
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

    // Real-time validation for each field
    nameInput.addEventListener('input', validateName);
    emailInput.addEventListener('input', validateEmail);
    phoneInput.addEventListener('input', validatePhone);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);

    // Password strength indicator
    passwordInput.addEventListener('input', updatePasswordStrength);

    const registerBtn = document.getElementById('registerBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // When form is submitted
    form.addEventListener('submit', function (e) {
        // Prevent default first
        e.preventDefault();

        // Validate all fields before submission
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isConfirmPasswordValid) {
            // Scroll to the first error
            const firstErrorElement = [
                nameError.textContent && nameInput,
                emailError.textContent && emailInput,
                phoneError.textContent && phoneInput,
                passwordError.textContent && passwordInput,
                confirmPasswordError.textContent && confirmPasswordInput
            ].find(el => el);

            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorElement.focus();
            }
        } else {
            // Show loader and disable button
            btnLoader.style.display = 'inline-block';
            btnText.textContent = 'Please wait...';
            registerBtn.disabled = true;

            // Submit the form since validation passed
            this.submit();
        }
    });

    function validateName() {
        const value = nameInput.value.trim();
        const namePattern = /^[A-Za-z\s'-]+$/;

        if (!value) {
            nameError.textContent = 'Full name is required';
            nameInput.classList.add('error');
            return false;
        } else if (value.length < 3) {
            nameError.textContent = 'Name must be at least 3 characters';
            nameInput.classList.add('error');
            return false;
        } else if (!namePattern.test(value)) {
            nameError.textContent = 'Name can only contain letters, spaces, hyphens, and apostrophes';
            nameInput.classList.add('error');
            return false;
        } else {
            nameError.textContent = '';
            nameInput.classList.remove('error');
            return true;
        }
    }

    function validateEmail() {
        const value = emailInput.value.trim();
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!value) {
            emailError.textContent = 'Email is required';
            emailInput.classList.add('error');
            return false;
        } else if (!emailPattern.test(value)) {
            emailError.textContent = 'Please enter a valid email address';
            emailInput.classList.add('error');
            return false;
        } else {
            emailError.textContent = '';
            emailInput.classList.remove('error');
            return true;
        }
    }

    function validatePhone() {
        const value = phoneInput.value.trim();

        // Pattern: 10 digits, not all zeros
        const phonePattern = /^(?!0{10})\d{10}$/;

        // Pattern: Reject if all digits are same (e.g. 1111111111)
        const repeatedDigitPattern = /^(\d)\1{9}$/;

        if (!value) {
            phoneError.textContent = 'Phone number is required';
            phoneInput.classList.add('error');
            return false;
        } else if (!phonePattern.test(value)) {
            phoneError.textContent = 'Phone number must be exactly 10 digits and not all zeros';
            phoneInput.classList.add('error');
            return false;
        } else if (repeatedDigitPattern.test(value)) {
            phoneError.textContent = 'Phone number cannot have all digits the same';
            phoneInput.classList.add('error');
            return false;
        } else {
            phoneError.textContent = '';
            phoneInput.classList.remove('error');
            return true;
        }
    }

    function validatePassword() {
        const value = passwordInput.value;
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (!value) {
            passwordError.textContent = 'Password is required';
            passwordInput.classList.add('error');
            return false;
        } else if (value.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
            passwordInput.classList.add('error');
            return false;
        } else if (!hasLetter || !hasNumber) {
            passwordError.textContent = 'Password must contain both letters and numbers';
            passwordInput.classList.add('error');
            return false;
        } else {
            passwordError.textContent = '';
            passwordInput.classList.remove('error');
            return true;
        }
    }

    function validateConfirmPassword() {
        const passwordValue = passwordInput.value;
        const confirmValue = confirmPasswordInput.value;

        if (!confirmValue) {
            confirmPasswordError.textContent = 'Please confirm your password';
            confirmPasswordInput.classList.add('error');
            return false;
        } else if (confirmValue !== passwordValue) {
            confirmPasswordError.textContent = 'Passwords do not match';
            confirmPasswordInput.classList.add('error');
            return false;
        } else {
            confirmPasswordError.textContent = '';
            confirmPasswordInput.classList.remove('error');
            return true;
        }
    }

    function updatePasswordStrength() {
        const value = passwordInput.value;
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        const length = value.length;

        // Update requirement indicators
        lengthRequirement.style.color = length >= 8 ? 'green' : 'inherit';
        lengthRequirement.innerHTML = length >= 8 ? '✓ At least 8 characters' : 'At least 8 characters';

        numberRequirement.style.color = hasNumber ? 'green' : 'inherit';
        numberRequirement.innerHTML = hasNumber ? '✓ Contains a number' : 'Contains a number';

        letterRequirement.style.color = hasLetter ? 'green' : 'inherit';
        letterRequirement.innerHTML = hasLetter ? '✓ Contains a letter' : 'Contains a letter';

        specialRequirement.style.color = hasSpecial ? 'green' : 'gray';
        specialRequirement.innerHTML = hasSpecial ? '✓ Contains a special character' : 'Contains a special character (optional)';

        // Calculate strength score (0-100)
        let strength = 0;
        if (length >= 8) strength += 25;
        if (hasLetter) strength += 25;
        if (hasNumber) strength += 25;
        if (hasSpecial) strength += 25;

        // Update strength meter
        strengthMeterFill.style.width = `${strength}%`;

        // Change color based on strength
        if (strength < 50) {
            strengthMeterFill.style.backgroundColor = '#ef4444'; // red
        } else if (strength < 75) {
            strengthMeterFill.style.backgroundColor = '#f59e0b'; // amber
        } else {
            strengthMeterFill.style.backgroundColor = '#10b981'; // green
        }
    }
});
