document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap dropdowns explicitly
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    dropdownElementList.forEach(dropdown => {
        new bootstrap.Dropdown(dropdown);
    });


    // Category card animations
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
});
