
// Global variables
const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
let cropper;
let currentFile;
let uploadedImages = [];
let selectedFiles = [];
let filesToProcess = [];
let currentProcessingMode = null; // 'crop' or 'asis'

/**
 * Validates the total count of uploaded images and updates error display
 */
function validateImagesCount() {
    const errorElement = document.getElementById('images-error');
    if (!errorElement) return;

    if (uploadedImages.length < MIN_IMAGES) {
        errorElement.textContent = `Minimum ${MIN_IMAGES} images are required (Currently: ${uploadedImages.length})`;
        errorElement.style.display = 'block';
    } else if (uploadedImages.length > MAX_IMAGES) {
        errorElement.textContent = `Maximum ${MAX_IMAGES} images allowed (Currently: ${uploadedImages.length})`;
        errorElement.style.display = 'block';
    } else {
        errorElement.style.display = 'none';
    }
}

function removeImage(thumbElement, e) {
    const index = parseInt(thumbElement.dataset.index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(uploadedImages[index].url);
    uploadedImages.splice(index, 1);

    // Handle main image reassignment if needed
    if (thumbElement.classList.contains('main-image')) {
        if (uploadedImages.length > 0) {
            uploadedImages[0].isMain = true;
            const mainImageIndexEl = document.getElementById('mainImageIndex');
            if (mainImageIndexEl) mainImageIndexEl.value = 0;
        } else {
            const mainImageIndexEl = document.getElementById('mainImageIndex');
            if (mainImageIndexEl) mainImageIndexEl.value = '';
        }
    }

    // Remove from DOM
    thumbElement.remove();

    // Update indices of remaining thumbnails
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.dataset.index = i;
    });

    // Ensure we have a valid main image
    if (uploadedImages.some(img => img.isMain)) {
        const mainIndex = uploadedImages.findIndex(img => img.isMain);
        const mainImageIndexEl = document.getElementById('mainImageIndex');
        if (mainImageIndexEl) mainImageIndexEl.value = mainIndex;
    }

    // Update validation state
    validateImagesCount();
}

function setAsMainImage(thumbElement) {
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('main-image');
        const badge = thumb.querySelector('.main-image-badge');
        if (badge) badge.remove();
    });

    thumbElement.classList.add('main-image');
    const badge = document.createElement('span');
    badge.className = 'main-image-badge';
    badge.textContent = 'Main';
    thumbElement.appendChild(badge);

    const index = thumbElement.dataset.index;
    const mainImageIndexEl = document.getElementById('mainImageIndex');
    if (mainImageIndexEl) mainImageIndexEl.value = index;

    uploadedImages.forEach((img, i) => {
        img.isMain = i == index;
    });
}


function createThumbnail(image, index) {
    const thumb = document.createElement('div');
    thumb.className = `thumbnail ${image.isMain ? 'main-image' : ''}`;
    thumb.dataset.index = index;

    thumb.innerHTML = `
        <img src="${image.url}" alt="Product Image">
        <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        ${image.isMain ? '<span class="main-image-badge">Main</span>' : ''}
    `;

    thumb.addEventListener('click', function (e) {
        if (!e.target.closest('.remove-btn')) {
            setAsMainImage(thumb);
        }
    });

    thumb.querySelector('.remove-btn').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        removeImage(thumb, e);
    });

    document.getElementById('imagePreviews').appendChild(thumb);

    if (image.isMain) {
        const mainImageIndexEl = document.getElementById('mainImageIndex');
        if (mainImageIndexEl) mainImageIndexEl.value = index;
    }
}

/**
 * Creates a file preview item element with event listeners
 * @param {Object} fileObj - The file object containing file and URL
 * @param {string} fileName - The name of the file
 * @returns {HTMLElement} - The created preview element
 */
