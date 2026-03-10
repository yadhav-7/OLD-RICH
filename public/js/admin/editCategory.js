
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editForm');
    if (!form) return;

    const id = form.dataset.id;
    const nameInput = document.getElementById('name');
    const descInput = document.getElementById('description');
    const errorBox = document.getElementById('error-message');

    // Get initial values from data attributes
    const initialName = form.querySelector('#name').dataset.name.trim();
    const initialDescription = form.querySelector('#description').dataset.description.trim();

    // Add input event listeners to clear errors when user types
    nameInput.addEventListener('input', function () {
        if (this.classList.contains('is-invalid')) {
            this.classList.remove('is-invalid');
            errorBox.innerText = '';
        }
    });

    descInput.addEventListener('input', function () {
        if (this.classList.contains('is-invalid')) {
            this.classList.remove('is-invalid');
            errorBox.innerText = '';
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorBox.innerText = '';

        // Remove any existing error classes
        nameInput.classList.remove('is-invalid');
        descInput.classList.remove('is-invalid');

        const name = nameInput.value.trim();
        const description = descInput.value.trim();

        // Check if values have actually changed
        if (name === initialName && description === initialDescription) {
            errorBox.innerText = 'No changes were made to the category.';
            return;
        }

        const validationError = validateInputs(name, description);
        if (validationError.length > 0) {
            errorBox.innerText = validationError.join('\n');
            return;
        }

        try {
            const response = await fetch(`/admin/editCategory/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });

            const result = await response.json();

            if (!response.ok) {
                errorBox.innerText = result.message || 'Something went wrong!';
            } else {
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        title: result.message,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    alert(result.message);
                }
                window.location.href = '/admin/category'; // redirect if needed
            }
        } catch (err) {
            errorBox.innerText = 'Something went wrong. Please try again.';
            console.error(err);
        }
    });

    function validateInputs(name, description) {
        const errors = [];

        // Reset borders
        nameInput.classList.remove('is-invalid');
        descInput.classList.remove('is-invalid');

        if (!name) {
            errors.push("Category name is required.");
            nameInput.classList.add('is-invalid');
        } else if (name.length < 3) {
            errors.push("Category name must be at least 3 characters.");
            nameInput.classList.add('is-invalid');
        } else if (!/^[A-Za-z][A-Za-z\s]*$/.test(name)) {
            errors.push("Category name should start with a letter and contain only letters and spaces.");
            nameInput.classList.add('is-invalid');
        } else if (name.length > 15) {
            errors.push("Category name must be less than 15 characters.");
            nameInput.classList.add('is-invalid');
        }

        if (!description) {
            errors.push("Description is required.");
            descInput.classList.add('is-invalid');
        } else if (description.length < 10) {
            errors.push("Description must be at least 10 characters.");
            descInput.classList.add('is-invalid');
        } else if (/^(.)\1*$/.test(description)) {
            errors.push("Description should not be repetitive or meaningless.");
            descInput.classList.add('is-invalid');
        } else if (description.length > 1000) {
            errors.push("Description must be less 1000 characters.");
            descInput.classList.add('is-invalid');
        }

        return errors;
    }
});
