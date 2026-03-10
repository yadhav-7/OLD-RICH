
document.addEventListener('DOMContentLoaded', function () {
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');

    if (filterToggle && filterSidebar) {
        filterToggle.addEventListener('click', function () {
            filterSidebar.classList.toggle('active');
            filterOverlay.classList.toggle('active');
        });

        filterOverlay.addEventListener('click', function () {
            filterSidebar.classList.remove('active');
            filterOverlay.classList.remove('active');
        });
    }

    // Set initial sort value
    const urlParams = new URLSearchParams(window.location.search);
    const sortValue = urlParams.get('sort');
    if (sortValue) {
        document.querySelector('select[name="sort"]').value = sortValue;
    }
});


async function toggleWishlist(button, action) {
    const productId = button.getAttribute('data-product-id');

    try {
        if (action === 'addToWishList') {
            const response = await fetch(`/addToWishList?productId=${encodeURIComponent(productId)}`, {
                headers: {
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
            const body = await response.json();

            if (body.redirect) {
                window.location.href = '/login'
                return
            }
            if (response.ok) {
                button.classList.add('active');
                button.innerHTML = '❤️';

                Toastify({
                    text: "Added to Wishlist",
                    duration: 2000,
                    gravity: "top",
                    position: "left",
                    backgroundColor: "#277038",
                    stopOnFocus: true
                }).showToast();

                button.setAttribute("onclick", `toggleWishlist(this, 'removeWishList')`);
            } else {
                throw new Error(body.message || 'Could not add to wishlist. Please try again.');
            }
        } else {
            const response = await fetch(`/removeProductFromWishlist?productId=${encodeURIComponent(productId)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const body = await response.json();

            if (response.ok) {
                button.classList.remove('active');
                button.innerHTML = '<i class="fa-solid fa-heart"></i>'

                Toastify({
                    text: "Item removed from wishlist",
                    duration: 2000,
                    gravity: "top",
                    position: "left",
                    backgroundColor: "#277038",
                    stopOnFocus: true
                }).showToast();

                button.setAttribute("onclick", `toggleWishlist(this, 'addToWishList')`);
            } else {
                throw new Error(body.message || 'Failed to remove item');
            }
        }
    } catch (error) {
        Toastify({
            text: error.message || "Something went wrong",
            duration: 3000,
            gravity: "top",
            position: "left",
            backgroundColor: "#e74c3c",
            stopOnFocus: true
        }).showToast();
        console.error('Error:', error);
    }
}


function getCurrentPage() {
    // Try by ID first (initial load)
    let el = document.getElementById('current-page');
    // Fallback to class selector if ID missing (though we fixed it below)
    if (!el) el = document.querySelector('.pagination .active .page-link');

    return el ? parseInt(el.textContent.trim()) : 1;
}

document.getElementById('clearSearch').addEventListener('click', async function (e) {
    e.preventDefault()

    const params = new URLSearchParams(window.location.search)

    const categoryFilter = [...document.querySelectorAll('input[name="category"]:checked')].map((cb) => cb.value)

    if (categoryFilter.length > 0) {
        params.set('category', categoryFilter.join(','))
    } else {
        params.delete('category')
    }

    const sort = document.querySelector('select[name="sort"]').value;

    if (sort) {
        params.set('sort', sort)
    } else {
        params.delete('sort')
    }

    const price = [...document.querySelectorAll('input[name="priceFilter"]')]
        .filter(cb => cb.checked)
        .map(cb => cb.value)

    if (price.length > 0) {
        params.set('priceFilter', price.join(','))
    } else {
        params.delete('priceFilter')
    }



    params.set('query', '')

    const basePath = '/shop'
    const currentPage = getCurrentPage();
    params.set('page', currentPage);

    const response = await apiReq(`${basePath}?${params.toString()}`)

    // Update URL
    window.history.pushState({}, '', `?${params.toString()}`);

    document.getElementById('search-input').value = ''

    if (response?.products) {
        updateProductGrid(response.products)
        updatePagination(response.currentPage, response.totalPages)
    } else if (response?.data?.products) {
        updateProductGrid(response.data.products)
        updatePagination(response.currentPage, response.totalPages)
    } else {
        console.error('Products not found in response:', response)
    }
})
document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault()
    searchAndSortFilter(true)
})


const searchInput = document.getElementById('search-input');

document.getElementById('clearFilter').addEventListener('click', async function (e) {
    e.preventDefault()

    const filterForm = document.getElementById('filterForm')
    const params = new URLSearchParams(window.location.search)
    const search = document.getElementById("search-input")?.value.trim()

    if (search) {
        params.set('query', search)
    } else {
        params.delete('query')
    }

    params.delete('category')
    params.delete('sort')
    params.delete('priceFilter')

    const currentPage = getCurrentPage();
    params.set('page', currentPage);

    const basePath = '/shop'
    const response = await apiReq(`${basePath}?${params.toString()}`)

    // Update URL
    window.history.pushState({}, '', `?${params.toString()}`);


    document.querySelectorAll('.categoryFilter, .priceFilter').forEach(cb => {
        cb.checked = false
    })


    const sortSelect = filterForm.querySelector('select[name="sort"]')
    if (sortSelect) sortSelect.value = ''

    if (response?.products) {
        updateProductGrid(response.products)
        updatePagination(response.currentPage, response.totalPages)
    } else if (response?.data?.products) {
        updateProductGrid(response.data.products)
        updatePagination(response.currentPage, response.totalPages)
    } else {
        console.error('Products not found in response:', response)
    }
})


document.getElementById('filterForm').addEventListener('submit', function (e) {
    e.preventDefault()
    searchAndSortFilter(false)
})


async function searchAndSortFilter(resetPage = true) {
    try {
        const params = new URLSearchParams(window.location.search)

        const categoryFilter = [...document.querySelectorAll('input[name="category"]:checked')].map((cb) => cb.value)
        if (categoryFilter.length > 0) {
            params.set('category', categoryFilter.join(','))
        } else {
            params.delete('category')
        }

        const sort = document.querySelector('select[name="sort"]').value;
        if (sort) {
            params.set('sort', sort)
        } else {
            params.delete('sort')
        }

        const price = [...document.querySelectorAll('input[name="priceFilter"]')]
            .filter(cb => cb.checked)
            .map(cb => cb.value)

        if (price.length > 0) {
            params.set('priceFilter', price.join(','))
        } else {
            params.delete('priceFilter')
        }

        let search = document.getElementById("search-input").value.trim()
        if (search) {
            params.set('query', search)
        } else {
            params.delete('query')
        }

        if (resetPage) {
            params.set('page', 1)
        } else {
            const page = getCurrentPage();
            params.set('page', page);
        }

        const basePath = '/shop'
        const response = await apiReq(`${basePath}?${params.toString()}`)

        // Update URL
        window.history.pushState({}, '', `?${params.toString()}`);

        // Update wishListArray from response
        if (response.wishListArray) {
            window.wishListArray = response.wishListArray;
        }

        updateProductGrid(response.products)
        updatePagination(response.currentPage, response.totalPages)
    } catch (error) {
        console.error('error in searchAndSortFilter', error)
    }
}

function updateProductGrid(products = []) {
    const gridContainer = document.querySelector('.col-md-9 .row')

    if (!gridContainer) return;

    if (products.length === 0) {
        gridContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#ccc" viewBox="0 0 16 16">
          <path d="M7.354 5.646a.5.5 0 1 0-.708.708L7.793 7.5 6.646 8.646a.5.5 0 1 0 .708.708L8.5 8.207l1.146 1.147a.5.5 0 0 0 .708-.708L9.207 7.5l1.147-1.146a.5.5 0 0 0-.708-.708L8.5 6.793 7.354 5.646z"/>
          <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
        <h3 class="mt-3">No products found</h3>
        <p class="text-muted">Try adjusting your search or filter criteria</p>
      </div>`;
        return;
    }

    const html = products.map(p => {
        // Check if product has wishlist status from server response
        const isInWishlist = p.isInWishlist ||
            (Array.isArray(window.wishListArray) &&
                window.wishListArray.some((item) => item.productId?.toString() === p._id?.toString()));

        const wishlistAction = isInWishlist ? 'removeWishList' : 'addToWishList';
        const wishlistIcon = isInWishlist ? '❤️' : '<i class="fa-solid fa-heart"></i>';
        const wishlistClass = isInWishlist ? 'wishlist-btn active' : 'wishlist-btn';

        return `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <div class="product-card card h-100">
        <button class="${wishlistClass}" onclick="toggleWishlist(this, '${wishlistAction}')"
          data-product-id="${p._id}">${wishlistIcon}</button>
        ${p.discountPercentage > 0 ? `<div class="discount-badge">${p.discountPercentage}% OFF</div>` : ''}
        <a href="/productDetails?productId=${p._id}&slcPrice=${p.displayVariant?.salePrice || 0}" style="text-decoration: none; color: inherit;">
          <img src="${p.productImage[0]}" class="card-img-top" alt="${p.productName}" style="height: 200px; object-fit: cover;" />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title" style="font-size: 16px; min-height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.productName}</h5>
            <div class="mt-auto">
              <div class="mb-2">
                <span class="price-discount">₹${(p.displayVariant?.salePrice || p.variants[0]?.salePrice || 0).toLocaleString('en-IN')}</span>
                ${p.displayVariant?.regularPrice && p.displayVariant.regularPrice > (p.displayVariant?.salePrice || 0) ?
                `<span class="original-price">₹${p.displayVariant.regularPrice.toLocaleString('en-IN')}</span>` :
                p.variants[0]?.regularPrice && p.variants[0].regularPrice > p.variants[0].salePrice ?
                    `<span class="original-price">₹${p.variants[0].regularPrice.toLocaleString('en-IN')}</span>` : ''}
              </div>
            </div>
          </div>
        </a>
        <button class="view-btn mt-2 addToCartBtn"
          data-product-id="${p._id}"
          data-product-name="${p.productName}"
          data-product-variants='${JSON.stringify(p.variants).replace(/'/g, "&#39;")}'>
          Add To Cart
        </button>
      </div>
    </div>
    `;
    }).join('');

    gridContainer.innerHTML = html;

    // Re-attach event listeners to the new Add to Cart buttons
    reattachAddToCartListeners();
}
// Function to re-attach event listeners to Add to Cart buttons
function reattachAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.addToCartBtn');

    addToCartButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const variants = JSON.parse(btn.dataset.productVariants || "[]");
            const productName = btn.dataset.productName;
            const productId = btn.dataset.productId;

            currentProduct = { id: productId, variants };

            // Update popup title
            popupProductName.textContent = `Select Size for ${productName}`;

            // Clear and render size options
            sizeOptions.innerHTML = "";
            variants.forEach((variant, i) => {
                const sizeLabel = variant.size || variant.Size || variant.label || `Size ${i + 1}`;
                const id = `sizeOption${productId}_${i}`;
                sizeOptions.innerHTML += `
          <input type="radio" class="btn-check" name="size" id="${id}" value="${sizeLabel}">
          <label class="btn btn-outline-primary btn-sm" for="${id}">${sizeLabel}</label>
        `;
            });

            // Show the popup
            sizePopup.show();
        });
    });
}


