document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            document.body.style.display = "none";
            window.location.reload();
        }
    });

    const applyButton = document.getElementById('applyButton');
    const skipButton = document.getElementById('skipButton');
    const ContinueToDashboard = document.getElementById('ContinueToDashboard');
    const referralCodeInput = document.getElementById('referralCode');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const codeError = document.getElementById('codeError');
    const errorText = document.getElementById('errorText');
    const errorDetail = document.getElementById('errorDetail');

    function validateReferralCode(code) {
        const regex = /^\d{6}$/;
        return regex.test(code);
    }

    if (applyButton) {
        applyButton.addEventListener('click', function () {
            const code = referralCodeInput ? referralCodeInput.value.trim() : '';
            if (referralCodeInput) referralCodeInput.classList.remove('error', 'shake');
            if (codeError) codeError.style.display = 'none';
            if (code === '') {
                if (errorText) errorText.textContent = 'Please enter a referral code';
                if (codeError) codeError.style.display = 'flex';
                if (referralCodeInput) {
                    referralCodeInput.classList.add('error', 'shake');
                    referralCodeInput.focus();
                }
                return;
            }
            if (!validateReferralCode(code)) {
                if (errorText) errorText.textContent = 'Please enter a valid referral 6 digit code ';
                if (codeError) codeError.style.display = 'flex';
                if (referralCodeInput) {
                    referralCodeInput.classList.add('error', 'shake');
                    referralCodeInput.focus();
                }
                return;
            }
            applyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
            applyButton.disabled = true;
            fetch(`/applyRefferalCode?code=${encodeURIComponent(code)}`)
                .then(async (res) => {
                    const data = await res.json();
                    applyButton.innerHTML = 'Apply Referral Code';
                    applyButton.disabled = false;
                    return { ok: res.ok, ...data };
                })
                .then((res) => {
                    setTimeout(() => {
                        if (res.ok) {
                            applyButton.style.display = 'none';
                            if (successMessage) successMessage.style.display = 'flex';
                            if (errorMessage) errorMessage.style.display = 'none';
                            if (skipButton) skipButton.style.display = 'none';
                            if (ContinueToDashboard) ContinueToDashboard.style.display = 'block';
                            if (res.message && successMessage) {
                                const h3 = successMessage.querySelector('h3');
                                if (h3) h3.textContent = res.message;
                            }
                        } else {
                            if (errorMessage) errorMessage.style.display = 'flex';
                            if (successMessage) successMessage.style.display = 'none';
                            if (res.message && errorMessage) {
                                const h3 = errorMessage.querySelector('h3');
                                if (h3) h3.textContent = res.message;
                            }
                            if (res.details && errorDetail) {
                                errorDetail.textContent = res.details;
                            }
                        }
                    }, 1500);
                })
                .catch((err) => {
                    setTimeout(() => {
                        if (errorMessage) errorMessage.style.display = 'flex';
                        if (successMessage) successMessage.style.display = 'none';
                        if (errorDetail) errorDetail.textContent = 'Network error. Please check your connection and try again.';
                        applyButton.innerHTML = 'Apply Referral Code';
                        applyButton.disabled = false;
                    }, 1500);
                    console.error(err);
                });
        });
    }

    if (skipButton) {
        skipButton.addEventListener('click', function () {
            window.location.href = '/skipRefferal';
        });
    }

    if (referralCodeInput) {
        referralCodeInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
            if (this.classList.contains('error')) {
                this.classList.remove('error', 'shake');
                if (codeError) codeError.style.display = 'none';
            }
        });
        referralCodeInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                if (applyButton) applyButton.click();
            }
        });
    }

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            const existingRipple = this.querySelector('.ripple');
            if (existingRipple) existingRipple.remove();
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;
            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.clientX - this.getBoundingClientRect().left - radius}px`;
            ripple.style.top = `${e.clientY - this.getBoundingClientRect().top - radius}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});
