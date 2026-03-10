// Simple animation for elements
document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeInCard 0.5s ease ${index * 0.2}s forwards`;
        card.style.opacity = '0';
    });
});
