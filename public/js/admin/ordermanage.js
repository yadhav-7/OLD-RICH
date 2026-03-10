
document.addEventListener('DOMContentLoaded', function () {
    let orderStatusEl;
    let orderId;

    const searchInput = document.getElementById('searchInput');
    const ordersTableBody = document.getElementById('ordersTableBody');

    searchInput?.addEventListener('keyup', async function () {
        const searchValue = searchInput.value.trim();

        try {
            const response = await fetch(`/admin/searchOrders?searchvalue=${encodeURIComponent(searchValue)}`);
            if (!response.ok) {
                console.error("Search failed");
                return;
            }

            const data = await response.json();
            const orders = data.searchData;

            if (!ordersTableBody) return;
            ordersTableBody.innerHTML = '';

            if (orders.length === 0) {
                ordersTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted py-4">
                            No orders found.
                        </td>
                    </tr>`;
                return;
            }

            if (!searchValue) {
                window.location.reload();
            }

            orders.forEach(element => {
                ordersTableBody.innerHTML += `
                    <tr class="order-row">
                        <td>${element.orderId}</td>
                        <td>${new Date(element.createdOn).toLocaleDateString()}</td>
                        <td>${element.userId?.username || ''}</td>
                        <td>${element?.orderedItems?.length || 0}</td>
                        <td>${element.totalPrice}</td>
                        <td>
                            <span id="orderStatus${element.orderId}" class="badge badge-shipped">
                                ${element.status}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-success">
                                ${element.paymentStatus}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-outline-primary"
                                    onclick="openStatusModal('${element.orderId}','${element.status}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <a href="orderDetails?orderId=${element.orderId}" 
                                   class="btn btn-sm btn-outline-info">
                                    <i class="fas fa-eye"></i>
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
            });

            renderPagination(data.currentPage, data.totalPage);

        } catch (error) {
            console.error('Error in searchOrders', error);
        }
    });

    // STATUS BADGE CLASS
    function getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'pending': return 'badge-pending';
            case 'processing': return 'badge-processing';
            case 'shipped': return 'badge-shipped';
            case 'delivered': return 'badge-delivered';
            case 'cancelled': return 'badge-cancelled';
            case 'return': return 'badge-return';
            default: return 'badge-secondary';
        }
    }

    // STATUS UPDATE MODAL
    window.openStatusModal = function (ordId, currentStatus) {
        orderStatusEl = document.getElementById(`orderStatus${ordId}`);
        orderId = ordId;
        document.getElementById('orderId').value = ordId;
        document.getElementById('currentStatus').value = currentStatus;
        document.getElementById('newStatus').value = '';
        $('#statusUpdateModal').modal('show');
    };

    // SUBMIT STATUS CHANGE
    document.getElementById('statusUpdateForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const newStatus = document.getElementById('newStatus').value;
        if (!newStatus) return;

        try {
            const response = await fetch('/admin/changeStatus', {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify({ orderId, newStatus })
            });
            const data = await response.json();
            if (response.ok) {
                if (orderStatusEl) {
                    orderStatusEl.innerHTML = data.updatedStatus;
                    orderStatusEl.className = `badge ${getStatusBadgeClass(data.updatedStatus)}`;
                }
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message || 'Status updated successfully!', showConfirmButton: false, timer: 2000 });
            } else {
                Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: data.message || 'Failed to update status!', showConfirmButton: false, timer: 2000 });
            }
        } catch (error) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error updating status!', showConfirmButton: false, timer: 2000 });
        }
        $('#statusUpdateModal').modal('hide');
    });

    const currentPageEl = document.getElementById('currentPage');
    const currentPage = currentPageEl ? parseInt(currentPageEl.textContent) : 1;

    document.getElementById('nextBtn')?.addEventListener('click', async function (e) {
        e.preventDefault()

        const page = currentPage + 1
        const response = await apiReq(`/admin/orderManagement?page=${encodeURIComponent(page)}`)
        renderOrdersTable(response)
        renderPagination(response.currentPage, response.totalPage)
    })

    document.getElementById('prevBtn')?.addEventListener('click', async function (e) {
        e.preventDefault()
        const page = currentPage - 1
        const response = await apiReq(`/admin/orderManagement?page=${encodeURIComponent(page)}`)
        renderOrdersTable(response)
        renderPagination(response.currentPage, response.totalPage)
    })

    function renderOrdersTable(response) {
        let orderData = response.order

        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        tbody.innerHTML = ''

        if (!orderData || orderData.length === 0) {
            const tableResponsive = document.querySelector('.table-responsive');
            if (tableResponsive) {
                tableResponsive.innerHTML = `
                  <div class="text-center mt-4">
                    <h5 class="text-muted">No orders yet ✨</h5>
                  </div>`;
            }
            return;
        }

        let i = ((response.currentPage - 1) * 6 + 1)
        orderData.forEach(element => {
            const createdDate = new Date(element.createdOn).toLocaleDateString();
            const returnDot =
                element.status === 'returnRequested' ||
                    (element.orderedItems || []).some(v => v.status === 'returnRequested')
                    ? '<span class="notification-dot"></span>'
                    : '';

            tbody.innerHTML += `
      <tr class="order-row">
        <td>${i++}</td>
        <td>${createdDate}</td>
        <td>${element.userId?.username || 'N/A'}</td>
        <td>${element.orderedItems?.length || 0}</td>
        <td>${element.totalPrice}</td>
        <td>
          <span id="orderStatus${element.orderId}" class="badge badge-shipped">
            ${element.status}
          </span>
        </td>
        <td><span class="badge bg-success">${element.paymentStatus}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-outline-primary"
              onclick="openStatusModal('${element.orderId}','${element.status}')">
              <i class="fas fa-edit"></i>
            </button>
            <a href="orderDetails?orderId=${element.orderId}" class="btn btn-sm btn-outline-info">
              <span class="icon-wrapper position-relative">
                ${returnDot}
                <i class="fas fa-eye"></i>
              </span>
            </a>
          </div>
        </td>
      </tr>`;
        });
    }


    function renderPagination(currentPage, totalPage) {
        const container = document.getElementById('paginationContainer');
        if (!container) return;
        container.innerHTML = '';

        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.id = 'prevBtn';
            prevBtn.className = 'page-btn prev';
            prevBtn.innerHTML = '&laquo;';
            container.appendChild(prevBtn);
        }

        const currentBtn = document.createElement('button');
        currentBtn.id = 'currentPage';
        currentBtn.className = 'page-btn active';
        currentBtn.textContent = currentPage;
        container.appendChild(currentBtn);

        if (currentPage < totalPage) {
            const nextBtn = document.createElement('button');
            nextBtn.id = 'nextBtn';
            nextBtn.className = 'page-btn next';
            nextBtn.innerHTML = '&raquo;';
            container.appendChild(nextBtn);
        }

        // 🔥 reattach listeners here
        attachPaginationEvents();
    }

    function attachPaginationEvents() {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', async (e) => {
                const curPageEl = document.getElementById('currentPage');
                const curPage = curPageEl ? parseInt(curPageEl.textContent) : 1;
                const response = await apiReq(`/admin/orderManagement?page=${curPage + 1}`)
                if (response) {
                    renderOrdersTable(response)
                    renderPagination(response.currentPage, response.totalPage)
                }
            })
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', async (e) => {
                const curPageEl = document.getElementById('currentPage');
                const curPage = curPageEl ? parseInt(curPageEl.textContent) : 1;
                const response = await apiReq(`/admin/orderManagement?page=${curPage - 1}`)
                if (response) {
                    renderOrdersTable(response)
                    renderPagination(response.currentPage, response.totalPage)
                }
            })
        }
    }
});
