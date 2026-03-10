          
async function addToWishList(productId) {
    try {
        const response = await fetch(`/addToWishList?productId=${encodeURIComponent(productId)}`, {
            headers: {
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        const result = await response.json();

        if(result.redirect){
            window.location.href='/login'
            return
        }

        if (response.ok) {
            Toastify({
                text: result.message || "Product added to wishlist!",
                duration: 3000,
                gravity: "top",
                position: "left",
                backgroundColor: "#2E8B57",
                stopOnFocus: true
            }).showToast();
        } else {
            Toastify({
                text: result.message || "Could not add to wishlist. Please try again.",
                duration: 3000,
                gravity: "top",
                position: "left",
                backgroundColor: "#E53935",
                stopOnFocus: true
            }).showToast();
        }
    } catch (error) {
        Toastify({
            text: "Something went wrong. Please try again later!",
            duration: 3000,
            gravity: "top",
            position: "left",
            backgroundColor: "#E53935",
            stopOnFocus: true
        }).showToast();
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Product variant selection elements
    const sizeOptions = document.querySelectorAll('.size-option');
    const currentPriceElement = document.querySelector('.current-price');
    const originalPriceElement = document.querySelector('.original-price');
    const discountElement = document.querySelector('.discount');
    const stockElement = document.querySelector('.stock');
    const addToCartBtn = document.querySelector('.add-to-cart');

    // Slider and zoom elements
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    const lensToggleBtn = document.querySelector('.lens-toggle');
    const sliderContainer = document.querySelector('.slider-container');
    const zoomIndicator = document.querySelector('.zoom-indicator');

    // Enhanced Zoom Overlay elements
    const zoomOverlay = document.querySelector('.zoom-overlay');
    const zoomedImage = document.querySelector('.zoomed-image');
    const overlayCloseBtn = document.querySelector('.zoom-overlay-close');
    const prevOverlayBtn = document.querySelector('.prev-overlay-btn');
    const nextOverlayBtn = document.querySelector('.next-overlay-btn');
    const zoomLevelIndicator = document.querySelector('.zoom-level-indicator');

    // Lens zoom elements
    const lensZoom = document.querySelector('.lens-zoom');
    const lensImage = document.querySelector('.lens-image');

    let currentIndex = 0;
    let zoomLevel = 1;
    const maxZoom = 5;
    const minZoom = 1;
    const slideCount = slides.length;
    let isLensActive = false;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;

    // Initialize slider
    function updateSlider() {
        if (!slider) return;
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentIndex);
        });
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === slideCount - 1;
        resetZoom();
    }

    // Basic Zoom functionality
    function updateZoom() {
        slides[currentIndex].style.transform = `scale(${zoomLevel})`;
        sliderContainer.style.cursor = zoomLevel > 1 ? 'zoom-out' : 'zoom-in';
        zoomInBtn.disabled = zoomLevel >= maxZoom;
        zoomOutBtn.disabled = zoomLevel <= minZoom;
        zoomIndicator.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    function resetZoom() {
        zoomLevel = 1;
        updateZoom();
    }

    // Enhanced Overlay Zoom functionality
    function updateOverlayZoom() {
        zoomedImage.style.transform = `scale(${zoomLevel})`;
        zoomLevelIndicator.textContent = `${Math.round(zoomLevel * 100)}%`;

        // Reset position when zooming out
        if (zoomLevel <= 1) {
            translateX = 0;
            translateY = 0;
            zoomedImage.style.transform = `scale(${zoomLevel}) translate(0px, 0px)`;
        }
    }

    function resetOverlayZoom() {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        zoomedImage.style.transform = `scale(1) translate(0px, 0px)`;
        updateOverlayZoom();
    }

    // Open zoom overlay
    function openZoomOverlay() {
        zoomedImage.src = slides[currentIndex].src;
        zoomedImage.alt = slides[currentIndex].alt;
        resetOverlayZoom();
        zoomOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close zoom overlay
    function closeZoomOverlay() {
        zoomOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        resetOverlayZoom();
    }

    // Lens zoom functionality
    function toggleLensZoom() {
        isLensActive = !isLensActive;
        lensToggleBtn.style.backgroundColor = isLensActive ? 'rgba(46, 139, 87, 0.8)' : 'rgba(0, 0, 0, 0.5)';

        if (isLensActive) {
            lensImage.src = slides[currentIndex].src;
            lensZoom.classList.add('active');
            sliderContainer.style.cursor = 'none';
        } else {
            lensZoom.classList.remove('active');
            sliderContainer.style.cursor = 'zoom-in';
        }
    }

    function updateLensPosition(e) {
        if (!isLensActive) return;

        const rect = sliderContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Position lens
        const lensSize = lensZoom.offsetWidth;
        const lensHalf = lensSize / 2;

        let lensX = x - lensHalf;
        let lensY = y - lensHalf;

        // Keep lens within container bounds
        lensX = Math.max(0, Math.min(lensX, rect.width - lensSize));
        lensY = Math.max(0, Math.min(lensY, rect.height - lensSize));

        lensZoom.style.left = `${lensX}px`;
        lensZoom.style.top = `${lensY}px`;

        // Calculate background position for zoom effect
        const bgX = (x / rect.width) * 100;
        const bgY = (y / rect.height) * 100;

        lensImage.style.left = `-${x * 2 - lensHalf}px`;
        lensImage.style.top = `-${y * 2 - lensHalf}px`;
    }

    // Mouse wheel zoom for overlay
    function handleWheelZoom(e) {
        if (!zoomOverlay.classList.contains('active')) return;

        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newZoomLevel = Math.min(Math.max(zoomLevel + delta, minZoom), maxZoom);

        if (newZoomLevel !== zoomLevel) {
            zoomLevel = newZoomLevel;
            updateOverlayZoom();
        }
    }

    // Touch and drag for overlay
    function startDrag(e) {
        if (zoomLevel <= 1) return;

        isDragging = true;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        startX = clientX - translateX;
        startY = clientY - translateY;

        zoomedImage.style.cursor = 'grabbing';
    }

    function doDrag(e) {
        if (!isDragging) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        translateX = clientX - startX;
        translateY = clientY - startY;

        // Limit dragging based on zoom level
        const maxTranslate = (zoomLevel - 1) * 50;
        translateX = Math.min(Math.max(translateX, -maxTranslate), maxTranslate);
        translateY = Math.min(Math.max(translateY, -maxTranslate), maxTranslate);

        zoomedImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
    }

    function endDrag() {
        isDragging = false;
        zoomedImage.style.cursor = 'grab';
    }

    // Event listeners
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            currentIndex = parseInt(thumb.getAttribute('data-index'));
            updateSlider();
            if (isLensActive) {
                lensImage.src = slides[currentIndex].src;
            }
        });
    });

    prevBtn?.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
            if (isLensActive) {
                lensImage.src = slides[currentIndex].src;
            }
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (currentIndex < slideCount - 1) {
            currentIndex++;
            updateSlider();
            if (isLensActive) {
                lensImage.src = slides[currentIndex].src;
            }
        }
    });

    // Zoom controls
    zoomInBtn?.addEventListener('click', () => {
        if (zoomLevel < maxZoom) {
            zoomLevel += 0.2;
            updateZoom();
        }
    });

    zoomOutBtn?.addEventListener('click', () => {
        if (zoomLevel > minZoom) {
            zoomLevel -= 0.2;
            updateZoom();
        }
    });

    // Lens toggle
    lensToggleBtn?.addEventListener('click', toggleLensZoom);

    // Click to open zoom overlay
    sliderContainer?.addEventListener('click', (e) => {
        if (!isLensActive && e.target.classList.contains('main-image')) {
            openZoomOverlay();
        }
    });

    // Mouse move for lens zoom
    sliderContainer?.addEventListener('mousemove', updateLensPosition);

    // Overlay navigation
    prevOverlayBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
            openZoomOverlay();
        }
    });

    nextOverlayBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex < slideCount - 1) {
            currentIndex++;
            updateSlider();
            openZoomOverlay();
        }
    });

    // Close overlay
    overlayCloseBtn?.addEventListener('click', closeZoomOverlay);
    zoomOverlay?.addEventListener('click', closeZoomOverlay);
    zoomedImage?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Enhanced Overlay event listeners
    zoomedImage?.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);

    zoomedImage?.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('touchend', endDrag);

    zoomOverlay?.addEventListener('wheel', handleWheelZoom, { passive: false });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (zoomOverlay.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeZoomOverlay();
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
                updateSlider();
                openZoomOverlay();
            } else if (e.key === 'ArrowRight' && currentIndex < slideCount - 1) {
                currentIndex++;
                updateSlider();
                openZoomOverlay();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                if (zoomLevel < maxZoom) {
                    zoomLevel += 0.2;
                    updateOverlayZoom();
                }
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                if (zoomLevel > minZoom) {
                    zoomLevel -= 0.2;
                    updateOverlayZoom();
                }
            } else if (e.key === '0') {
                e.preventDefault();
                resetOverlayZoom();
            }
        }
    });

    // Auto-rotate slides
    if (slideCount > 1) {
        let intervalId = setInterval(() => {
            currentIndex = currentIndex < slideCount - 1 ? currentIndex + 1 : 0;
            updateSlider();
            if (isLensActive) {
                lensImage.src = slides[currentIndex].src;
            }
        }, 5000);

        // Pause auto-rotation on hover
        sliderContainer?.addEventListener('mouseenter', () => clearInterval(intervalId));
        sliderContainer?.addEventListener('mouseleave', () => {
            intervalId = setInterval(() => {
                currentIndex = currentIndex < slideCount - 1 ? currentIndex + 1 : 0;
                updateSlider();
                if (isLensActive) {
                    lensImage.src = slides[currentIndex].src;
                }
            }, 5000);
        });
    }

    // Price and stock update function
    function updatePriceAndStock(option) {
        const price = parseFloat(option.getAttribute('data-price'));
        const salePrice = parseFloat(option.getAttribute('data-sale-price'));
        const quantity = parseInt(option.getAttribute('data-quantity'));
        const size = option.getAttribute('data-size');

        // Update price display
        if (!isNaN(salePrice)) {
            currentPriceElement.textContent = `₹${salePrice.toFixed(2)}`;
        } else {
            currentPriceElement.textContent = 'Price Unavailable';
        }

        // Update original price and discount
        if (!isNaN(price)) {
            if (price > salePrice) {
                originalPriceElement.textContent = `₹${price.toFixed(2)}`;
                const discountPercent = Math.round(((price - salePrice) / price) * 100)
                discountElement.textContent = `${discountPercent}% OFF`;
                originalPriceElement.style.display = 'inline';
                discountElement.style.display = 'inline';
            } else {
                originalPriceElement.style.display = 'none';
                discountElement.style.display = 'none';
            }
        }

        // Update stock display
        let stockText = 'Availability: ';
        if (!isNaN(quantity)) {
            if (quantity > 10) {
                stockElement.innerHTML = `${stockText}<span class="in-stock">In Stock</span>`;
            } else if (quantity > 0) {
                stockElement.innerHTML = `${stockText}<span class="low-stock">Low Stock (Only ${quantity} left)</span>`;
            } else {
                stockElement.innerHTML = `${stockText}<span class="out-of-stock">Out of Stock</span>`;
            }
        } else {
            stockElement.innerHTML = `${stockText}<span class="out-of-stock">Stock Information Unavailable</span>`;
        }

        // Update add to cart button
        const isBlocked = addToCartBtn.dataset.blocked === 'true';
        
        if (isBlocked) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Currently Unavailable';
        } else {
            addToCartBtn.disabled = !quantity || quantity === 0;
            addToCartBtn.textContent = (!quantity || quantity === 0) ? 'Out of Stock' : 'Add to Cart';
        }
    }

    // Size selection handler
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            updatePriceAndStock(option);
        });
    });


    addToCartBtn?.addEventListener('click', async function () {
        try {
            
            const productId = this.dataset.productId;
            const selectedElement = document.querySelector('.size-option.selected');

            if (!selectedElement) {
                Toastify({
                    text: "Please select a size before adding to cart!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#FFA000",
                    stopOnFocus: true
                }).showToast();
                return;
            }

            const selectedSize = selectedElement.dataset.size;
            const price = parseFloat(
                selectedElement.dataset.salePrice || selectedElement.dataset.price
            );

            const response = await fetch(
                `/addProductToCart?productId=${encodeURIComponent(productId)}&selectedSize=${encodeURIComponent(selectedSize)}&price=${price}`,
                {
                    headers: {
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    }
                }
            );


            if (response.status === 401) {
                const data = await response.json();
                window.location.href = data.redirect
                return;
            }

            const data = await response.json();

            if (response.ok) {
                Toastify({
                    text: data.message || "Product added to cart!",
                    duration: 3000,
                    gravity: "top",
                    position: "left",
                    backgroundColor: "#2E8B57",
                    stopOnFocus: true
                }).showToast();

                if (!data.exists) {
                    document.querySelectorAll('.cart-count').forEach(cartCount => {
                        let count = parseInt(cartCount.textContent) || 0;
                        cartCount.textContent = count + 1;
                    });
                }
            } else {
                Toastify({
                    text: data.message || "Failed to add to cart.",
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


 

    // Initialize default size selection
    const defaultSelected = document.querySelector('.size-option.selected');
    if (defaultSelected) {
        updatePriceAndStock(defaultSelected);
    } else if (sizeOptions.length > 0) {
        sizeOptions[0].classList.add('selected');
        updatePriceAndStock(sizeOptions[0]);
    } else {
        currentPriceElement.textContent = 'Price Unavailable';
        originalPriceElement.style.display = 'none';
        discountElement.style.display = 'none';
        stockElement.innerHTML = 'Availability: <span class="out-of-stock">Size Information Unavailable</span>';
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Out of Stock';
    }
});
