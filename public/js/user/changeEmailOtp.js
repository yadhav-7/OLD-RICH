window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0].type;

    if (event.persisted || navType === "back_forward") {
        document.body.style.display = "none";
        window.location.replace('/');
    }
});

// --- TIMER LOGIC ---
let countdown = 60;
let verifyCountdown = 60;
let timerInterval = null;
let verifyTimerInterval = null;
const timerDisplay = document.getElementById("timer");
const verifyTimerDisplay = document.getElementById("verifyTimer");
const resendBtn = document.getElementById("resendBtn");
const verifyBtn = document.getElementById("verifyBtn");
const otpInput = document.getElementById("otpInput");
const errorBox = document.getElementById("errorBox");

function startTimer() {
    clearInterval(timerInterval);
    countdown = 60;
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.classList.add('disabled-btn');
    }
    if (timerDisplay) timerDisplay.textContent = `Resend available in 01:00`;
    timerInterval = setInterval(() => {
        countdown--;
        const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
        const seconds = String(countdown % 60).padStart(2, '0');
        if (timerDisplay) timerDisplay.textContent = `Resend available in ${minutes}:${seconds}`;
        if (countdown <= 0) {
            if (errorBox) errorBox.style.display = 'none';
            clearInterval(timerInterval);
            if (timerDisplay) timerDisplay.textContent = '';
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.classList.remove('disabled-btn');
            }
        }
    }, 1000);
}

function startVerifyTimer() {
    clearInterval(verifyTimerInterval);
    verifyCountdown = 60;
    if (verifyBtn) verifyBtn.disabled = false;
    if (verifyTimerDisplay) {
        verifyTimerDisplay.textContent = `Verify available for 01:00`;
        verifyTimerDisplay.classList.remove('expired');
    }
    verifyTimerInterval = setInterval(() => {
        verifyCountdown--;
        const minutes = String(Math.floor(verifyCountdown / 60)).padStart(2, '0');
        const seconds = String(verifyCountdown % 60).padStart(2, '0');
        if (verifyTimerDisplay) verifyTimerDisplay.textContent = `Verify available for ${minutes}:${seconds}`;

        if (verifyCountdown <= 0) {
            clearInterval(verifyTimerInterval);
            if (verifyBtn) verifyBtn.disabled = true;
            if (verifyTimerDisplay) {
                verifyTimerDisplay.textContent = 'Verification time expired';
                verifyTimerDisplay.classList.add('expired');
            }
        }
    }, 1000);
}

startTimer();
startVerifyTimer();

if (otpInput) {
    otpInput.addEventListener('input', function (e) {
        this.value = this.value.replace(/\D/g, '');
        if (errorBox) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        }
        if (verifyBtn) verifyBtn.disabled = (this.value.length !== 6 || verifyCountdown <= 0);
    });
}

window.onload = () => { if (otpInput) otpInput.focus(); };

// --- RESEND OTP ---
async function resendOtp() {
    const resendBtn = document.getElementById("resendBtn");
    if (!resendBtn) return;
    // Show loading state
    resendBtn.disabled = true;
    resendBtn.classList.add('btn-loading');

    try {
        const response = await fetch('/resendOTPwhileEmailchange');
        const result = await response.json();
        if (response.ok) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'OTP Sent',
                    text: result.message || 'A new OTP has been sent to your email!',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            startTimer();
            startVerifyTimer();

            const otpInput = document.getElementById("otpInput");
            const verifyBtn = document.getElementById("verifyBtn");
            if (otpInput) otpInput.value = '';
            if (verifyBtn) verifyBtn.disabled = true;
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops!',
                    text: result.message || 'Failed to resend OTP. Please try again.',
                    confirmButtonColor: '#f44336'
                });
            }
            resendBtn.disabled = false;
        }
    } catch (error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong. Please check your connection.',
                confirmButtonColor: '#f44336'
            });
        }
        resendBtn.disabled = false;
    } finally {
        // Remove loading state
        resendBtn.classList.remove('btn-loading');
    }
}

// --- VERIFY OTP ---
async function verifyOTP() {
    const otpInput = document.getElementById("otpInput");
    const errorBox = document.getElementById("errorBox");
    const verifyBtn = document.getElementById("verifyBtn");
    if (!otpInput) return;
    const otp = otpInput.value.trim();
    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }

    // Check if verification time has expired
    if (verifyCountdown <= 0) {
        if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Verification time has expired. Please request a new OTP.';
        }
        return;
    }

    if (otp.length !== 6 || isNaN(otp)) {
        if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Please enter a valid 6-digit OTP.';
        }
        otpInput.focus();
        return;
    }

    // Show loading state
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.classList.add('btn-loading');
    }

    try {
        const response = await fetch('/verifychangeEmailOtp?_method=PATCH', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp })
        });
        const result = await response.json();
        if (response.ok) {
            window.location.href = result.url;
        } else {
            if (errorBox) {
                errorBox.style.display = 'block';
                errorBox.textContent = result.message || 'Invalid OTP. Please try again.';
            }
            if (verifyBtn) verifyBtn.disabled = false;
        }
    } catch (error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Failed to verify OTP. Please try again.',
                confirmButtonColor: '#f44336'
            });
        }
        if (verifyBtn) verifyBtn.disabled = false;
    } finally {
        // Remove loading state
        if (verifyBtn) verifyBtn.classList.remove('btn-loading');
    }
}

// Allow pressing Enter to submit
if (otpInput) {
    otpInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' && this.value.length === 6 && verifyBtn && !verifyBtn.disabled) {
            verifyOTP();
        }
    });
}