function createFilePreviewItem(fileObj, fileName) {
    const filePreviewItem = document.createElement('div');
    filePreviewItem.className = 'file-preview-item selected';
    filePreviewItem.dataset.fileName = fileName;

    filePreviewItem.innerHTML = `
        <input type="checkbox" class="file-checkbox" checked>
        <img src="${fileObj.url}" alt="${fileName}">
        <div class="file-name">${fileName}</div>
        <button type="button" class="remove-preview"><i class="fas fa-times"></i></button>
    `;

    // Add event listeners
    filePreviewItem.querySelector('.remove-preview').addEventListener('click', function (e) {
        e.stopPropagation();
        removeFileFromPreview(fileName);
    });

    filePreviewItem.querySelector('.file-checkbox').addEventListener('change', function () {
        const fileObj = selectedFiles.find(f => f.file.name === fileName);
        if (fileObj) {
            fileObj.selected = this.checked;
            filePreviewItem.classList.toggle('selected', this.checked);
        }
    });

    filePreviewItem.addEventListener('click', function (e) {
        if (!e.target.classList.contains('remove-preview') && !e.target.classList.contains('file-checkbox')) {
            const checkbox = this.querySelector('.file-checkbox');
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    });

    return filePreviewItem;
}

// Toggle variant inputs
function toggleVariantInputs(checkbox, size) {
    const inputsDiv = document.getElementById(`inputs-size-${size}`);
    if (checkbox.checked) {
        const variantsError = document.getElementById('variants-error');
        if (variantsError) variantsError.style.display = 'none';
        inputsDiv.classList.add('show');
        inputsDiv.querySelectorAll('input').forEach(input => input.setAttribute('required', 'true'));
    } else {
        inputsDiv.classList.remove('show');
        inputsDiv.querySelectorAll('input').forEach(input => {
            input.removeAttribute('required');
            input.value = '';
        });
    }
}

/**
 * Adds selected files to the preview area with validation
 * Automatically clears errors when valid files are added
 * @param {FileList} files - The files selected by the user
 */
function addFilesToPreview(files) {
    const filePreviewList = document.getElementById('filePreviewList');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const errorElement = document.getElementById('images-error');

    if (!filePreviewList || !filePreviewContainer || !errorElement) return;

    // Check total file count limit
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > MAX_IMAGES) {
        errorElement.textContent = `Maximum ${MAX_IMAGES} images allowed (you already have ${selectedFiles.length})`;
        errorElement.style.display = 'block';
        return;
    }

    let validFilesAdded = 0;
    Array.from(files).forEach(file => {
        // Validate each file before adding
        if (!validateImage(file)) return;

        const fileObj = {
            file: file,
            url: URL.createObjectURL(file),
            selected: true
        };
        selectedFiles.push(fileObj);
        validFilesAdded++;

        // Create preview item
        const filePreviewItem = createFilePreviewItem(fileObj, file.name);
        filePreviewList.appendChild(filePreviewItem);
    });

    // Show preview container if we have files
    if (selectedFiles.length > 0) {
        filePreviewContainer.style.display = 'block';
    }

    // Clear error if valid files were successfully added
    if (validFilesAdded > 0) {
        errorElement.style.display = 'none';
    }
}

/**
 * Removes a file from the preview area and updates validation
 * @param {string} fileName - The name of the file to remove
 */
function removeFileFromPreview(fileName) {
    // Find and remove file from selectedFiles array
    const fileIndex = selectedFiles.findIndex(f => f.file.name === fileName);
    if (fileIndex !== -1) {
        URL.revokeObjectURL(selectedFiles[fileIndex].url); // Clean up memory
        selectedFiles.splice(fileIndex, 1);
    }

    // Remove the preview element from DOM
    const filePreviewItem = document.querySelector(`.file-preview-item[data-file-name="${fileName}"]`);
    if (filePreviewItem) {
        filePreviewItem.remove();
    }

    // Hide preview container if no files left
    if (selectedFiles.length === 0) {
        const filePreviewContainer = document.getElementById('filePreviewContainer');
        if (filePreviewContainer) filePreviewContainer.style.display = 'none';
    }

    // Update validation state after removal
    validateImagesCount();
}

/**
 * Removes all selected files from the preview area
 * Updates validation after removal
 */
function removeSelectedFiles() {
    const selectedFileNames = selectedFiles
        .filter(file => file.selected)
        .map(file => file.file.name);

    // Remove each selected file
    selectedFileNames.forEach(fileName => {
        removeFileFromPreview(fileName);
    });

    // Update validation after all files are removed
    validateImagesCount();
}

function selectAllFiles() {
    document.querySelectorAll('.file-preview-item').forEach(item => {
        item.classList.add('selected');
    });
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    selectedFiles.forEach(file => {
        file.selected = true;
    });
}

function deselectAllFiles() {
    document.querySelectorAll('.file-preview-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    selectedFiles.forEach(file => {
        file.selected = false;
    });
}

function showProcessingOptions() {
    const selectedFileObjs = selectedFiles.filter(file => file.selected);

    if (selectedFileObjs.length === 0) {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: "Please select at least one file to process",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#fbc02d",
                stopOnFocus: true
            }).showToast();
        }
        return;
    }

    // Show processing options modal
    const processingOptionsModal = document.getElementById('processingOptionsModal');
    if (processingOptionsModal && typeof bootstrap !== 'undefined') {
        const processingModal = new bootstrap.Modal(processingOptionsModal);
        processingModal.show();
    }
}

