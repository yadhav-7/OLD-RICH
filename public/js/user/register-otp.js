
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.otp-input');
    const form = document.getElementById('otpForm');
    const countdownEl = document.getElementById('countdown');
    const resendBtn = document.getElementById('resendBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const verifyText = document.getElementById('verifyText');
    const verifyLoader = document.getElementById('verifyLoader');

    let timer = 60;
    let timerInterval;

    // Timer logic
    function startTimer() {
        timer = 60;
        clearInterval(timerInterval);
        resendBtn.style.display = 'none';
        countdownEl.style.display = 'block';
        verifyBtn.disabled = false;
        verifyBtn.classList.remove('disabled'); // Optional styling class if present

        timerInterval = setInterval(() => {
            const minutes = Math.floor(timer / 60);
            const seconds = timer % 60;
            countdownEl.textContent = `(${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds})`;

            if (timer <= 0) {
                clearInterval(timerInterval);
                countdownEl.style.display = 'none';
                resendBtn.style.display = 'block';
                verifyBtn.disabled = true;
                verifyBtn.classList.add('disabled'); // Optional styling class if present
            }
            timer--;
        }, 1000);
    }

    startTimer();

    // OTP Inputs handling
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1);
            }
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let otp = '';
        inputs.forEach(input => otp += input.value);

        if (otp.length !== 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid OTP',
                text: 'Please enter all 6 digits.'
            });
            return;
        }

        // Show loader
        verifyText.style.display = 'none';
        verifyLoader.style.display = 'block';
        verifyBtn.disabled = true;

        try {
            const response = await fetch('/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Verified!',
                    text: result.message || 'Registration successful.',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    window.location.href = result.redirectUrl || result.redirect || '/refferalCodeEnter';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: result.message || 'Invalid OTP. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong. Please try again later.'
            });
        } finally {
            verifyText.style.display = 'block';
            verifyLoader.style.display = 'none';
            verifyBtn.disabled = false;
        }
    });

    // Resend OTP
    resendBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/reSendOtp');
            const result = await response.json();

            if (response.ok && result.success) {
                Toastify({
                    text: "OTP Resent Successfully",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
                }).showToast();
                startTimer();
                // Clear inputs
                inputs.forEach(input => input.value = '');
                inputs[0].focus();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to resend OTP.'
                });
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong. Please try again.'
            });
        }
    });
});
