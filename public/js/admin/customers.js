async function blockPermission(userId, userName) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: `Block ${userName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
        });

        if (isConfirmed) {
            const res = await fetch('/admin/blockCustomer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                const btn = document.getElementById(`btn-${userId}`);
                if (btn) {
                    btn.textContent = 'Unblock';
                    btn.className = 'unblock-btn';
                    btn.setAttribute('onclick', `unblockPermission('${userId}', '${userName}')`);
                }

                // Update card button
                const cardBtn = document.getElementById(`card-btn-${userId}`)
                if (cardBtn) {
                    cardBtn.textContent = 'Unblock'
                    cardBtn.className = 'unblock-btn'
                    cardBtn.setAttribute('onclick', `unblockPermission('${userId}', '${userName}')`)
                }

                Swal.fire('Blocked!', '', 'success')
            }
        }
    } catch (error) {
        console.error('Error blocking user:', error)
        Swal.fire('something went wrong!', '', 'error')
    }
}

async function unblockPermission(userId, userName) {
    const { isConfirmed } = await Swal.fire({
        title: `Unblock ${userName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
    });

    if (isConfirmed) {
        const res = await fetch('/admin/unBlockCustomer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (res.ok) {
            // Update table button
            const btn = document.getElementById(`btn-${userId}`);
            if (btn) {
                btn.textContent = 'Block';
                btn.className = 'block-btn';
                btn.setAttribute('onclick', `blockPermission('${userId}', '${userName}')`);
            }

            // Update card button
            const cardBtn = document.getElementById(`card-btn-${userId}`);
            if (cardBtn) {
                cardBtn.textContent = 'Block';
                cardBtn.className = 'block-btn';
                cardBtn.setAttribute('onclick', `blockPermission('${userId}', '${userName}')`);
            }

            Swal.fire('Unblocked!', '', 'success');
        }
    }
}

const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-button');
const table = document.getElementById('user-table');
const cardContainer = document.getElementById('card-container');
const pagination = document.getElementById('pagination');

// Function to fetch & render users
const fetchAndRenderUsers = async (search) => {
    try {
        const res = await fetch(`/admin/users?search=${encodeURIComponent(search)}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const result = await res.json();
        const users = result.data;
        const currentPage = result.currentPage;
        const totalPages = result.totalPages;

        table.innerHTML = '';
        cardContainer.innerHTML = '';
        pagination.innerHTML = '';

        if (users.length === 0) {
            const emptyHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No customers found</p>
                    </td>
                </tr>`;
            table.innerHTML = emptyHTML;
            cardContainer.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No customers found</p></div>';
        } else {
            // Render table view
            users.forEach(user => {
                table.innerHTML += `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.phone}</td>
                        <td>
                            ${user.isBlock === false
                        ? `<button class="block-btn" id="btn-${user._id}" onclick="blockPermission('${user._id}', '${user.username}')">Block</button>`
                        : `<button class="unblock-btn" id="btn-${user._id}" onclick="unblockPermission('${user._id}', '${user.username}')">Unblock</button>`
                    }
                        </td>
                    </tr>`;
            });

            // Render card view for mobile
            users.forEach(user => {
                cardContainer.innerHTML += `
                    <div class="customer-card">
                        <div class="customer-info">
                            <strong>Name:</strong> ${user.username}
                        </div>
                        <div class="customer-info">
                            <strong>Email:</strong> ${user.email}
                        </div>
                        <div class="customer-info">
                            <strong>Phone:</strong> ${user.phone}
                        </div>
                        <div class="customer-info">
                            <strong>Action:</strong>
                            ${user.isBlock === false
                        ? `<button class="block-btn" id="card-btn-${user._id}" onclick="blockPermission('${user._id}', '${user.username}')">Block</button>`
                        : `<button class="unblock-btn" id="card-btn-${user._id}" onclick="unblockPermission('${user._id}', '${user.username}')">Unblock</button>`
                    }
                        </div>
                    </div>`;
            });
        }

        // Render pagination
        let paginationHTML = '';

        if (currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="/admin/users?page=${currentPage - 1}${search ? '&search=' + encodeURIComponent(search) : ''}" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>`;
        }

        paginationHTML += `
            <li class="page-item active">
                <a class="page-link" href="#">${currentPage}</a>
            </li>`;

        if (currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="/admin/users?page=${currentPage + 1}${search ? '&search=' + encodeURIComponent(search) : ''}" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>`;
        }

        pagination.innerHTML = paginationHTML;

    } catch (err) {
        console.error('Error fetching users:', err);
        const errorHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading customers. Please try again.</p>
                </td>
            </tr>`;
        table.innerHTML = errorHTML;
        cardContainer.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading customers. Please try again.</p></div>';
    }
};

// On keyup search with debounce
let searchTimeout;
searchInput?.addEventListener('keyup', () => {
    clearTimeout(searchTimeout);
    const searchValue = searchInput.value || '';

    searchTimeout = setTimeout(() => {
        fetchAndRenderUsers(searchValue);
    }, 300);
});

// On clear button click
clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    fetchAndRenderUsers('');
});

// Handle window resize to toggle between table and card view
function checkViewMode() {
    if (window.innerWidth <= 480) {
        const tableContainer = document.querySelector('.table-container');
        const cardContainer = document.querySelector('.card-container');
        if (tableContainer) tableContainer.style.display = 'none';
        if (cardContainer) cardContainer.style.display = 'block';
    } else {
        const tableContainer = document.querySelector('.table-container');
        const cardContainer = document.querySelector('.card-container');
        if (tableContainer) tableContainer.style.display = 'block';
        if (cardContainer) cardContainer.style.display = 'none';
    }
}

// Initialize on page load and resize
window.addEventListener('load', checkViewMode);
window.addEventListener('resize', checkViewMode);
