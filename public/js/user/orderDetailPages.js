// Cancel Individual Item Function
const subtotal = document.getElementById('subTotalValue');
const finalAmount = document.getElementById('finalAmountValue');

async function cancelItem(orderId, itemId, index) {
    const cancelBtn = document.getElementById(`cancelItem${index}`);
    const stausBtn = document.getElementById(`itemStaus${index}`);

    if (!cancelBtn) return;

    // Add loading state to button
    cancelBtn.classList.add('btn-loading');

    if (typeof Swal !== 'undefined') {
        const { isConfirmed } = await Swal.fire({
            title: 'Cancel Item?',
            text: "Are you sure you want to cancel this item? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!',
            cancelButtonText: 'Keep item'
        });

        if (isConfirmed) {
            try {
                const response = await fetch('/cancelSingleItem?_method=PATCH', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderId,
                        itemId
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    if (subtotal) subtotal.textContent = `₹${result.finalAmount.toFixed(2)}`;
                    if (finalAmount) finalAmount.textContent = `₹${result.total.toFixed(2)}`;

                    cancelBtn.outerHTML = `
                        <button type="button" class="btn btn-danger btn-sm btn-disabled" disabled>
                            <i class="fas fa-ban"></i> Cancelled
                        </button>
                    `;

                    if (stausBtn) {
                        stausBtn.textContent = 'cancelled';
                        stausBtn.className = 'status-indicator status-cancelled';
                    }

                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: result.message || 'Item cancelled successfully',
                        showConfirmButton: false,
                        timer: 2000
                    });

                    // Check if all items are cancelled and update order status if needed
                    checkAllItemsCancelled();

                } else {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: result.message || 'Failed to cancel item',
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            } catch (error) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'An error occurred while cancelling the item',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        }
    }

    // Remove loading state
    cancelBtn.classList.remove('btn-loading');
}

window.confirmCancelOrder = async function (orderId) {
    if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({ title: 'Cancel Order?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, cancel it!' });
        if (!result.isConfirmed) return;
    } else if (!confirm('Are you sure?')) return;

    try {
        const res = await fetch('/cancellOrder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
        if (res.ok) window.location.reload();
    } catch (error) { console.error(error); }
};

window.returnOrder = async function (orderId) {
    let reason = '';
    alert('return Order function is wo')
    if (typeof Swal !== 'undefined') {
        const { value } = await Swal.fire({ title: 'Return Reason', input: 'text', showCancelButton: true, inputValidator: (v) => !v && 'Reason required!' });
        if (!value) return;
        reason = value;
    } else {
        reason = prompt('Return reason:');
        if (!reason) return;
    }
    try {

        const res = await fetch('/returnReq?_method=PATCH', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, reason, itemId: null }) });
        if (res.ok) window.location.reload();
    } catch (error) { console.error(error); }
};


// Function to check if all items are cancelled
function checkAllItemsCancelled() {
    const allItems = document.querySelectorAll('.order-item');
    let allCancelled = true;

    allItems.forEach(item => {
        const statusIndicator = item.querySelector('.status-indicator');
        if (statusIndicator && !statusIndicator.textContent.includes('cancelled')) {
            allCancelled = false;
        }
    });

    if (allCancelled) {
        // Update order status to cancelled
        const orderStatusElem = document.querySelector('.order-status');
        if (orderStatusElem) {
            orderStatusElem.textContent = 'Cancelled';
            orderStatusElem.className = 'order-status status-cancelled';
        }

        // Update timeline
        updateTimelineForCancelled();
    }
}

// Update timeline when order is cancelled
function updateTimelineForCancelled() {
    const timelineSteps = document.querySelectorAll('.timeline-step');
    timelineSteps.forEach(step => {
        const stepIcon = step.querySelector('.step-icon');
        const stepLabel = step.querySelector('.step-label');

        if (stepIcon && stepLabel) {
            stepIcon.className = 'step-icon cancelled';
            stepLabel.className = 'step-label cancelled';

            // Update the last step to show cancelled
            if (stepLabel.textContent.includes('Delivered') ||
                stepLabel.textContent.includes('Returned')) {
                stepIcon.innerHTML = '<i class="fas fa-times"></i>';
                stepLabel.textContent = 'Cancelled';
            }
        }
    });

    // Update progress bar
    const timelineProgress = document.getElementById('timelineProgress');
    if (timelineProgress) {
        timelineProgress.style.width = '100%';
        timelineProgress.style.backgroundColor = 'var(--error-red)';
    }
}

// Return Individual Item Function
async function returnItem(itemId, orderId) {

    if (typeof Swal === 'undefined') return;

    try {

        const { value: reason } = await Swal.fire({
            title: 'Return Item Reason',
            input: 'textarea',
            inputLabel: 'Please provide a reason for returning this item:',
            inputPlaceholder: 'e.g., Wrong size, Damaged product, etc.',
            inputAttributes: {
                'aria-label': 'Type your reason here'
            },
            showCancelButton: true,
            confirmButtonText: 'Submit Return',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason for the return!';
                }
            }
        });

        if (reason) {
            // Find and add loading state to return button
            const returnButtons = document.querySelectorAll(`button[onclick*="${itemId}"]`);
            returnButtons.forEach(btn => {
                if (btn.textContent.includes('Return Item')) {
                    btn.classList.add('btn-loading');
                }
            });


            const response = await fetch('/returnReq?_method=PATCH', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemId,
                    orderId,
                    reason
                })
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: result.message || 'Return request submitted successfully',
                    showConfirmButton: false,
                    timer: 2000
                });

                // Reload after a short delay to show the success message
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: result.message || 'Failed to submit return request',
                    showConfirmButton: false,
                    timer: 2000
                });
            }

            // Remove loading state
            returnButtons.forEach(btn => {
                if (btn.textContent.includes('Return Item')) {
                    btn.classList.remove('btn-loading');
                }
            });
        }
    } catch (error) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'An error occurred while processing your return request',
            showConfirmButton: false,
            timer: 2000
        });
    }
}

// Timeline Progress Animation
document.addEventListener('DOMContentLoaded', function () {
    const timelineProgress = document.getElementById('timelineProgress');
    if (!timelineProgress) return;

    const orderStatus = (window.ORDER_CONFIG && window.ORDER_CONFIG.status) || '';

    let progressWidth = 0;

    if (orderStatus === 'Processing') {
        progressWidth = 33;
    } else if (orderStatus === 'Shipped') {
        progressWidth = 66;
    } else if (['Delivered', 'returnRequested', 'returned', 'reutrnRejected', 'cancelled'].includes(orderStatus)) {
        progressWidth = 100;
    } else {
        progressWidth = 0;
    }

    setTimeout(() => {
        timelineProgress.style.width = `${progressWidth}%`;
    }, 300);
});
