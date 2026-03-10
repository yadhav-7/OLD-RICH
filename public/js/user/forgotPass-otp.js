window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0].type;

    if (event.persisted || navType === "back_forward") {
        document.body.style.display = "none";
        window.location.replace('/login');
    }
});

let otpTimerInterval;
let verifyTimerInterval;
let timer = 60;
let verifyTimer = 60;
let canResend = false;
let canVerify = true;

function startOtpTimer() {
    const timerElement = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendBtn');
    if (!timerElement) return;

    otpTimerInterval = setInterval(function () {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timer <= 0) {
            clearInterval(otpTimerInterval);
            timerElement.textContent = 'Expired';
            timerElement.classList.add('timer-expired');
            canResend = true;
            if (resendBtn) resendBtn.disabled = false;
        }
        timer--;
    }, 1000);
}

function startVerifyTimer() {
    const verifyTimerElement = document.getElementById('verifyTimer');
    const verifyBtn = document.getElementById('verifyBtn');
    if (!verifyTimerElement) return;

    verifyTimerInterval = setInterval(function () {
        const minutes = Math.floor(verifyTimer / 60);
        const seconds = verifyTimer % 60;
        verifyTimerElement.textContent = `Verify available for ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (verifyTimer <= 0) {
            clearInterval(verifyTimerInterval);
            verifyTimerElement.textContent = 'Verification time expired';
            verifyTimerElement.classList.add('expired');
            canVerify = false;
            if (verifyBtn) verifyBtn.disabled = true;
        }
        verifyTimer--;
    }, 1000);
}

function initializeOtpTimer() {
    clearInterval(otpTimerInterval);
    clearInterval(verifyTimerInterval);

    timer = 60;
    verifyTimer = 60;
    canResend = false;
    canVerify = true;

    const timerElement = document.getElementById('otpTimer');
    const verifyTimerElement = document.getElementById('verifyTimer');
    const resendBtn = document.getElementById('resendBtn');
    const verifyBtn = document.getElementById('verifyBtn');

    if (timerElement) {
        timerElement.textContent = '1:00';
        timerElement.classList.remove('timer-expired');
    }
    if (resendBtn) resendBtn.disabled = true;

    if (verifyTimerElement) {
        verifyTimerElement.textContent = 'Verify available for 01:00';
        verifyTimerElement.classList.remove('expired');
    }
    if (verifyBtn) verifyBtn.disabled = false;

    startOtpTimer();
    startVerifyTimer();
}

// Initialize timer on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeOtpTimer();

    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', validateForm);
    }
});

async function validateForm(event) {
    if (event) event.preventDefault();

    // Check if verification time has expired
    if (!canVerify) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Verification Time Expired',
                text: 'Please request a new OTP to continue.'
            });
        }
        return false;
    }

    const verifyBtn = document.getElementById('verifyBtn');
    if (!verifyBtn) return;
    const originalText = verifyBtn.innerHTML;

    // Show loading state
    verifyBtn.disabled = true;
    verifyBtn.classList.add('btn-loading');

    try {
        const otpInputElem = document.getElementById('otp');
        if (!otpInputElem) return;
        const otpInput = otpInputElem.value;
        const response = await fetch('/varify-passForgot-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                otp: otpInput
            }),
        });

        const result = await response.json();
        if (response.ok) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Verified Successfully',
                    text: 'Redirecting to password reset...',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            setTimeout(() => {
                window.location.href = result.redirect || '/reset-password';
            }, 1500);
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid OTP',
                    text: result.message || 'Please check the code and try again.'
                });
            }
        }
        return false;
    } catch (error) {
        console.error('Error during OTP validation:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Something went wrong!',
                text: 'Please check your connection or try again later.'
            });
        }
    } finally {
        // Reset button state only if verification is still allowed
        verifyBtn.disabled = !canVerify;
        verifyBtn.classList.remove('btn-loading');
    }
}

async function reSendOtp() {
    if (!canResend) return;

    const resendBtn = document.getElementById('resendBtn');
    if (!resendBtn) return;
    const originalText = resendBtn.innerHTML;

    // Show loading state
    resendBtn.disabled = true;
    resendBtn.classList.add('btn-loading');

    try {
        const response = await fetch('/reSentOtp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Resent',
                    text: result.message || 'Check your email again!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }

            initializeOtpTimer();
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to resend OTP',
                    text: result.message || 'Try again later!'
                });
            }
        }
    } catch (error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Something went wrong!',
                text: 'Please check your connection and try again.'
            });
        }
    } finally {
        // Reset button state
        resendBtn.disabled = !canResend;
        resendBtn.classList.remove('btn-loading');
    }
}