function processAsIs() {
    console.log('processAsIs called');
    const selectedFileObjs = selectedFiles.filter(file => file.selected);
    console.log('Selected files:', selectedFileObjs.length);
    if (selectedFileObjs.length === 0) {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: "Please select at least one file to process",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#fbc02d",
                stopOnFocus: true
            }).showToast();
        }
        return;
    }

    currentProcessingMode = 'asis';
    filesToProcess = [...selectedFileObjs];
    processNextFile();

    // Hide the modal
    const processingOptionsModal = document.getElementById('processingOptionsModal');
    if (processingOptionsModal && typeof bootstrap !== 'undefined') {
        const processingModal = bootstrap.Modal.getInstance(processingOptionsModal);
        if (processingModal) processingModal.hide();
    }
}

function processWithCrop() {
    const selectedFileObjs = selectedFiles.filter(file => file.selected);
    currentProcessingMode = 'crop';
    filesToProcess = [...selectedFileObjs];
    processNextFile();

    // Hide the modal
    const processingOptionsModal = document.getElementById('processingOptionsModal');
    if (processingOptionsModal && typeof bootstrap !== 'undefined') {
        const processingModal = bootstrap.Modal.getInstance(processingOptionsModal);
        if (processingModal) processingModal.hide();
    }
}

function processNextFile() {
    if (filesToProcess.length === 0) {
        return;
    }

    const nextFileObj = filesToProcess[0];
    currentFile = nextFileObj.file;

    if (currentProcessingMode === 'crop') {
        previewImageForCropping(nextFileObj.file);
    } else {
        addImageAsIs(nextFileObj.file);
        filesToProcess.shift();
        processNextFile();
    }

    // Remove from selected files preview
    removeFileFromPreview(nextFileObj.file.name);
}

/**
 * Adds an image directly to the final uploaded images without cropping
 * Updates validation automatically
 * @param {File} file - The image file to add
 */
function addImageAsIs(file) {
    const imageObj = {
        file: file,
        url: URL.createObjectURL(file),
        isMain: uploadedImages.length === 0 // First image becomes main by default
    };

    uploadedImages.push(imageObj);
    createThumbnail(imageObj, uploadedImages.length - 1);

    // Update validation after adding the image
    validateImagesCount();
}

function validateImage(file) {
    const errorElement = document.getElementById('images-error');
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        if (errorElement) errorElement.textContent = 'Only JPEG and PNG image files are allowed';
        return false;
    }
    if (file.size > MAX_FILE_SIZE) {
        if (errorElement) errorElement.textContent = 'Image size should be less than 5MB';
        return false;
    }
    return true;
}

function previewImageForCropping(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const cropperImage = document.getElementById('cropperImage');
        if (cropperImage) {
            cropperImage.src = e.target.result;
            const cropperModalEl = document.getElementById('cropperModal');
            if (cropperModalEl && typeof bootstrap !== 'undefined') {
                const cropperModal = new bootstrap.Modal(cropperModalEl);
                cropperModal.show();
            }
        }
    };
    reader.readAsDataURL(file);
}

// Clear validation errors for a specific field
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (field) {
        field.classList.remove('is-invalid');
    }
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Clear all validation errors
function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

