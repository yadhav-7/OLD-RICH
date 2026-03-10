
// DOM elements
let elements = {};
let cropper;
let currentFile;
let uploadedImages = [];
let existingImages = [];
let filesToProcess = [];

// Configuration constants
const MAX_IMAGES = 5;
const MIN_IMAGES = 0;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function initProductEdit(config) {
    elements = {
        form: document.getElementById('productForm'),
        imageUpload: document.getElementById('imageUpload'),
        uploadArea: document.getElementById('uploadArea'),
        addedImagesContainer: document.getElementById('addedImagesContainer'),
        existingImagesInput: document.getElementById('existingImagesInput'),
        mainImageInput: document.getElementById('mainImageInput'),
        cropperImage: document.getElementById('cropperImage'),
        saveCroppedBtn: document.getElementById('saveCroppedImage'),
        imagesError: document.getElementById('images-error'),
        productNameError: document.getElementById('productName-error'),
        descriptionError: document.getElementById('description-error'),
        categoryError: document.getElementById('category-error'),
        colorError: document.getElementById('color-error'),
        updateBtn: document.getElementById('updateBtn'),
        updateBtnText: document.getElementById('updateBtnText'),
        updateBtnLoader: document.getElementById('updateBtnLoader'),
        productId: config.productId
    };

    // Initialize existing images from thumbnails
    document.querySelectorAll('.thumbnail[data-type="existing"]').forEach(thumb => {
        const imageName = thumb.dataset.name;
        if (imageName) existingImages.push(imageName);
    });

    // Event listeners
    elements.uploadArea?.addEventListener('drop', handleImageSelection);
    elements.uploadArea?.addEventListener('click', () => elements.imageUpload?.click());
    elements.imageUpload?.addEventListener('change', handleImageSelection);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea?.addEventListener(eventName, e => e.preventDefault());
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        elements.uploadArea?.addEventListener(eventName, () => {
            elements.uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea?.addEventListener(eventName, () => {
            elements.uploadArea.classList.remove('dragover');
        });
    });

    document.getElementById('cropperModal')?.addEventListener('shown.bs.modal', function () {
        if (cropper) cropper.destroy();
        if (typeof Cropper !== 'undefined' && elements.cropperImage) {
            cropper = new Cropper(elements.cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                guides: false
            });
        }
    });

    document.getElementById('cropperModal')?.addEventListener('hidden.bs.modal', function () {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        // Process next file in queue
        if (filesToProcess.length > 0) {
            filesToProcess.shift();
            processNextFile();
        }
    });

    document.querySelectorAll('.aspect-ratio-buttons button').forEach(btn => {
        btn.addEventListener('click', function () {
            if (!cropper) return;
            const ratio = this.dataset.ratio === 'free' ? NaN : parseFloat(this.dataset.ratio);
            cropper.setAspectRatio(ratio);
        });
    });

    elements.saveCroppedBtn?.addEventListener('click', function () {
        if (!cropper) return;

        cropper.getCroppedCanvas({
            width: 800,
            height: 800,
            fillColor: '#fff',
            imageSmoothingQuality: 'high'
        }).toBlob(blob => {
            const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
            const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

            const imageObj = {
                type: 'new',
                file: croppedFile,
                url: URL.createObjectURL(blob),
                isMain: existingImages.length + uploadedImages.length === 0
            };

            uploadedImages.push(imageObj);
            createThumbnail(imageObj);

            if (typeof bootstrap !== 'undefined') {
                const cropperModal = bootstrap.Modal.getInstance(document.getElementById('cropperModal'));
                if (cropperModal) cropperModal.hide();
            }
        }, 'image/jpeg', 0.9);
    });

    elements.form?.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        updateHiddenFields();

        const formData = new FormData(elements.form);
        uploadedImages.forEach(img => {
            formData.append('images', img.file);
        });

        // Show loading state
        if (elements.updateBtnText) elements.updateBtnText.textContent = 'Updating...';
        if (elements.updateBtnLoader) elements.updateBtnLoader.style.display = 'inline-block';
        if (elements.updateBtn) elements.updateBtn.disabled = true;

        fetch(elements.form.action, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.redirected) {
                    localStorage.setItem('success', 'Product Updating successful');
                    window.location.href = response.url;
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.error) {
                    throw new Error(data.error);
                }
            })
            .catch(error => {
                if (typeof Toastify !== 'undefined') {
                    Toastify({
                        text: error.message || 'something went wrong!',
                        duration: 3000,
                        gravity: 'top',
                        position: 'right',
                        close: true,
                        backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)',
                        stopOnFocus: true
                    }).showToast();
                }
            })
            .finally(() => {
                // Reset loading state
                if (elements.updateBtnText) elements.updateBtnText.textContent = 'Update Product';
                if (elements.updateBtnLoader) elements.updateBtnLoader.style.display = 'none';
                if (elements.updateBtn) elements.updateBtn.disabled = false;
            });
    });

    document.querySelectorAll('.thumbnail[data-type="existing"]').forEach(thumb => {
        thumb.querySelector('.remove-btn')?.addEventListener('click', function (e) {
            e.stopPropagation();
            removeImage(thumb);
        });

        thumb.addEventListener('click', function (e) {
            if (!e.target.closest('.remove-btn')) setAsMainImage(thumb);
        });
    });

    document.querySelector('#sizeTableBody')?.addEventListener('change', function (e) {
        if (e.target.classList.contains('regular-price') || e.target.classList.contains('sale-price')) {
            const row = e.target.closest('tr');
            const regularPrice = parseFloat(row.querySelector('.regular-price').value) || 0;
            const salePrice = parseFloat(row.querySelector('.sale-price').value) || 0;

            if (salePrice > 0 && salePrice > regularPrice) {
                row.querySelector('.sale-price').value = '';
                row.querySelector('.sale-price').focus();
            }
        }
    });

    updateHiddenFields();
    updateRemoveButtonsState();
}

