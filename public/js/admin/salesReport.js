
// Set default date inputs to today
let startDate;
let endDate;
const today = new Date();
const startOfToday = new Date(today);

const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

if (startDateInput) startDateInput.valueAsDate = startOfToday;
if (endDateInput) endDateInput.valueAsDate = today;

// Filter state
let currentFilter = {
    preset: '',
    startDate: formatDate(today),
    endDate: formatDate(today)
}

// Filter toggle functionality
const filterCard = document.getElementById('filter-card');
const filterHeader = document.getElementById('filter-header');
const toggleFiltersBtn = document.getElementById('toggle-filters');
const presetSelect = document.getElementById('preset-select');
const customDateGroup = document.getElementById('custom-date-group');
const loadingSpinner = document.getElementById('loading-spinner');
const statsGrid = document.getElementById('stats-grid');
const reportSection = document.getElementById('report-section');

// Initialize filters as collapsed
if (filterCard) {
    filterCard.classList.add('collapsed');
    filterCard.classList.remove('expanded');
}
if (toggleFiltersBtn) {
    const span = toggleFiltersBtn.querySelector('span');
    if (span) span.textContent = 'Show Filters';
}

// Toggle filters when header is clicked
filterHeader?.addEventListener('click', function () {
    toggleFilters();
});

// Toggle filters when button is clicked
toggleFiltersBtn?.addEventListener('click', function () {
    toggleFilters();
});

function toggleFilters() {
    if (!filterCard) return;
    const isCollapsed = filterCard.classList.contains('collapsed');

    if (isCollapsed) {
        // Expand filters
        filterCard.classList.remove('collapsed');
        filterCard.classList.add('expanded');
        if (toggleFiltersBtn) {
            const span = toggleFiltersBtn.querySelector('span');
            if (span) span.textContent = 'Hide Filters';
            const icon = toggleFiltersBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-times';
        }
    } else {
        // Collapse filters
        filterCard.classList.remove('expanded');
        filterCard.classList.add('collapsed');
        if (toggleFiltersBtn) {
            const span = toggleFiltersBtn.querySelector('span');
            if (span) span.textContent = 'Show Filters';
            const icon = toggleFiltersBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-filter';
        }
    }
}

// Preset select change
presetSelect?.addEventListener('change', function () {
    currentFilter.preset = this.value;

    // Show/hide custom date inputs
    if (currentFilter.preset === 'custom') {
        if (customDateGroup) customDateGroup.style.display = 'block';
        currentFilter.startDate = startDate;
        currentFilter.endDate = endDate;
    } else {
        if (customDateGroup) customDateGroup.style.display = 'none';
    }
});

// Date input changes
startDateInput?.addEventListener('change', function () {
    currentFilter.startDate = this.value;
    currentFilter.preset = 'custom';
    if (presetSelect) presetSelect.value = 'custom';
    if (customDateGroup) customDateGroup.style.display = 'block';
});

endDateInput?.addEventListener('change', function () {
    currentFilter.endDate = this.value;
    currentFilter.preset = 'custom';
    if (presetSelect) presetSelect.value = 'custom';
    if (customDateGroup) customDateGroup.style.display = 'block';
});


// Format date for display
function formatDate(date) {
    return date.toISOString().split('T')[0];
}


// Format date for display (MM/DD/YYYY)
function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

