window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0].type;

    if (event.persisted || navType === "back_forward") {
        document.body.style.display = "none";
        window.location.replace('/login');
    }
});

const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitButton = document.getElementById('submitButton');

const lengthIcon = document.getElementById('lengthIcon');
const numberIcon = document.getElementById('numberIcon');
const letterIcon = document.getElementById('letterIcon');
const specialIcon = document.getElementById('specialIcon');

const lengthText = document.getElementById('lengthText');
const numberText = document.getElementById('numberText');
const letterText = document.getElementById('letterText');
const specialText = document.getElementById('specialText');

function checkPasswordRequirements(password) {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return { hasLength, hasNumber, hasLetter, hasSpecial };
}

function updateRequirementIndicators(requirements) {
    // Length
    if (lengthIcon) {
        lengthIcon.textContent = requirements.hasLength ? '✓' : '✘';
        lengthIcon.className = 'requirement-icon ' + (requirements.hasLength ? 'valid' : 'invalid');
    }
    if (lengthText) lengthText.className = requirements.hasLength ? 'valid' : 'invalid';

    // Number
    if (numberIcon) {
        numberIcon.textContent = requirements.hasNumber ? '✓' : '✘';
        numberIcon.className = 'requirement-icon ' + (requirements.hasNumber ? 'valid' : 'invalid');
    }
    if (numberText) numberText.className = requirements.hasNumber ? 'valid' : 'invalid';

    // Letter
    if (letterIcon) {
        letterIcon.textContent = requirements.hasLetter ? '✓' : '✘';
        letterIcon.className = 'requirement-icon ' + (requirements.hasLetter ? 'valid' : 'invalid');
    }
    if (letterText) letterText.className = requirements.hasLetter ? 'valid' : 'invalid';

    // Special (optional, so always ✓)
    if (specialIcon) {
        specialIcon.textContent = '✓';
        specialIcon.className = 'requirement-icon valid';
    }
    if (specialText) specialText.className = 'valid';
}

function validateForm() {
    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const requirements = checkPasswordRequirements(password);

    const isValid = requirements.hasLength &&
        requirements.hasNumber &&
        requirements.hasLetter &&
        (password === confirmPassword);

    if (submitButton) submitButton.disabled = !isValid;
}

if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function () {
        const password = this.value;
        const requirements = checkPasswordRequirements(password);
        updateRequirementIndicators(requirements);
        validateForm();
    });
}

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function () {
        const password = newPasswordInput.value;
        const confirmPassword = this.value;
        const errorElement = document.getElementById('passwordMatchError');

        if (errorElement) {
            errorElement.style.display = (password && confirmPassword && password !== confirmPassword) ? 'block' : 'none';
        }
        validateForm();
    });
}
