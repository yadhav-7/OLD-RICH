document.addEventListener('DOMContentLoaded', function () {
    const totalOfCart = document.getElementById('totalOfCart')
    const subtotal = document.getElementById('subtotal')

    // Remove product from cart
    const removeButtons = document.querySelectorAll('.remove-btn');

    removeButtons.forEach(function (removeBtn) {
        removeBtn.addEventListener('click', async function (event) {
            event.preventDefault();

            const indexId = this.dataset.productId;
            const { isConfirmed } = await Swal.fire({
                title: 'Remove this item?',
                text: "This item will be removed from your cart.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, remove it!',
                cancelButtonText: 'Keep it'
            });

            if (isConfirmed) {
                try {
                    const response = await fetch(`/removeProductFromCart?indexId=${encodeURIComponent(indexId)}`);
                    const result = await response.json();

                    if (result.success) {
                        window.location.reload();
                    } else {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'error',
                            title: result.message || 'Failed to remove item',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                    }
                } catch (err) {
                    console.error('Error:', err);
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'An error occurred while removing the item',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                }
            }
        });
    });


    // Increase quantity
    const increaseButtons = document.querySelectorAll('.quantity-btn.increase');
    increaseButtons.forEach(function (button, index) {
        button.addEventListener('click', async function (event) {
            const itemTotal = document.getElementById(`total-${index}`)
            const productId = this.dataset.id;

            //Find the related input in the same row
            const itemSelectedQuantity = this.closest('tr').querySelector('.quantity-input');

            try {
                const response = await fetch(`/increaseCartItems?item=${encodeURIComponent(productId)}`);
                const data = await response.json();

                if (response.ok) {
                    itemSelectedQuantity.value = data.quantity;
                    totalOfCart.innerText = `₹${data.cartTotal.toFixed(2)}`
                    subtotal.innerText = `₹${data.cartTotal.toFixed(2)}`
                    itemTotal.innerText = `₹${data.itemTotal.toFixed(2)}`
                } else {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: data.message || 'Failed to update quantity',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                }

            } catch (error) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: error.message || 'Failed to update quantity',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            }
        });
    });

    // Decrease quantity
    const decreaseButtons = document.querySelectorAll('.quantity-btn.decrease');
    decreaseButtons.forEach(function (button, index) {
        button.addEventListener('click', async function (event) {
            const itemTotal = document.getElementById(`total-${index}`)
            const productId = this.dataset.id;

            // 👇 Find the related input in the same row
            const itemSelectedQuantity = this.closest('tr').querySelector('.quantity-input');

            try {
                const response = await fetch(`/decreaseCartItems?item=${encodeURIComponent(productId)}`);
                const data = await response.json();

                if (response.ok) {
                    itemSelectedQuantity.value = data.quantity;
                    totalOfCart.innerText = `₹${data.cartTotal.toFixed(2)}`
                    subtotal.innerText = `₹${data.cartTotal.toFixed(2)}`
                    itemTotal.innerText = `₹${data.itemTotal.toFixed(2)}`
                } else {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: data.message || 'Failed to update quantity',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                }

            } catch (error) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: error.message || 'Failed to update quantity',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            }
        });
    });



    // Proceed to checkout button
    const checkoutBtn = document.getElementById('proceed-to-checkout');


    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function () {
            // Show loading state
            const originalText = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = `
            <span class="spinner"></span>
            <span>${checkoutBtn.textContent.trim()}</span>
        `;
            checkoutBtn.disabled = true;

            // Collect all available item IDs
            const availableItems = Array.from(
                document.querySelectorAll('.cart-table tbody tr:not(.unavailable-row) .remove-btn')
            ).map(btn => btn.dataset.productId);

            if (availableItems.length === 0) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
                await Swal.fire({
                    icon: 'error',
                    title: 'Empty Cart',
                    html: `
                    <div class="text-left">
                        <p>Your cart contains no available items to checkout.</p>
                        <p class="mt-2">Please add some products before proceeding.</p>
                    </div>
                `,
                    confirmButtonColor: '#2e7d32',
                    confirmButtonText: 'Continue Shopping'
                });
                return;
            }

            try {
                const response = await fetch('/checkoutpage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: availableItems })
                });

                const result = await response.json();


                if (response.ok) {
                    window.location.href = `/checkOutPage?item=${availableItems}`;
                } else {
                    checkoutBtn.innerHTML = originalText;
                    checkoutBtn.disabled = false;

                    // Handle validation errors
                    if (result.detailedIssues && result.detailedIssues.length > 0) {
                        const issuesList = result.detailedIssues.map(issue =>
                            `<li class="text-left py-1">${issue}</li>`
                        ).join('');

                        await Swal.fire({
                            icon: 'warning',
                            title: 'Checkout Issues',
                            html: `
                            <div class="text-left">
                                <p>We found some issues with your cart items:</p>
                                <ul class="list-disc pl-5 mt-2">
                                    ${issuesList}
                                </ul>
                                <p class="mt-3">Please update your cart and try again.</p>
                            </div>
                        `,
                            confirmButtonColor: '#2e7d32',
                            confirmButtonText: 'Update Cart'
                        });
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Checkout Failed',
                            text: result.message || 'Could not proceed to checkout',
                            confirmButtonColor: '#2e7d32'
                        });
                    }
                    window.location.reload();
                }
            } catch (error) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    html: `
                    <div class="text-left">
                        <p>An error occurred while processing your checkout.</p>
                        <p class="mt-2">Please try again later.</p>
                    </div>
                `,
                    confirmButtonColor: '#2e7d32'
                });
                console.error('Checkout error:', error);
            }
        });
    }

    // Add this CSS for the spinner
    const style = document.createElement('style');
    style.textContent = `
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
        margin-right: 8px;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
    document.head.appendChild(style);
});
