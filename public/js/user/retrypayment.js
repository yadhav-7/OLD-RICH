// Payment method selection
const paymentMethods = document.querySelectorAll('.payment-method');
if (paymentMethods) {
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
        });
    });
}
