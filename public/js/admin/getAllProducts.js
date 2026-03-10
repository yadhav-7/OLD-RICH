
const addNewProduct = document.getElementById('addNewProduct');
addNewProduct?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = '/admin/addProduct';
});

// DOM Elements
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-button');
const productsTableBody = document.getElementById('productsTableBody');
const productsCardContainer = document.getElementById('productsCardContainer');

// Show variant modal
async function showVariantModal(productId, productName) {
  try {
    const modal = document.getElementById('variantModal');
    const modalTitle = document.getElementById('variantModalTitle');
    const tableBody = document.getElementById('variantTableBody');

    if (modalTitle) modalTitle.textContent = `${productName} Variants`;
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" class="variant-empty-state">Loading variants...</td></tr>';
    if (modal) modal.style.display = 'flex';

    const response = await fetch('/admin/productVarintsModal', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ id: productId })
    });

    const result = await response.json();
    if (response.ok && Array.isArray(result.data)) {
      if (result.data.length > 0) {
        let rows = '';
        result.data.forEach(variant => {
          rows += `
                <tr>
                  <td>${variant.size || '-'}</td>
                  <td>₹${variant.salePrice || '0.00'}</td>
                  <td>${variant.quantity || '0'}</td>
                  <td>${variant.sku || '-'}</td>
                </tr>
              `;
        });
        if (tableBody) tableBody.innerHTML = rows;
      } else {
        if (tableBody) tableBody.innerHTML = `
              <tr>
                <td colspan="5" class="variant-empty-state">
                  <i class="fas fa-box-open"></i>
                  <p>No variants found for this product</p>
                </td>
              </tr>
            `;
      }
    } else {
      throw new Error('Failed to load variants');
    }
  } catch (err) {
    console.error('Error loading variants:', err);
    const tableBody = document.getElementById('variantTableBody');
    if (tableBody) tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="variant-error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Error loading variants. Please try again.</p>
            </td>
          </tr>
        `;
  }
}

// Close variant modal
function closeVariantModal() {
  const modal = document.getElementById('variantModal');
  if (modal) modal.style.display = 'none';
}

// Add offer
async function addOffer(productId) {
  const { value: amount } = await Swal.fire({
    title: 'Add Product Offer',
    input: 'number',
    inputLabel: 'Enter offer percentage',
    inputPlaceholder: '10',
    inputAttributes: { min: '1', max: '100' },
    showCancelButton: true,
    confirmButtonText: 'Add Offer',
    cancelButtonText: 'Cancel',
    inputValidator: (value) => {
      if (!value) return 'Please enter a value';
      if (value < 1 || value > 100) return 'Please enter a value between 1 and 100';
    }
  });

  if (!amount) return; // user cancelled or invalid input

  try {
    const response = await fetch('/admin/addProductOffer', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ productId, percentage: amount })
    });

    const result = await response.json();

    console.log('result', result)

    if (response.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Offer Added',
        text: `Successfully added ${amount}% offer to the product`,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      });

      // 🔄 Reload only after success popup finishes
      window.location.reload();
    } else {
      throw new Error(result.message || 'Failed to add offer');
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed',
      text: err.message || 'Something went wrong'
    });
  }
}

// Remove offer
async function removeOffer(productId) {
  const { isConfirmed } = await Swal.fire({
    title: 'Remove Offer?',
    text: 'Are you sure you want to remove this offer?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, remove it',
    cancelButtonText: 'Cancel'
  });

  if (isConfirmed) {
    try {
      const response = await fetch('/admin/removeProductOffer', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Offer Removed',
          text: 'Product offer has been removed',
          timer: 2000,
          showConfirmButton: false
        }).then(() => location.reload());
      } else {
        throw new Error(result.message || 'Failed to remove offer');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err.message || 'Something went wrong'
      });
    }
  }
}

// BLOCK PRODUCT
async function blockProduct(productId, productName) {
  const { isConfirmed } = await Swal.fire({
    title: 'Block Product',
    html: `You are about to block <strong>${productName}</strong>. This product will no longer be visible to customers.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, block it',
    cancelButtonText: 'Cancel'
  });

  if (isConfirmed) {
    try {
      const response = await fetch('/admin/blockProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, productName })
      });

      const result = await response.json();

      if (response.ok) {
        // Update table view
        const btn = document.querySelector(`#btn-${productId}`);
        if (btn) {
          btn.classList.remove('block');
          btn.classList.add('unblock');
          btn.innerHTML = `
                <i class="fas fa-unlock"></i>
                <span>Unblock</span>
              `;
          btn.setAttribute('onclick', `unblockProduct('${productId}', '${productName}')`);
        }

        // Update card view
        const cardBtn = document.querySelector(`#btn-card-${productId}`);
        if (cardBtn) {
          cardBtn.classList.remove('block');
          cardBtn.classList.add('unblock');
          cardBtn.innerHTML = `
                <i class="fas fa-unlock"></i>
                <span>Unblock</span>
              `;
          cardBtn.setAttribute('onclick', `unblockProduct('${productId}', '${productName}')`);
        }

        // Update status in table view
        const status = document.querySelector(`#status-${productId}`);
        if (status) {
          status.classList.remove('status-active');
          status.classList.add('status-blocked');
          status.textContent = 'Blocked';
        }

        // Update status in card view
        const cardStatus = document.querySelector(`#status-card-${productId}`);
        if (cardStatus) {
          cardStatus.classList.remove('status-active');
          cardStatus.classList.add('status-blocked');
          cardStatus.textContent = 'Blocked';
        }

        await Swal.fire({
          icon: 'success',
          title: 'Blocked!',
          text: 'Product has been blocked successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(result.message || 'Failed to block product');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Something went wrong!'
      });
    }
  }
}