async function pagination(page, action) {
    const params = new URLSearchParams(window.location.search)

    const categoryFilter = [...document.querySelectorAll('input[name="category"]:checked')].map((cb) => cb.value)
    if (categoryFilter.length > 0) {
        params.set('category', categoryFilter.join(','))
    } else {
        params.delete('category')
    }

    const sort = document.querySelector('select[name="sort"]').value;
    if (sort) {
        params.set('sort', sort)
    } else {
        params.delete('sort')
    }

    const price = [...document.querySelectorAll('input[name="priceFilter"]')]
        .filter(cb => cb.checked)
        .map(cb => cb.value)

    if (price.length > 0) {
        params.set('priceFilter', price.join(','))
    } else {
        params.delete('priceFilter')
    }

    let search = document.getElementById("search-input").value.trim()
    if (search) {
        params.set('query', search)
    } else {
        params.delete('query')
    }

    params.set('page', page)
    const response = await apiReq(`/shop?${params.toString()}`)

    // Update URL
    window.history.pushState({}, '', `?${params.toString()}`);

    // Update wishListArray from response if available
    if (response.wishListArray) {
        window.wishListArray = response.wishListArray;
    }

    updatePagination(response.currentPage, response.totalPages)
    updateProductGrid(response.products)
}
const addToCartButtons = document.querySelectorAll('.addToCartBtn');
const sizePopup = new bootstrap.Modal(document.getElementById('sizePopup'));
const sizeOptions = document.getElementById('sizeOptions');
const popupProductName = document.getElementById('popupProductName');
const confirmSizeBtn = document.getElementById('confirmSizeBtn')
const cartCountEl = document.querySelectorAll('.cart-count')