document.getElementById('generate-report')?.addEventListener('click', async function () {
    try {
        // Show loading state
        if (!currentFilter.preset) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: "Please select a date!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
                    stopOnFocus: true
                }).showToast();
            }
            return;
        }
        loadingSpinner?.classList.add('active');
        statsGrid?.classList.add('loading');
        if (reportSection) reportSection.style.display = 'none';

        let filterParam = '';
        let startDateValue = '';
        let endDateValue = '';

        // Determine filter parameters
        switch (currentFilter.preset) {
            case 'today':
                filterParam = 'Today';
                break;
            case 'week':
                filterParam = 'Last 7 Days';
                break;
            case 'month':
                filterParam = 'Last 30 Days';
                break;
            case 'year':
                filterParam = 'Last Year';
                break;
            case 'custom':
                filterParam = 'custom';
                startDateValue = document.getElementById('start-date').value;
                endDateValue = document.getElementById('end-date').value;

                // Validate custom dates
                let todayDate = new Date();
                todayDate.setHours(23, 59, 59, 999);

                let start = new Date(startDateValue);
                let end = new Date(endDateValue);
                end.setHours(23, 59, 59, 999);

                if (start > todayDate) {
                    if (typeof Toastify !== 'undefined') {
                        Toastify({
                            text: "Start date cannot be in the future!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
                            stopOnFocus: true
                        }).showToast();
                    }
                    loadingSpinner?.classList.remove('active');
                    statsGrid?.classList.remove('loading');
                    return;
                }

                if (end > todayDate) {
                    if (typeof Toastify !== 'undefined') {
                        Toastify({
                            text: "End date cannot be in the future!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "linear-gradient(to right, #36d1dc, #5b86e5)",
                            stopOnFocus: true
                        }).showToast();
                    }
                    loadingSpinner?.classList.remove('active');
                    statsGrid?.classList.remove('loading');
                    return;
                }

                if (start > end) {
                    if (typeof Toastify !== 'undefined') {
                        Toastify({
                            text: "Start date should be before end date!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "linear-gradient(to right, #ff512f, #dd2476)",
                            stopOnFocus: true
                        }).showToast();
                    }
                    loadingSpinner?.classList.remove('active');
                    statsGrid?.classList.remove('loading');
                    return;
                }
                break;
        }


        const response = await fetch(`/admin/salesReport?date=${encodeURIComponent(filterParam)}&startDate=${encodeURIComponent(startDateValue)}&endDate=${encodeURIComponent(endDateValue)}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Update stats
        const elTotalSalesCount = document.getElementById('totalSalesCount');
        if (elTotalSalesCount) elTotalSalesCount.textContent = data.totalSalesCount;

        const elOverallOrderAmount = document.getElementById('OverallOrderAmount');
        if (elOverallOrderAmount) elOverallOrderAmount.textContent = '₹' + data.OverallOrderAmount.toFixed(2);

        const elOverallDiscount = document.getElementById('OverallDiscount');
        if (elOverallDiscount) elOverallDiscount.textContent = '₹' + data.OverallDiscount.toFixed(2);

        const elCouponUsage = document.getElementById('CouponUsage');
        if (elCouponUsage) elCouponUsage.textContent = data.CouponUsage;

        const elCouponDisCount = document.getElementById('CouponDisCount');
        if (elCouponDisCount) elCouponDisCount.textContent = data.CouponDisCount.toFixed(2);

        const elReturnedAmount = document.getElementById('returnedAmount');
        if (elReturnedAmount) elReturnedAmount.textContent = data.returnedAmount.toFixed(2);

        const elReturnCount = document.getElementById('returnCount');
        if (elReturnCount) elReturnCount.textContent = data.returnCount;

        const elCancelledAmount = document.getElementById('cancelledAmount');
        if (elCancelledAmount) elCancelledAmount.textContent = data.cancelledAmount.toFixed(2);

        const elCancelledCount = document.getElementById('cancelledCount');
        if (elCancelledCount) elCancelledCount.textContent = data.cancelledCount;

        // Update table
        const tableBody = document.getElementById('sales-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';

            let tableNumber = (data.currentPage - 1) * 5;
            tableNumber += 1;

            if (data.orders && data.orders.length > 0) {
                data.orders.forEach(order => {
                    const orderDate = new Date(order.createdOn).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });

                    const couponBadge = order.couponApplied?.applied
                        ? `<span class="coupon-badge">${order.couponApplied.code}</span>`
                        : `<span class="coupon-badge-notused">None</span>`;

                    const row = `
                        <tr>
                            <td>${tableNumber++}</td>
                            <td>${orderDate}</td>
                            <td>${order.userId?.username || 'User Not Exists'}</td>
                            <td>${order.finalAmount}</td>
                            <td><span class="discount-badge">${order.discount || 0}</span></td>
                            <td>${couponBadge}</td>
                            <td class="status ${order.status.toLowerCase()}">${order.status}</td>
                            <td>
                                <a href="/admin/orderDetails?orderId=${encodeURIComponent(order.orderId)}" 
                                   class="btn btn-sm view-btn">
                                   <i class="bi bi-eye me-1"></i> View
                                </a>
                            </td>
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });

                if (reportSection) reportSection.style.display = 'block';
                renderPagination(data.currentPage, data.totalPage);

            } else {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No orders found for the selected filter</td></tr>';
                if (reportSection) reportSection.style.display = 'block';
            }
        }

        // Show success toast
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: `Report loaded successfully!`,
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        }

    } catch (error) {
        console.error('Error fetching sales data:', error);
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: "Error loading data. Please try again!",
                backgroundColor: "#dc3545",
                gravity: "top",
                position: "right"
            }).showToast();
        }
        if (reportSection) reportSection.style.display = 'block';
    } finally {
        // Hide loading state
        loadingSpinner?.classList.remove('active');
        statsGrid?.classList.remove('loading');
    }
});