function updateHiddenFields() {
    if (elements.existingImagesInput) elements.existingImagesInput.value = existingImages.join(',');
    if (elements.mainImageInput && !elements.mainImageInput.value && existingImages.length > 0) {
        elements.mainImageInput.value = existingImages[0];
    }
}

function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => { element.style.display = 'none'; }, 50000);
}

function showerror_internal(inputElement, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-danger small variant-error';
    errorDiv.textContent = message;
    inputElement.parentElement.appendChild(errorDiv);
}

function validateForm() {
    let isValid = true;

    const productNameInput = elements.form.querySelector('#product_name');
    const productName = productNameInput.value.trim();
    productNameInput.value = productName; // Trim the actual input value
    if (!productName) {
        showError(elements.productNameError, 'Product name is required');
        isValid = false;
    } else if (productName.length < 3) {
        showError(elements.productNameError, 'Product minimum 3 letters');
        isValid = false;
    } else if (productName.length > 15) {
        showError(elements.productNameError, 'Product name maximum 15 letters');
        isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(productName)) {
        showError(elements.productNameError, 'Product name must contain only letters');
        isValid = false;
    }

    const description = elements.form.querySelector('#description').value.trim();
    if (!description) {
        showError(elements.descriptionError, 'Description is required');
        isValid = false;
    } else if (description.length < 10) {
        showError(elements.descriptionError, 'Description is minimum 10 letters');
        isValid = false;
    } else if (description.length > 1000) {
        showError(elements.descriptionError, 'Description is maximum 1000 letters');
        isValid = false;
    }

    const colorInput = elements.form.querySelector('input[name="color"]');
    if (colorInput) {
        const colorValue = colorInput.value.trim();
        if (!colorValue) {
            showError(elements.colorError, 'Product color is required');
            isValid = false;
        } else if (/\d/.test(colorValue)) {
            showError(elements.colorError, 'Color should not contain numbers');
            isValid = false;
        } else if (elements.colorError) {
            elements.colorError.textContent = '';
        }
    }

    const category = elements.form.querySelector('#category').value;
    if (!category) {
        showError(elements.categoryError, 'Category is required');
        isValid = false;
    }

    const rows = document.querySelectorAll('#sizeTableBody tr');
    const selectedSizes = new Set();
    document.querySelectorAll('.variant-error').forEach(el => el.remove());

    rows.forEach((row) => {
        const sizeSelect = row.querySelector('.size-select');
        const regularPriceInput = row.querySelector('.regular-price');
        const salePriceInput = row.querySelector('.sale-price');
        const quantityInput = row.querySelector('.quantity');

        const size = sizeSelect.value.trim();
        const regularPrice = parseFloat(regularPriceInput.value);
        const salePrice = parseFloat(salePriceInput.value);
        const quantity = parseInt(quantityInput.value);

        sizeSelect.classList.remove('is-invalid');
        regularPriceInput.classList.remove('is-invalid');
        salePriceInput.classList.remove('is-invalid');
        quantityInput.classList.remove('is-invalid');

        if (!size) {
            sizeSelect.classList.add('is-invalid');
            showerror_internal(sizeSelect, 'Please select a size.');
            isValid = false;
        } else if (selectedSizes.has(size)) {
            sizeSelect.classList.add('is-invalid');
            showerror_internal(sizeSelect, 'Duplicate size is not allowed.');
            isValid = false;
        } else {
            selectedSizes.add(size);
        }

        const positiveNumberRegex = /^[1-9]\d*(\.\d+)?$/;

        if (!regularPrice) {
            regularPriceInput.classList.add('is-invalid');
            showerror_internal(regularPriceInput, 'Enter regular Price');
            isValid = false;
        } else if (isNaN(regularPrice) || !positiveNumberRegex.test(regularPrice)) {
            regularPriceInput.classList.add('is-invalid');
            showerror_internal(regularPriceInput, 'Regular price must be a positive number.');
            isValid = false;
        }

        if (!salePrice) {
            salePriceInput.classList.add('is-invalid');
            showerror_internal(salePriceInput, 'Enter Sale Price');
            isValid = false;
        } else if (isNaN(salePrice) || !positiveNumberRegex.test(salePrice)) {
            salePriceInput.classList.add('is-invalid');
            showerror_internal(salePriceInput, 'Sales price must be positive');
            isValid = false;
        }

        if (isNaN(salePrice) || salePrice > regularPrice) {
            salePriceInput.classList.add('is-invalid');
            showerror_internal(salePriceInput, 'Sale price must be less than or equal to regular price.');
            isValid = false;
        }

        if (!quantity) {
            quantityInput.classList.add('is-invalid');
            showerror_internal(quantityInput, 'Enter Quantity');
            isValid = false;
        } else if (isNaN(quantity) || !positiveNumberRegex.test(quantity)) {
            quantityInput.classList.add('is-invalid');
            showerror_internal(quantityInput, 'Quantity must be greater than 0.');
            isValid = false;
        }
    });

    const totalImages = existingImages.length + uploadedImages.length;
    if (totalImages < 3) {
        showError(elements.imagesError, `Minimum 3 images are required`);
        isValid = false;
    } else if (totalImages > MAX_IMAGES) {
        showError(elements.imagesError, `Maximum ${MAX_IMAGES} images allowed`);
        isValid = false;
    }

    if (!isValid && typeof Toastify !== 'undefined') {
        Toastify({
            text: "Check form ",
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
        }).showToast();
    }
    return isValid;
}

