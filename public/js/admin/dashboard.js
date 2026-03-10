
let productsChart;
let categoriesChart;
let brandsChart;

function initDashboard(config) {
    // Initialize charts based on available data
    if (config.topProducts && config.topProducts.length > 0) {
        initializeProductsChart(config.topProducts);
    }

    if (config.topCategory && config.topCategory.length > 0) {
        initializeCategoriesChart(config.topCategory);
    }

    if (config.topBrands && config.topBrands.length > 0) {
        initializeBrandsChart(config.topBrands);
    }

    // Set up event listeners
    setupEventListeners();

    // Initialize date inputs with current date
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const startDateEl = document.getElementById('startDate');
    const endDateEl = document.getElementById('endDate');
    if (startDateEl) startDateEl.valueAsDate = sevenDaysAgo;
    if (endDateEl) endDateEl.valueAsDate = today;

    // Handle sidebar state changes
    handleSidebarState();
}

// Chart initialization functions
function initializeProductsChart(topProducts) {
    const productsEl = document.getElementById('productsChart');
    if (!productsEl) return;
    const productsCtx = productsEl.getContext('2d');

    productsChart = new Chart(productsCtx, {
        type: 'bar',
        data: {
            labels: topProducts.map((p) => p.productName),
            datasets: [
                {
                    label: 'Units Sold',
                    data: topProducts.map((p) => p.totalSold),
                    backgroundColor: 'rgba(255, 215, 0, 0.7)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue',
                    data: topProducts.map((p) => p.totalRevenue),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top Selling Products (Units vs Revenue)',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Units Sold' }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Revenue (₹)' }
                }
            }
        }
    });
}

function initializeCategoriesChart(topCategory) {
    const categoriesEl = document.getElementById('categoriesChart');
    if (!categoriesEl) return;
    const categoriesCtx = categoriesEl.getContext('2d');

    categoriesChart = new Chart(categoriesCtx, {
        type: 'doughnut',
        data: {
            labels: topCategory.map((c) => c.categoryName),
            datasets: [{
                label: 'Total Sold',
                data: topCategory.map((c) => c.totalSold),
                backgroundColor: [
                    'rgba(255, 215, 0, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(255, 87, 34, 0.7)',
                    'rgba(121, 85, 72, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 215, 0, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(255, 87, 34, 1)',
                    'rgba(121, 85, 72, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Sales Distribution by Category',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const sold = context.raw.toLocaleString('en-IN');
                            const revenue = topCategory[index].totalRevenue.toLocaleString('en-IN');
                            return `Sold: ${sold} | Revenue: ₹${revenue}`;
                        }
                    }
                }
            }
        }
    });
}

function initializeBrandsChart(topBrands) {
    const brandsEl = document.getElementById('brandsChart');
    if (!brandsEl) return;
    const brandsCtx = brandsEl.getContext('2d');

    brandsChart = new Chart(brandsCtx, {
        type: 'bar',
        data: {
            labels: topBrands.map((b) => b.brandName),
            datasets: [
                {
                    label: 'Units Sold',
                    data: topBrands.map((b) => b.totalSold),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue',
                    data: topBrands.map((b) => b.totalRevenue),
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top Selling Brands (Units vs Revenue)',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.raw.toLocaleString('en-IN');
                            return datasetLabel + ': ' + (datasetLabel === 'Revenue' ? '₹' : '') + value;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Brands' }
                },
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Units / Revenue' }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Revenue (₹)' }
                }
            }
        }
    });
}

// Handle sidebar state changes
function handleSidebarState() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('collapsed')) {
        document.body.classList.add('sidebar-collapsed');
    } else {
        document.body.classList.remove('sidebar-collapsed');
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            setTimeout(() => {
                if (sidebar && sidebar.classList.contains('collapsed')) {
                    document.body.classList.add('sidebar-collapsed');
                } else {
                    document.body.classList.remove('sidebar-collapsed');
                }
                window.dispatchEvent(new Event('resize'));
            }, 300);
        });
    }
}

// Event listener setup
function setupEventListeners() {
    window.addEventListener('resize', function () {
        if (productsChart) {
            productsChart.resize();
        }
        if (categoriesChart) {
            categoriesChart.resize();
        }
        if (brandsChart) {
            brandsChart.resize();
        }
    });

    const filterButtons = document.querySelectorAll('#filterButtons button');
    const customDateInputs = document.getElementById('customDateInputs');
    const applyButton = document.getElementById('applyCustomFilter');
    let filterDate;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterDate = button.dataset.filter;

            filterButtons.forEach(btn => {
                btn.classList.remove('btn-yellow', 'text-dark');
                btn.classList.add('btn-outline-yellow');
            });

            button.classList.remove('btn-outline-yellow');
            button.classList.add('btn-yellow', 'text-dark');

            if (button.dataset.filter === 'custom') {
                if (customDateInputs) {
                    customDateInputs.style.display = 'block';
                    customDateInputs.style.opacity = '0';
                    setTimeout(() => {
                        customDateInputs.style.opacity = '1';
                    }, 50);
                }
            } else {
                fetchTheFilterData(filterDate, null, null);
                if (customDateInputs) {
                    customDateInputs.style.opacity = '0';
                    setTimeout(() => {
                        customDateInputs.style.display = 'none';
                    }, 300);
                }
            }
        });
    });

    applyButton?.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            showToast('Please select both start and end dates.', 'error');
            return;
        }

        fetchTheFilterData('custom', startDate, endDate);
    });
}

function fetchTheFilterData(filter, start, end) {
    document.body.classList.add('loading');
    setTimeout(() => {
        let url = `/admin/dashboard?date=${encodeURIComponent(filter)}`;
        if (start && end) {
            url += `&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
        }
        window.location.href = url;
    }, 500);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000)
}

// Auto-initialize if data is provided via global variable
document.addEventListener('DOMContentLoaded', () => {
    if (window.DASHBOARD_DATA) {
        initDashboard(window.DASHBOARD_DATA);
    }
});