// Reset filters and reload report to initial state
document.getElementById('reset-filters')?.addEventListener('click', async function () {
    try {
        // Reset filter inputs
        const elStartDate = document.getElementById('start-date');
        const elEndDate = document.getElementById('end-date');
        if (elStartDate) elStartDate.value = '';
        if (elEndDate) elEndDate.value = '';
        currentFilter.preset = '';

        // Show loading state
        loadingSpinner?.classList.add('active');
        statsGrid?.classList.add('loading');
        if (reportSection) reportSection.style.display = 'none';

        const select = document.getElementById("preset-select");
        if (select) select.selectedIndex = 0;
        if (customDateGroup) customDateGroup.style.display = 'none';

        // Reset filter state to initial values
        currentFilter.preset = '';
        currentFilter.startDate = formatDate(today);
        currentFilter.endDate = formatDate(today);

        // Fetch the **first page** with no filter (fresh all-time state)
        const response = await fetch(`/admin/salesReport?page=1`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        // Update stats
        const elTotalSalesCount = document.getElementById('totalSalesCount');
        if (elTotalSalesCount) elTotalSalesCount.textContent = data.totalSalesCount;

        const elOverallOrderAmount = document.getElementById('OverallOrderAmount');
        if (elOverallOrderAmount) elOverallOrderAmount.textContent = '₹' + data.OverallOrderAmount.toFixed(2);

        const elOverallDiscount = document.getElementById('OverallDiscount');
        if (elOverallDiscount) elOverallDiscount.textContent = '₹' + data.OverallDiscount.toFixed(2);

        const elCouponUsage = document.getElementById('CouponUsage');
        if (elCouponUsage) elCouponUsage.textContent = data.CouponUsage;

        const elCouponDisCount = document.getElementById('CouponDisCount');
        if (elCouponDisCount) elCouponDisCount.textContent = data.CouponDisCount.toFixed(2);

        const elReturnedAmount = document.getElementById('returnedAmount');
        if (elReturnedAmount) elReturnedAmount.textContent = data.returnedAmount.toFixed(2);

        const elReturnCount = document.getElementById('returnCount');
        if (elReturnCount) elReturnCount.textContent = data.returnCount;

        const elCancelledAmount = document.getElementById('cancelledAmount');
        if (elCancelledAmount) elCancelledAmount.textContent = data.cancelledAmount.toFixed(2);

        const elCancelledCount = document.getElementById('cancelledCount');
        if (elCancelledCount) elCancelledCount.textContent = data.cancelledCount;

        // Update table
        const tableBody = document.getElementById('sales-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';

            if (data.orders && data.orders.length > 0) {
                let tableNumber = 1;
                data.orders.forEach(order => {
                    const orderDate = new Date(order.createdOn).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });

                    const couponBadge = order.couponApplied?.applied
                        ? `<span class="coupon-badge">${order.couponApplied.code}</span>`
                        : `<span class="coupon-badge-notused">None</span>`;

                    const row = `
                    <tr>
                        <td>${tableNumber++}</td>
                        <td>${orderDate}</td>
                        <td>${order.userId?.username || 'Guest'}</td>
                        <td>${order.finalAmount}</td>
                        <td><span class="discount-badge">${order.discount || 0}</span></td>
                        <td>${couponBadge}</td>
                        <td class="status ${order.status.toLowerCase()}">${order.status}</td>
                        <td>
                            <a href="/admin/orderDetails?orderId=${encodeURIComponent(order.orderId)}" 
                               class="btn btn-sm view-btn">
                               <i class="bi bi-eye me-1"></i> View
                            </a>
                        </td>
                    </tr>
                `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });

                // Reset pagination to first page
                renderPagination(1, data.totalPage);
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No orders found</td></tr>';
            }
        }

        if (reportSection) reportSection.style.display = 'block';

        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: "Report reset to initial state.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        }

    } catch (error) {
        console.error('Error resetting report:', error);
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: "Error resetting report. Please try again!",
                backgroundColor: "#dc3545",
                gravity: "top",
                position: "right"
            }).showToast();
        }
    } finally {
        loadingSpinner?.classList.remove('active');
        statsGrid?.classList.remove('loading');
    }
});