// Find and focus on the first error field
function focusFirstError() {
    const firstErrorField = document.querySelector('.is-invalid');
    if (firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Validate individual fields on input
function validateField(fieldId) {
    switch (fieldId) {
        case 'productName':
            validateProductName();
            break;
        case 'description':
            validateDescription();
            break;
        case 'category':
            validateCategory();
            break;
        case 'colour':
            validateColor();
            break;
        default:
            if (fieldId.includes('regularPrice-') || fieldId.includes('salePrice-') || fieldId.includes('stock-')) {
                const size = fieldId.split('-')[1];
                validateVariant(size);
            }
    }
}

// Individual field validation functions
function validateProductName() {
    const productNameInput = document.getElementById('productName');
    const productName = productNameInput.value.trim();
    productNameInput.value = productName; // Trim the actual input value
    clearFieldError('productName');

    if (!productName) {
        displayError('productName', 'Product name is required');
    } else if (!/^[a-zA-Z\s]+$/.test(productName)) {
        displayError('productName', 'Product name should contain only letters');
    } else if (productName.length < 3) {
        displayError('productName', 'Product name must be at least 3 characters');
    } else if (productName.length > 15) {
        displayError('productName', 'Product name must be less than 15 characters');
    }
}

function validateDescription() {
    const description = document.getElementById('description').value.trim();
    clearFieldError('description');

    if (!description) {
        displayError('description', 'Description is required');
    } else if (description.length < 15) {
        displayError('description', 'Description must be at least 15 characters');
    } else if (description.length > 1000) {
        displayError('description', 'Description must be less than 1000 characters');
    } else if (!/[a-zA-Z]/.test(description)) {
        displayError('description', 'Description must contain alphabets (not just numbers or symbols)');
    }
}

function validateCategory() {
    const category = document.getElementById('category').value;
    clearFieldError('category');

    if (!category) {
        displayError('category', 'Category is required');
    }
}

function validateColor() {
    const colour = document.getElementById('colour').value.trim();
    clearFieldError('colour');

    if (!colour) {
        displayError('colour', 'Color is required');
    } else if (!/^[a-zA-Z\s]+$/.test(colour)) {
        displayError('colour', 'Color should contain only letters');
    } else if (colour.length < 3) {
        displayError('colour', 'Color must be at least 3 characters');
    } else if (colour.length >= 15) {
        displayError('colour', 'Color must be less then or equal 15');
    }
}

function validateVariant(size) {
    const regularPrice = document.getElementById(`regularPrice-${size}`).value;
    const salePrice = document.getElementById(`salePrice-${size}`).value;
    const stock = document.getElementById(`stock-${size}`).value;

    clearFieldError(`regularPrice-${size}`);
    clearFieldError(`salePrice-${size}`);
    clearFieldError(`stock-${size}`);

    if (!regularPrice || isNaN(regularPrice)) {
        displayError(`regularPrice-${size}`, 'Regular price is required');
    } else if (parseFloat(regularPrice) <= 0) {
        displayError(`regularPrice-${size}`, 'Regular price must be greater than 0');
    } else if (parseFloat(regularPrice) > 10000) {
        displayError(`regularPrice-${size}`, 'Regular price must be less than 10,000');
    }

    if (!salePrice || isNaN(salePrice)) {
        displayError(`salePrice-${size}`, 'Sale price is required');
    } else if (parseFloat(salePrice) <= 0) {
        displayError(`salePrice-${size}`, 'Sale price must be greater than 0');
    } else if (parseFloat(salePrice) > parseFloat(regularPrice)) {
        displayError(`salePrice-${size}`, 'Sale price must be less than regular price');
    }

    if (!stock || isNaN(stock) || parseInt(stock) < 0) {
        displayError(`stock-${size}`, 'Valid stock quantity is required (must be greater than 0)');
    } else if (parseInt(stock) > 10000) {
        displayError(`stock-${size}`, 'Stock quantity must be less than 10,000');
    }
}

// Form validation
function validateForm() {
    let isValid = true;

    clearAllErrors();

    const productNameInput = document.getElementById('productName');
    const productName = productNameInput.value.trim();
    productNameInput.value = productName; // Trim the actual input value
    if (!productName) {
        displayError('productName', 'Product name is required');
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(productName)) {
        displayError('productName', 'Product name should contain only letters');
        isValid = false;
    } else if (productName.length < 3) {
        displayError('productName', 'Product name must be at least 3 characters');
        isValid = false;
    } else if (productName.length > 15) {
        displayError('productName', 'Product name must be less than 15 characters');
        isValid = false;
    }

    const description = document.getElementById('description').value.trim();
    if (!description) {
        displayError('description', 'Description is required');
        isValid = false;
    } else if (description.length < 15) {
        displayError('description', 'Description must be at least 15 characters');
        isValid = false;
    } else if (description.length > 1000) {
        displayError('description', 'Description must be less than 1000 characters');
        isValid = false;
    } else if (!/[a-zA-Z]/.test(description)) {
        displayError('description', 'Description must contain alphabets (not just numbers or symbols)');
        isValid = false;
    }

    const category = document.getElementById('category').value;
    if (!category) {
        displayError('category', 'Category is required');
        isValid = false;
    }

    const colour = document.getElementById('colour').value.trim();
    if (!colour) {
        displayError('colour', 'Color is required');
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(colour)) {
        displayError('colour', 'Color should contain only letters');
        isValid = false;
    } else if (colour.length < 3) {
        displayError('colour', 'Color must be at least 3 characters');
        isValid = false;
    } else if (colour.length >= 15) {
        displayError('colour', 'Color must be less then or equal 15');
        isValid = false;
    }

    const checkedSizes = document.querySelectorAll('input[name="sizes"]:checked');
    if (checkedSizes.length === 0) {
        displayError('variants', 'At least one size variant is required');
        const variantsError = document.getElementById('variants-error');
        if (variantsError) variantsError.classList.add('is-invalid');
        isValid = false;
    } else {
        checkedSizes.forEach(checkbox => {
            const size = checkbox.value;
            const regularPrice = document.getElementById(`regularPrice-${size}`).value;
            const salePrice = document.getElementById(`salePrice-${size}`).value;
            const stock = document.getElementById(`stock-${size}`).value;

            if (!regularPrice || isNaN(regularPrice)) {
                displayError(`regularPrice-${size}`, 'Regular price is required');
                isValid = false;
            } else if (parseFloat(regularPrice) <= 0) {
                displayError(`regularPrice-${size}`, 'Regular price must be greater than 0');
                isValid = false;
            } else if (parseFloat(regularPrice) > 10000) {
                displayError(`regularPrice-${size}`, 'Regular price must be less than 10,000');
                isValid = false;
            }

            if (!salePrice || isNaN(salePrice)) {
                displayError(`salePrice-${size}`, 'Sale price is required');
                isValid = false;
            } else if (parseFloat(salePrice) <= 0) {
                displayError(`salePrice-${size}`, 'Sale price must be greater than 0');
                isValid = false;
            } else if (parseFloat(salePrice) > parseFloat(regularPrice)) {
                displayError(`salePrice-${size}`, 'Sale price must be less than regular price');
                isValid = false;
            }

            if (!stock || isNaN(stock) || parseInt(stock) <= 0) {
                displayError(`stock-${size}`, 'Valid stock quantity is required (must be greater than 0)');
                isValid = false;
            } else if (parseInt(stock) > 10000) {
                displayError(`stock-${size}`, 'Stock quantity must be less than 10,000');
                isValid = false;
            }
        });
    }

    if (uploadedImages.length < MIN_IMAGES) {
        displayError('images-error', `Minimum ${MIN_IMAGES} images are required`);
        isValid = false;
    } else if (uploadedImages.length > MAX_IMAGES) {
        displayError('images-error', `Maximum ${MAX_IMAGES} images allowed`);
        isValid = false;
    }

    const mainImageIndexEl = document.getElementById('mainImageIndex');
    const mainImageIndex = mainImageIndexEl ? parseInt(mainImageIndexEl.value) : -1;
    if (uploadedImages.length > 0 && (isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= uploadedImages.length)) {
        displayError('images-error', 'Please select a main image');
        isValid = false;
    }

    if (!isValid) {
        setTimeout(focusFirstError, 100);
    }

    return isValid;
}

function displayError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (field) {
        field.classList.add('is-invalid');
    }
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function submitForm() {
    console.log('submitForm called');

    const publishBtn = document.getElementById('publishBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // Show loading state
    if (btnText) btnText.textContent = 'Publishing...';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    if (publishBtn) publishBtn.disabled = true;

    const imageUpload = document.getElementById('imageUpload');
    const dataTransfer = new DataTransfer();

    console.log('Uploaded images to process:', uploadedImages.length);

    uploadedImages.forEach((image, index) => {
        console.log(`Adding image ${index}:`, image.file.name, image.file.size);
        dataTransfer.items.add(image.file);
    });

    if (imageUpload) imageUpload.files = dataTransfer.files;
    console.log('Final files in input:', imageUpload ? imageUpload.files.length : 'none');

    // Submit the form
    const form = document.getElementById('add-product-form');
    if (form) form.submit();
}

function validateAndSubmit() {
    console.log('validateAndSubmit called');

    if (validateForm()) {
        console.log('Form validation passed, submitting...');
        submitForm();
    } else {
        console.log('Form validation failed');
        // Show all errors clearly
        document.querySelectorAll('.error-message').forEach(error => {
            if (error.style.display === 'block') {
                console.log('Error:', error.textContent);
            }
        });
    }
}

// Image upload and cropping functionality
document.addEventListener('DOMContentLoaded', function () {

    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            document.body.style.display = 'none';
            window.location.href = '/admin/allProducts';
        }
    });

    const imageUpload = document.getElementById('imageUpload');
    const uploadArea = document.getElementById('uploadArea');
    const cropperModalElement = document.getElementById('cropperModal');
    const cropperImage = document.getElementById('cropperImage');
    const saveCroppedBtn = document.getElementById('saveCroppedImage');
    const publishBtn = document.getElementById('publishBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const ratioButtons = document.querySelectorAll('.btn-group button[data-ratio]');

    // Enhanced multi-file selection elements
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    const processSelectedBtn = document.getElementById('processSelectedBtn');
    const cropAndResizeBtn = document.getElementById('cropAndResizeBtn');
    const useAsIsBtn = document.getElementById('useAsIsBtn');

    // Add event listeners for real-time validation
    document.getElementById('productName')?.addEventListener('input', () => validateField('productName'));
    document.getElementById('description')?.addEventListener('input', () => validateField('description'));
    document.getElementById('category')?.addEventListener('change', () => validateField('category'));
    document.getElementById('colour')?.addEventListener('input', () => validateField('colour'));

    // Add event listeners for all variant fields
    document.querySelectorAll('input[id^="regularPrice-"], input[id^="salePrice-"], input[id^="stock-"]').forEach(input => {
        input.addEventListener('input', () => {
            const fieldId = input.id;
            const size = fieldId.split('-')[1];
            validateVariant(size);
        });
    });

    // Event listeners
    imageUpload?.addEventListener('change', function (event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            addFilesToPreview(files);
        }
        event.target.value = '';
    });

    uploadArea?.addEventListener('click', () => imageUpload?.click());

    saveCroppedBtn?.addEventListener('click', function () {
        if (!cropper) return;

        const croppedCanvas = cropper.getCroppedCanvas({
            width: 800,
            height: 800,
            fillColor: '#fff',
            imageSmoothingQuality: 'high'
        });

        croppedCanvas.toBlob(blob => {
            const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
            const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

            const imageObj = {
                file: croppedFile,
                url: URL.createObjectURL(blob),
                isMain: uploadedImages.length === 0
            };

            uploadedImages.push(imageObj);
            createThumbnail(imageObj, uploadedImages.length - 1);

            if (cropperModalElement && typeof bootstrap !== 'undefined') {
                const cropperModal = bootstrap.Modal.getInstance(cropperModalElement);
                if (cropperModal) cropperModal.hide();
            }

            filesToProcess.shift();
            processNextFile();

        }, 'image/jpeg', 0.9);
    });

    publishBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        validateAndSubmit();
    });

    cancelBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            window.location.href = '/admin/products';
        }
    });

    // Enhanced multi-file selection event listeners
    selectAllBtn?.addEventListener('click', selectAllFiles);
    deselectAllBtn?.addEventListener('click', deselectAllFiles);
    removeSelectedBtn?.addEventListener('click', removeSelectedFiles);
    processSelectedBtn?.addEventListener('click', showProcessingOptions);
    cropAndResizeBtn?.addEventListener('click', processWithCrop);
    useAsIsBtn?.addEventListener('click', processAsIs);

    // Setup drag and drop
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        uploadArea.addEventListener('drop', function (e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length) {
                addFilesToPreview(files);
            }
        });
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        if (uploadArea) uploadArea.classList.add('dragover');
    }

    function unhighlight() {
        if (uploadArea) uploadArea.classList.remove('dragover');
    }

    // Initialize cropper when modal is shown
    cropperModalElement?.addEventListener('shown.bs.modal', function () {
        if (cropper) {
            cropper.destroy();
        }
        if (typeof Cropper !== 'undefined' && cropperImage) {
            cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                guides: false,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true
            });
        }
    });

    cropperModalElement?.addEventListener('hidden.bs.modal', function () {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        // If user cancels cropping, keep the file in the processing queue
        if (filesToProcess.length > 0 && currentProcessingMode === 'crop') {
            filesToProcess.shift();
            processNextFile();
        }
    });

    // Aspect ratio buttons
    ratioButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            ratioButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const ratio = this.dataset.ratio;
            if (cropper) {
                if (ratio === 'free') {
                    cropper.setAspectRatio(NaN);
                } else {
                    try {
                        cropper.setAspectRatio(eval(ratio));
                    } catch (e) {
                        console.error('Invalid ratio:', ratio);
                    }
                }
            }
        });
    });

    // Success alert timeout
    setTimeout(() => {
        const alert = document.querySelector('.alert-success');
        if (alert && typeof bootstrap !== 'undefined') {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 3000);

    // Attach variant toggle listeners
    document.querySelectorAll('input[name="sizes"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            toggleVariantInputs(this, this.value);
        });
    });
});