let currentProduct = null;

// When any "Add to Cart" is clicked
addToCartButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const variants = JSON.parse(btn.dataset.productVariants || "[]");
        const productName = btn.dataset.productName;
        const productId = btn.dataset.productId;

        currentProduct = { id: productId, variants };

        // Update popup title
        popupProductName.textContent = `Select Size for ${productName}`;

        // Clear and render size options
        sizeOptions.innerHTML = "";
        variants.forEach((variant, i) => {
            const sizeLabel = variant.size || variant.Size || variant.label || `Size ${i + 1}`;
            const id = `sizeOption${productId}_${i}`;
            sizeOptions.innerHTML += `
        <input type="radio" class="btn-check" name="size" id="${id}" value="${sizeLabel}">
        <label class="btn btn-outline-primary btn-sm" for="${id}">${sizeLabel}</label>
      `;
        });

        // Show the popup
        sizePopup.show();
    });
});

// When user confirms a size
confirmSizeBtn.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="size"]:checked');
    if (!selected) {
        Toastify({
            text: "Please select a size",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#FFA500",
            close: true,
            stopOnFocus: true,
        }).showToast();

        return;
    }

    const selectedSize = selected.value;
    sizePopup.hide();

    const productId = currentProduct.id;

    //const endPoint = `/addProductToCart?productId=${encodeURIComponent(productId)}&selectedSize=${encodeURIComponent(selectedSize)}`;
    const endPoint = `/addProductToCart?productId=${encodeURIComponent(productId)}&selectedSize=${encodeURIComponent(selectedSize)}`
    try {
        let headers = {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
        const response = await apiReq(endPoint, 'GET', null, headers)
        console.log('response', response)
        if (response.success) {
            Toastify({
                text: response.message || "Product added to cart!",
                duration: 3000,
                gravity: "top",
                position: "left",
                backgroundColor: "#2E8B57",
                stopOnFocus: true
            }).showToast();


            if (!response.exists) {
                document.querySelectorAll('.cart-count').forEach(cartCount => {
                    let count = parseInt(cartCount.textContent) || 0;
                    cartCount.textContent = count + 1;
                });
            }
        } else {
            Toastify({
                text: response.message || "Failed to add to cart.",
                duration: 3000,
                gravity: "top",
                position: "left",
                backgroundColor: "#E53935",
                stopOnFocus: true
            }).showToast();
        }
    } catch (error) {
        Toastify({
            text: "Failed to add to cart. Please try again.",
            duration: 3000,
            gravity: "top",
            position: "left",
            backgroundColor: "#E53935",
            stopOnFocus: true
        }).showToast();
        console.error(error);
    }
});


function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    // Clear old pagination
    paginationContainer.innerHTML = ''

    // If there's a previous page
    if (currentPage > 1) {
        const prevLi = document.createElement('li')
        prevLi.className = 'page-item'
        prevLi.innerHTML = `
      <a class="page-link" href="#" onclick="pagination(${currentPage - 1}, 'dec')" aria-label="Previous">
        <span aria-hidden="true">«</span>
      </a>
    `
        paginationContainer.appendChild(prevLi);
    }

    // Current page
    const activeLi = document.createElement('li');
    activeLi.className = 'page-item active';
    activeLi.innerHTML = `
    <span class="page-link" id="current-page">${currentPage}</span>
  `;
    paginationContainer.appendChild(activeLi);

    // If there's a next page
    if (currentPage < totalPages) {
        const nextLi = document.createElement('li');
        nextLi.className = 'page-item';
        nextLi.innerHTML = `
      <a class="page-link" href="#" onclick="pagination(${currentPage + 1}, 'inc')" aria-label="Next">
        <span aria-hidden="true">»</span>
      </a>
    `;
        paginationContainer.appendChild(nextLi);
    }
}