document.getElementById('export-pdf')?.addEventListener('click', function () {
    let filterParam = '';
    let startDateValue = '';
    let endDateValue = '';

    switch (currentFilter.preset) {
        case 'today':
            filterParam = 'Today';
            break;

        case 'week':
            filterParam = 'Last 7 Days';
            break;

        case 'month':
            filterParam = 'Last 30 Days';
            break;

        case 'year':
            filterParam = 'Last Year';
            break;

        case 'custom':
            filterParam = 'custom';
            startDateValue = document.getElementById('start-date').value;
            endDateValue = document.getElementById('end-date').value;
            break;

        default:
            filterParam = 'All';
            break;
    }

    window.location.href = `/admin/generate-pdf?date=${encodeURIComponent(filterParam)}&startDate=${encodeURIComponent(startDateValue)}&endDate=${encodeURIComponent(endDateValue)}`;
});

document.getElementById('export-excel')?.addEventListener('click', function () {
    let filterParam = '';
    let startDateValue = '';
    let endDateValue = '';

    switch (currentFilter.preset) {
        case 'today':
            filterParam = 'Today';
            break;

        case 'week':
            filterParam = 'Last 7 Days';
            break;

        case 'month':
            filterParam = 'Last 30 Days';
            break;

        case 'year':
            filterParam = 'Last Year';
            break;

        case 'custom':
            filterParam = 'custom';
            startDateValue = document.getElementById('start-date').value;
            endDateValue = document.getElementById('end-date').value;
            break;

        default:
            filterParam = 'All';
            break;
    }

    window.location.href = `/admin/salesReportExcel?date=${encodeURIComponent(filterParam)}&startDate=${encodeURIComponent(startDateValue)}&endDate=${encodeURIComponent(endDateValue)}`;
});


async function pagination(action) {
    let filterParam = '';
    let startDateValue = '';
    let endDateValue = '';

    const currentPageEl = document.getElementById('currentPage');
    let currentPage = currentPageEl ? parseInt(currentPageEl.textContent) : 1;

    currentPage = action === 'next' ? currentPage + 1 : currentPage - 1;
    if (currentPage < 1) currentPage = 1;

    switch (currentFilter.preset) {
        case 'today':
            filterParam = 'Today';
            break;
        case 'week':
            filterParam = 'Last 7 Days';
            break;
        case 'month':
            filterParam = 'Last 30 Days';
            break;
        case 'year':
            filterParam = 'Last Year';
            break;
        case 'custom':
            filterParam = 'custom';
            startDateValue = document.getElementById('start-date').value;
            endDateValue = document.getElementById('end-date').value;
            break;
        default:
            filterParam = 'All Time';
            startDateValue = null;
            endDateValue = null;
            break;
    }


    const response = await fetch(`/admin/salesReport?page=${encodeURIComponent(currentPage)}&date=${encodeURIComponent(filterParam)}&startDate=${encodeURIComponent(startDateValue)}&endDate=${encodeURIComponent(endDateValue)}`, {
        headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    const orders = data.orders;

    const curPageEl = document.getElementById('currentPage');
    if (curPageEl) curPageEl.textContent = data.currentPage;


    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let tableNumber = (currentPage - 1) * 5;
    tableNumber += 1;

    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${tableNumber++}</td>
        <td>${new Date(order.createdOn).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })}</td>
        <td>${order.userId?.username || '-'}</td>
        <td>${order.finalAmount}</td>
        <td><span class="discount-badge">${order.discount || 0}</span></td>
        <td>
            ${order.couponApplied?.applied
                ? `<span class="coupon-badge">${order.couponApplied.code}</span>`
                : `<span class="coupon-badge-notused">None</span>`
            }
        </td>
        <td class="status ${order.status.toLowerCase()}">${order.status}</td>
        <td>
            <a href="/admin/orderDetails?orderId=${order.orderId}" class="btn btn-sm view-btn">
                <i class="bi bi-eye me-1"></i> View
            </a>
        </td>
    `;
        tbody.appendChild(tr);
    });

    renderPagination(data.currentPage, data.totalPage);
}

function renderPagination(currentPage, totalPage) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';


    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn prev';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.onclick = () => pagination('previous');
        paginationContainer.appendChild(prevBtn);
    }


    const currentBtn = document.createElement('button');
    currentBtn.id = 'currentPage';
    currentBtn.className = 'page-btn active';
    currentBtn.textContent = currentPage;
    paginationContainer.appendChild(currentBtn);

    if (currentPage < totalPage) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn next';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.onclick = () => pagination('next');
        paginationContainer.appendChild(nextBtn);
    }
}