function handleImageSelection(e) {
    const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
    if (!files || files.length === 0) return;

    const totalImages = existingImages.length + uploadedImages.length + files.length;
    if (totalImages > MAX_IMAGES) {
        showError(elements.imagesError, `Maximum ${MAX_IMAGES} images allowed (${totalImages - MAX_IMAGES} too many)`);
        return;
    }

    const newFiles = Array.from(files).filter(file => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            showError(elements.imagesError, 'Only JPG, PNG, and WebP images are allowed');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            showError(elements.imagesError, 'Image size should be less than 5MB');
            return false;
        }
        return true;
    });

    if (newFiles.length > 0) {
        const isQueueEmpty = filesToProcess.length === 0;
        filesToProcess = [...filesToProcess, ...newFiles];
        // Start processing if not already in progress
        if (isQueueEmpty) {
            processNextFile();
        }
    }

    if (e.target.id === 'imageUpload') e.target.value = '';
}

function processNextFile() {
    if (filesToProcess.length === 0) return;

    currentFile = filesToProcess[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        if (elements.cropperImage) {
            elements.cropperImage.src = e.target.result;
            if (typeof bootstrap !== 'undefined') {
                const modalEl = document.getElementById('cropperModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    modal.show();
                }
            }
        }
    };
    reader.readAsDataURL(currentFile);
}

