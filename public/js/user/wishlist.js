document.addEventListener('DOMContentLoaded', function () {
    const loadingOverlay = document.querySelector('.loading-overlay');

    function showLoading() { if (loadingOverlay) loadingOverlay.style.display = 'flex'; }
    function hideLoading() { if (loadingOverlay) loadingOverlay.style.display = 'none'; }

    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(function (button) {
        button.addEventListener('click', async function () {
            const productId = this.dataset.productId;
            const productRow = this.closest('tr');
            const productName = productRow ? (productRow.querySelector('.product-name a')?.textContent.trim() || 'this product') : 'this product';

            if (typeof Swal === 'undefined') {
                if (!confirm(`Are you sure you want to remove ${productName} from your wishlist?`)) return;
            } else {
                const { isConfirmed } = await Swal.fire({
                    title: 'Remove from wishlist?',
                    html: `Are you sure you want to remove <strong>${productName}</strong> from your wishlist?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#2e7d32',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, remove it',
                    cancelButtonText: 'Cancel',
                    reverseButtons: true
                });
                if (!isConfirmed) return;
            }

            try {
                showLoading();
                const response = await fetch(`/removeProductFromWishlist?productId=${encodeURIComponent(productId)}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();
                if (response.ok) {
                    if (productRow) {
                        productRow.style.transition = 'all 0.3s ease';
                        productRow.style.opacity = '0';
                        setTimeout(() => {
                            productRow.remove();
                            if (itemCount) {
                                const newCount = parseInt(itemCount.textContent) - 1;
                                document.querySelectorAll('.item-count').forEach(el => el.textContent = newCount);
                                if (newCount <= 0) window.location.reload();
                            }
                        }, 300);
                    }
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Item removed', showConfirmButton: false, timer: 2000, timerProgressBar: true });
                    }
                } else {
                    throw new Error(result.message || 'Failed to remove item');
                }
            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error', text: error.message, confirmButtonColor: '#2e7d32' });
                } else alert(error.message);
            } finally {
                hideLoading();
            }
        });
    });

    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(function (button) {
        button.addEventListener('click', async function () {
            if (this.disabled) return;
            const variants = JSON.parse(this.dataset.productVariants || '[]');
            if (variants.length === 0) return;

            let selectedSize = null;
            if (typeof Swal !== 'undefined') {
                const sizeButtons = variants.map(v => `<button class="swal-size-btn" data-size="${v.size}">${v.size}</button>`).join('');
                const { value: confirmed } = await Swal.fire({
                    title: 'Select Size',
                    html: `<div id="swal-size-container" style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:15px;">${sizeButtons}</div>`,
                    showCancelButton: true, confirmButtonText: 'Confirm', cancelButtonText: 'Cancel', confirmButtonColor: '#2e7d32', cancelButtonColor: '#d33',
                    preConfirm: () => {
                        if (!selectedSize) { Swal.showValidationMessage('Please select a size'); return false; }
                        return selectedSize;
                    },
                    didOpen: () => {
                        document.querySelectorAll('.swal-size-btn').forEach(btn => {
                            btn.style.cssText = `padding:10px 18px; border:2px solid #2e7d32; border-radius:8px; background:#fff; color:#2e7d32; font-weight:600; font-size:14px; cursor:pointer; transition: all 0.3s ease;`;
                            btn.addEventListener('click', () => {
                                document.querySelectorAll('.swal-size-btn').forEach(b => { b.style.background = '#fff'; b.style.color = '#2e7d32'; });
                                btn.style.background = '#2e7d32'; btn.style.color = '#fff';
                                selectedSize = btn.dataset.size;
                            });
                        });
                    }
                });
                if (!confirmed) return;
                selectedSize = confirmed;
            } else {
                const sizes = variants.map(v => v.size).join(', ');
                selectedSize = prompt(`Enter size (${sizes}):`);
                if (!selectedSize) return;
            }

            const productId = this.dataset.productId;
            const productRow = this.closest('tr');
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            this.disabled = true;

            try {
                const response = await fetch(`/addProductToCart?productId=${encodeURIComponent(productId)}&selectedSize=${encodeURIComponent(selectedSize)}`);
                const result = await response.json();
                if (response.ok) {
                    if (productRow) {
                        productRow.style.transition = 'all 0.3s ease';
                        productRow.style.opacity = '0';
                        setTimeout(() => productRow.remove(), 300);
                    }
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Added to cart', showConfirmButton: false, timer: 2000 });
                    } else alert('Added to cart');

                    // Update cart counters
                    document.querySelectorAll('.cart-count').forEach(el => {
                        let currentCount = parseInt(el.textContent) || 0;
                        el.textContent = currentCount + 1;
                    });
                } else {
                    throw new Error(result.message || 'Failed');
                }
            } catch (error) {
                this.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                this.disabled = false;
                if (typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error', text: error.message });
                else alert(error.message);
            }
        });
    });
});
