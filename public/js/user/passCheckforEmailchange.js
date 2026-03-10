window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0].type;

    if (event.persisted || navType === "back_forward") {
        document.body.style.display = "none";
        window.location.replace('/userProfile');
    }
});

function verifyPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');

    if (!passwordInput || !errorMessage) return false;

    const password = passwordInput.value.trim();

    if (password === '') {
        errorMessage.style.display = 'block';
        return false;
    }

    errorMessage.style.display = 'none';
    return true;
}