function createThumbnail(image) {
    const thumb = document.createElement('div');
    thumb.className = `thumbnail ${image.isMain ? 'main-image' : ''}`;
    thumb.dataset.type = image.type;
    thumb.dataset.name = image.file ? image.file.name : image.name;

    const totalImages = existingImages.length + uploadedImages.length;
    const removeBtnDisabled = totalImages <= MIN_IMAGES;

    thumb.innerHTML = `
        <img src="${image.url}" alt="Product Image">
        <button class="remove-btn ${removeBtnDisabled ? 'disabled-remove' : ''}" 
            ${removeBtnDisabled ? 'disabled' : ''}>
            <i class="fas fa-times"></i>
        </button>
        ${image.isMain ? '<span class="main-image-badge">Main</span>' : ''}
    `;

    thumb.addEventListener('click', function (e) {
        if (!e.target.closest('.remove-btn')) setAsMainImage(thumb);
    });

    thumb.querySelector('.remove-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        removeImage(thumb);
    });

    elements.addedImagesContainer.appendChild(thumb);

    if (image.isMain) {
        elements.mainImageInput.value = image.file ? image.file.name : image.name;
    }

    updateRemoveButtonsState();
}

function setAsMainImage(thumb) {
    document.querySelectorAll('.thumbnail').forEach(t => {
        t.classList.remove('main-image');
        const badge = t.querySelector('.main-image-badge');
        if (badge) badge.remove();
    });

    thumb.classList.add('main-image');
    thumb.insertAdjacentHTML('beforeend', '<span class="main-image-badge">Main</span>');
    elements.mainImageInput.value = thumb.dataset.name;
}

function removeImage(thumb) {
    const imageType = thumb.dataset.type;
    const imageName = thumb.dataset.name;

    const totalImages = existingImages.length + uploadedImages.length;
    if (totalImages <= MIN_IMAGES) {
        showError(elements.imagesError, `Minimum ${MIN_IMAGES} images are required`);
        return;
    }

    if (imageType === 'existing') {
        existingImages = existingImages.filter(img => img !== imageName);
    } else {
        const index = uploadedImages.findIndex(img => img.file.name === imageName);
        if (index !== -1) {
            URL.revokeObjectURL(uploadedImages[index].url);
            uploadedImages.splice(index, 1);
        }
    }

    if (thumb.classList.contains('main-image')) {
        const firstThumb = document.querySelector('.thumbnail');
        if (firstThumb) {
            setAsMainImage(firstThumb);
        } else {
            elements.mainImageInput.value = '';
        }
    }

    thumb.remove();
    updateHiddenFields();
    updateRemoveButtonsState();
}

function updateRemoveButtonsState() {
    const totalImages = existingImages.length + uploadedImages.length;
    const disableRemove = totalImages <= MIN_IMAGES;

    document.querySelectorAll('.thumbnail .remove-btn').forEach(btn => {
        btn.disabled = disableRemove;
        if (disableRemove) {
            btn.classList.add('disabled-remove');
        } else {
            btn.classList.remove('disabled-remove');
        }
    });
}