// UNBLOCK PRODUCT
async function unblockProduct(productId, productName) {
  const { isConfirmed } = await Swal.fire({
    title: 'Unblock Product',
    html: `You are about to unblock <strong>${productName}</strong>. This product will become visible to customers again.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    confirmButtonText: 'Yes, unblock it',
    cancelButtonText: 'Cancel'
  });

  if (isConfirmed) {
    try {
      const response = await fetch('/admin/unblockProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, productName })
      });

      const result = await response.json();

      if (response.ok) {
        // Update table view
        const btn = document.querySelector(`#btn-${productId}`);
        if (btn) {
          btn.classList.remove('unblock');
          btn.classList.add('block');
          btn.innerHTML = `
                <i class="fas fa-ban"></i>
                <span>Block</span>
              `;
          btn.setAttribute('onclick', `blockProduct('${productId}', '${productName}')`);
        }

        // Update card view
        const cardBtn = document.querySelector(`#btn-card-${productId}`);
        if (cardBtn) {
          cardBtn.classList.remove('unblock');
          cardBtn.classList.add('block');
          cardBtn.innerHTML = `
                <i class="fas fa-ban"></i>
                <span>Block</span>
              `;
          cardBtn.setAttribute('onclick', `blockProduct('${productId}', '${productName}')`);
        }

        // Update status in table view
        const status = document.querySelector(`#status-${productId}`);
        if (status) {
          status.classList.remove('status-blocked');
          status.classList.add('status-active');
          status.textContent = 'Active';
        }

        // Update status in card view
        const cardStatus = document.querySelector(`#status-card-${productId}`);
        if (cardStatus) {
          cardStatus.classList.remove('status-blocked');
          cardStatus.classList.add('status-active');
          cardStatus.textContent = 'Active';
        }

        await Swal.fire({
          icon: 'success',
          title: 'Unblocked!',
          text: 'Product has been unblocked successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(result.message || 'Failed to unblock product');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Something went wrong!'
      });
    }
  }
}