function addNewVariant() {
    try {
        const sizeSelect = document.getElementById('newSizeSelect');
        const size = sizeSelect.value;
        const regularPrice = parseFloat(document.getElementById('newRegularPrice').value);
        const salePriceInput = document.getElementById('newSalePrice').value;
        const salePrice = salePriceInput ? parseFloat(salePriceInput) : 0;
        const quantity = parseInt(document.getElementById('newStockQuantity').value);

        if (!size || isNaN(regularPrice) || isNaN(quantity)) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: 'Please fill in all required fields (Size, Regular Price, and Stock)',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
                }).showToast();
            }
            return;
        }

        if (quantity <= 0) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: 'Quantity must be greater than 0',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
                }).showToast();
            }
            return;
        }

        if (salePrice <= 0) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: 'Sale price, must be greater than 0',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
                }).showToast();
            }
            return;
        }

        if (regularPrice <= 0) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: 'Regular price must be greater than 0',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
                }).showToast();
            }
            return;
        }

        if (salePrice > regularPrice) {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: 'Sale price must be less or equal than regular price',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
                }).showToast();
            }
            return;
        }

        const existingRows = document.querySelectorAll('#sizeTableBody tr');
        for (let row of existingRows) {
            const sizeInput = row.querySelector('.size-select');
            if (sizeInput && sizeInput.value === size) {
                if (typeof Toastify !== 'undefined') {
                    Toastify({
                        text: 'This size already exists in the product variants',
                        duration: 3000,
                        gravity: 'top',
                        position: 'right',
                        backgroundColor: 'linear-gradient(to right, #FF5F6D, #FFC371)'
                    }).showToast();
                }
                return;
            }
        }

        const tableBody = document.getElementById('sizeTableBody');
        const newRow = document.createElement('tr');
        const variantIndex = existingRows.length;

        newRow.innerHTML = `
            <td>
                <select name="variants[${variantIndex}][size]" class="form-control size-select">
                    <option value="S" ${size === 'S' ? 'selected' : ''}>S</option>
                    <option value="M" ${size === 'M' ? 'selected' : ''}>M</option>
                    <option value="L" ${size === 'L' ? 'selected' : ''}>L</option>
                    <option value="XL" ${size === 'XL' ? 'selected' : ''}>XL</option>
                    <option value="XXL" ${size === 'XXL' ? 'selected' : ''}>XXL</option>
                </select>
            </td>
            <td><input type="number" class="form-control regular-price" 
                    name="variants[${variantIndex}][regularPrice]" value="${regularPrice}"></td>
            <td><input type="number" class="form-control sale-price" 
                    name="variants[${variantIndex}][salePrice]" value="${salePrice}"></td>
            <td><input type="number" class="form-control quantity" 
                    name="variants[${variantIndex}][quantity]" value="${quantity}"></td>
            <td>
                <button class="btn btn-sm btn-outline-secondary remove-variant-btn"
                    onclick="event.preventDefault(); removeVariantSize('${size}', '${elements.productId}')"
                    data-variant="${size}"
                    data-productid="${elements.productId}">
                    Remove Variant
                </button>
            </td>
        `;

        tableBody.appendChild(newRow);

        if (typeof bootstrap !== 'undefined') {
            const sizeModalEl = document.getElementById('sizeModal');
            const sizeModal = bootstrap.Modal.getInstance(sizeModalEl);
            if (sizeModal) sizeModal.hide();
        }
        document.getElementById('newRegularPrice').value = '';
        document.getElementById('newSalePrice').value = '';
        document.getElementById('newStockQuantity').value = '';

        updateVariantRemoveButtons();

        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: 'Variant added successfully!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)'
            }).showToast();
        }

    } catch (error) {
        console.error('Error in addNewVariant:', error);
    }
}

async function removeVariantSize(variant, productId) {
    try {
        const rows = document.querySelectorAll('#sizeTableBody tr');
        if (rows.length <= 1) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Cannot Remove',
                    text: 'A product must have at least one size variant',
                    confirmButtonColor: '#d33'
                });
            }
            return;
        }

        let rowToRemove = null;
        rows.forEach(row => {
            const button = row.querySelector('button[data-variant]');
            if (button && button.dataset.variant === variant) {
                rowToRemove = row;
            }
        });

        if (rowToRemove) {
            rowToRemove.remove();

            const remainingRows = document.querySelectorAll('#sizeTableBody tr');
            remainingRows.forEach((row, index) => {
                const sizeSelect = row.querySelector('.size-select');
                const regularPrice = row.querySelector('.regular-price');
                const salePrice = row.querySelector('.sale-price');
                const quantity = row.querySelector('.quantity');

                if (sizeSelect) sizeSelect.name = `variants[${index}][size]`;
                if (regularPrice) regularPrice.name = `variants[${index}][regularPrice]`;
                if (salePrice) salePrice.name = `variants[${index}][salePrice]`;
                if (quantity) quantity.name = `variants[${index}][quantity]`;
            });

            updateVariantRemoveButtons();

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Variant removed',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }

    } catch (error) {
        console.error('Error in removeVariantSize:', error);
    }
}

function updateVariantRemoveButtons() {
    const rows = document.querySelectorAll('#sizeTableBody tr');
    const disableRemove = rows.length <= 1;

    rows.forEach(row => {
        const btn = row.querySelector('.remove-variant-btn');
        if (btn) {
            btn.disabled = disableRemove;
            if (disableRemove) {
                btn.classList.add('disabled-remove');
            } else {
                btn.classList.remove('disabled-remove');
            }
        }
    });
}

// Auto-initialize if config is provided via global variable
document.addEventListener('DOMContentLoaded', () => {
    if (window.EDIT_PRODUCT_CONFIG) {
        initProductEdit(window.EDIT_PRODUCT_CONFIG);
    }
});