async function searchAndrender(search) {
  const response = await fetch(`/admin/allProducts?search=${encodeURIComponent(search)}`, {
    headers: {
      'Accept': 'application/json'
    }
  })

  const result = await response.json();
  const product = result.data;
  const currentPage = result.currentPage
  const totalPages = result.totalPages

  // Calculate total quantity
  product.forEach(p => {
    p.totalQuantity = p.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
  });

  if (response.ok) {
    if (product.length > 0) {
      // Update table view
      productsTableBody.innerHTML = ''
      for (let i = 0; i < product.length; i++) {
        productsTableBody.innerHTML += `
              <tr>
                <td><strong>${product[i].productName}</strong></td>
                <td>${product[i].category.name}</td>
                <td>
                  ${product[i].isBlocked
            ? '<span class="status-badge status-blocked">Blocked</span>'
            : '<span class="status-badge status-active">Active</span>'
          }
                </td>
                <td>
                  ${product[i].productOffer > 0
            ? `<span class="offer-badge">${product[i].productOffer}% OFF</span>`
            : '<span>-</span>'
          }
                </td>
                <td>${product[i].totalQuantity || 0}</td>
                <td>
                  <div class="action-buttons">
                    ${product[i].productOffer < 1
            ? `<button class="action-btn add-offer" onclick="addOffer('${product[i]._id}')">
                          <i class="fas fa-tag"></i><span>Add Offer</span>
                        </button>`
            : `<button class="action-btn remove-offer" onclick="removeOffer('${product[i]._id}')">
                          <i class="fas fa-tag"></i><span>Remove Offer</span>
                        </button>`
          }

                    ${product[i].isBlocked
            ? `<button class="action-btn unblock" onclick="unblockProduct('${product[i]._id}', '${product[i].productName}')">
                          <i class="fas fa-unlock"></i><span>Unblock</span>
                        </button>`
            : `<button class="action-btn block" onclick="blockProduct('${product[i]._id}', '${product[i].productName}')">
                          <i class="fas fa-ban"></i><span>Block</span>
                        </button>`
          }

                    <a href="/admin/editProduct?id=${product[i]._id}" class="action-btn edit">
                      <i class="fas fa-edit"></i><span>Edit</span>
                    </a>

                    <button class="action-btn view-variants" onclick="showVariantModal('${product[i]._id}', '${product[i].productName}')">
                      <i class="fas fa-boxes"></i><span>Variants</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
      }

      // Update card view
      productsCardContainer.innerHTML = '';
      for (let i = 0; i < product.length; i++) {
        productsCardContainer.innerHTML += `
              <div class="product-card">
                <div class="product-card-header">
                  <div class="product-name">${product[i].productName}</div>
                  <div>
                    ${product[i].isBlocked
            ? '<span class="status-badge status-blocked">Blocked</span>'
            : '<span class="status-badge status-active">Active</span>'
          }
                  </div>
                </div>
                <div class="product-category">${product[i].category.name}</div>
                <div class="product-details">
                  <div class="product-detail-item">
                    <span class="detail-label">Offer</span>
                    <span class="detail-value">
                      ${product[i].productOffer > 0
            ? `<span class="offer-badge">${product[i].productOffer}% OFF</span>`
            : '<span>-</span>'
          }
                    </span>
                  </div>
                  <div class="product-detail-item">
                    <span class="detail-label">Stock</span>
                    <span class="detail-value">${product[i].totalQuantity || 0}</span>
                  </div>
                </div>
                <div class="product-actions">
                  ${product[i].productOffer < 1
            ? `<button class="card-action-btn add-offer" onclick="addOffer('${product[i]._id}')">
                        <i class="fas fa-tag"></i><span>Add Offer</span>
                      </button>`
            : `<button class="card-action-btn remove-offer" onclick="removeOffer('${product[i]._id}')">
                        <i class="fas fa-tag"></i><span>Remove Offer</span>
                      </button>`
          }

                  ${product[i].isBlocked
            ? `<button class="card-action-btn unblock" onclick="unblockProduct('${product[i]._id}', '${product[i].productName}')">
                        <i class="fas fa-unlock"></i><span>Unblock</span>
                      </button>`
            : `<button class="card-action-btn block" onclick="blockProduct('${product[i]._id}', '${product[i].productName}')">
                        <i class="fas fa-ban"></i><span>Block</span>
                      </button>`
          }

                  <a href="/admin/editProduct?id=${product[i]._id}" class="card-action-btn edit">
                    <i class="fas fa-edit"></i><span>Edit</span>
                  </a>

                  <button class="card-action-btn view-variants" onclick="showVariantModal('${product[i]._id}', '${product[i].productName}')">
                    <i class="fas fa-boxes"></i><span>Variants</span>
                  </button>
                </div>
              </div>
            `;
      }
    } else {
      productsTableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 20px; color: #888;">
                <i class="fas fa-box-open" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                No products found.
              </td>
            </tr>
          `;
      productsCardContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-box-open"></i>
              <p>No products found</p>
            </div>
          `;
    }
  } else {
    alert('no data')
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  searchInput?.addEventListener('keyup', function () {
    const search = searchInput.value
    searchAndrender(search)
  })

  // Clear search
  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    searchAndrender('')
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      document.body.style.display = "none";
      window.location.reload();
    }
  });

  const successMsg = localStorage.getItem('success');
  if (successMsg) {
    if (typeof Toastify !== 'undefined') {
      Toastify({
        text: successMsg,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)"
      }).showToast();
    }

    setTimeout(() => {
      localStorage.removeItem('success');
    }, 1000);
  }
});
