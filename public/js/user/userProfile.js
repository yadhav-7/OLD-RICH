
// Enhanced validation patterns with country support
const patterns = {
    username: /^[a-zA-Z]{3,20}$/,
    name: /^[a-zA-Z\s]{2,50}$/,
    street: /^[a-zA-Z0-9\s,.'-]{5,100}$/,
    city: /^[a-zA-Z\s-]{2,50}$/,
    bio: /^.{0,200}$/
};

const validIndianPincodes = {
    'Andhra Pradesh': { start: 500000, end: 535999 },
    'Arunachal Pradesh': { start: 790000, end: 792999 },
    'Assam': { start: 781000, end: 788999 },
    'Bihar': { start: 800000, end: 855999 },
    'Chhattisgarh': { start: 490000, end: 497999 },
    'Delhi': { start: 110000, end: 110099 },
    'Goa': { start: 403000, end: 403999 },
    'Gujarat': { start: 360000, end: 396999 },
    'Haryana': { start: 120000, end: 136999 },
    'Himachal Pradesh': { start: 170000, end: 177999 },
    'Jammu and Kashmir': { start: 180000, end: 194999 },
    'Jharkhand': { start: 810000, end: 835999 },
    'Karnataka': { start: 560000, end: 591999 },
    'Kerala': { start: 670000, end: 695999 },
    'Ladakh': { start: 194000, end: 194999 },
    'Madhya Pradesh': { start: 450000, end: 488999 },
    'Maharashtra': { start: 400000, end: 445999 },
    'Manipur': { start: 795000, end: 795999 },
    'Meghalaya': { start: 793000, end: 794999 },
    'Mizoram': { start: 796000, end: 796999 },
    'Nagaland': { start: 797000, end: 798999 },
    'Odisha': { start: 750000, end: 770999 },
    'Punjab': { start: 140000, end: 160999 },
    'Rajasthan': { start: 300000, end: 345999 },
    'Sikkim': { start: 737000, end: 737999 },
    'Tamil Nadu': { start: 600000, end: 643999 },
    'Telangana': { start: 500000, end: 509999 },
    'Tripura': { start: 799000, end: 799999 },
    'Uttar Pradesh': { start: 200000, end: 285999 },
    'Uttarakhand': { start: 240000, end: 263999 },
    'West Bengal': { start: 700000, end: 743999 },
    'Puducherry': { start: 605000, end: 609999 },
    'Chandigarh': { start: 160000, end: 160999 },
    'Dadra and Nagar Haveli and Daman and Diu': { start: 396000, end: 396999 },
    'Lakshadweep': { start: 682000, end: 682999 },
    'Andaman and Nicobar Islands': { start: 744000, end: 744999 }
};

const countryData = {
    'IN': {
        name: 'India',
        phonePattern: /^[6-9]\d{9}$/,
        pincodePattern: /^\d{6}$/,
        phoneFormat: '10-digit number starting with 6-9',
        pincodeFormat: 'valid 6-digit Indian pincode',
        states: [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
            'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
            'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
            'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
            'Ladakh', 'Puducherry', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
            'Lakshadweep', 'Andaman and Nicobar Islands'
        ]
    },
    'US': {
        name: 'United States',
        phonePattern: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,
        pincodePattern: /^\d{5}(-\d{4})?$/,
        phoneFormat: '10-digit US phone number',
        pincodeFormat: '5-digit ZIP or 9-digit ZIP+4',
        states: [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
            'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
            'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
            'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
            'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
            'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
            'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
            'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
            'West Virginia', 'Wisconsin', 'Wyoming', 'Washington D.C.'
        ]
    },
    'GB': {
        name: 'United Kingdom',
        phonePattern: /^(\+44|0)?[1-9]\d{8,9}$/,
        pincodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
        phoneFormat: 'UK phone number (11 digits)',
        pincodeFormat: 'UK postcode format',
        states: [
            'England', 'Scotland', 'Wales', 'Northern Ireland'
        ]
    },
    'CA': {
        name: 'Canada',
        phonePattern: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,
        pincodePattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
        phoneFormat: '10-digit Canadian phone number',
        pincodeFormat: 'Canadian postal code (A1A 1A1)',
        states: [
            'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
            'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
            'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec',
            'Saskatchewan', 'Yukon'
        ]
    },
    'AU': {
        name: 'Australia',
        phonePattern: /^(\+61|0)?[2-478]\d{8}$/,
        pincodePattern: /^\d{4}$/,
        phoneFormat: 'Australian phone number',
        pincodeFormat: '4-digit postcode',
        states: [
            'Australian Capital Territory', 'New South Wales', 'Northern Territory',
            'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
        ]
    }
};

let filter = '';
let page = 1;

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'failed': return 'bg-danger text-white';
        case 'pending': return 'bg-warning text-dark';
        case 'processing': return 'bg-info text-white';
        case 'shipped': return 'bg-primary text-white';
        case 'delivered': return 'bg-success text-white';
        case 'cancelled': return 'bg-danger text-white';
        case 'return req': return 'bg-secondary text-white';
        case 'returnrequested': return 'bg-secondary text-white';
        case 'returned': return 'bg-dark text-white';
        case 'returnrejected':
        case 'reutrnrejected': return 'bg-danger text-white';
        default: return 'bg-light text-dark';
    }
}

function validateIndianPincode(pincode, state) {
    if (!/^\d{6}$/.test(pincode)) return false;
    const pincodeNum = parseInt(pincode);
    if (pincodeNum === 123456 || pincodeNum === 0 || pincodeNum === 999999) return false;
    if (state && validIndianPincodes[state]) {
        const range = validIndianPincodes[state];
        return pincodeNum >= range.start && pincodeNum <= range.end;
    }
    const validRanges = [
        { start: 110000, end: 110099 },
        { start: 120000, end: 136999 },
        { start: 140000, end: 160999 },
        { start: 170000, end: 177999 },
        { start: 180000, end: 194999 },
        { start: 200000, end: 285999 },
        { start: 300000, end: 345999 },
        { start: 360000, end: 396999 },
        { start: 400000, end: 445999 },
        { start: 450000, end: 497999 },
        { start: 500000, end: 535999 },
        { start: 560000, end: 591999 },
        { start: 600000, end: 643999 },
        { start: 670000, end: 695999 },
        { start: 700000, end: 743999 },
        { start: 744000, end: 744999 },
        { start: 750000, end: 770999 },
        { start: 780000, end: 799999 },
        { start: 800000, end: 855999 }
    ];
    return validRanges.some(range => pincodeNum >= range.start && pincodeNum <= range.end);
}

function getCountryValidation(countryCode) {
    return countryData[countryCode] || countryData['IN'];
}

function showFieldError(field, errorElement, message) {
    if (!field) return;
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.textContent = message;
    }
}

function validateField(field) {
    const fieldId = field.id.replace('edit', '').toLowerCase();
    const errorElement = document.getElementById(`${field.id}Error`);
    const value = field.value.trim();
    const countrySelect = document.getElementById(field.id.includes('edit') ? 'editCountry' : 'country');
    const countryCode = countrySelect ? countrySelect.value : 'IN';
    const countryInfo = getCountryValidation(countryCode);

    if (fieldId === 'phone' || fieldId === 'editphone') {
        if (!countryInfo.phonePattern.test(value)) {
            showFieldError(field, errorElement, `Enter a valid ${countryInfo.phoneFormat}`);
            return false;
        }
    } else if (fieldId === 'altphone' || fieldId === 'editaltphone') {
        if (value && !countryInfo.phonePattern.test(value)) {
            showFieldError(field, errorElement, `Enter a valid ${countryInfo.phoneFormat}`);
            return false;
        }
    } else if (fieldId === 'pincode' || fieldId === 'editpincode') {
        if (countryCode === 'IN') {
            const stateSelect = document.getElementById(field.id.includes('edit') ? 'editState' : 'state');
            const selectedState = stateSelect ? stateSelect.value : '';
            if (!countryInfo.pincodePattern.test(value)) {
                showFieldError(field, errorElement, 'Enter a valid 6-digit pincode');
                return false;
            }
            if (!validateIndianPincode(value, selectedState)) {
                const errorMsg = selectedState ? `Enter a valid pincode for ${selectedState}` : 'Enter a valid Indian pincode';
                showFieldError(field, errorElement, errorMsg);
                return false;
            }
        } else {
            if (!countryInfo.pincodePattern.test(value)) {
                showFieldError(field, errorElement, `Enter a valid ${countryInfo.pincodeFormat}`);
                return false;
            }
        }
        } else if (fieldId === 'state' || fieldId === 'editstate') {
        // Make state validation case-insensitive
        const stateLower = value.toLowerCase();
        const validState = countryInfo.states.some(state => 
            state.toLowerCase() === stateLower
        );
        
        if (!validState) {
            showFieldError(field, errorElement, `Please select a valid state for ${countryInfo.name}`);
            return false;
        }
    } else if (fieldId === 'username' || fieldId === 'editusername') {
        if (!patterns.username.test(value)) {
            showFieldError(field, errorElement, 'Username must be 3-20 letters only');
            return false;
        }
    } else if (fieldId === 'name' || fieldId === 'editname') {
        if (!patterns.name.test(value)) {
            showFieldError(field, errorElement, 'Name must be 2-50 letters only');
            return false;
        }
    } else if (fieldId === 'city' || fieldId === 'editcity') {
        if (!patterns.city.test(value)) {
            showFieldError(field, errorElement, 'City name must be 2-50 letters only');
            return false;
        }
    } else if (fieldId === 'street' || fieldId === 'editstreet') {
        if (!patterns.street.test(value)) {
            showFieldError(field, errorElement, 'Street address must be 5-100 characters');
            return false;
        }
    } else if (field.required && !value) {
        showFieldError(field, errorElement, 'This field is required');
        return false;
    }

    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    if (errorElement) errorElement.style.display = 'none';
    return true;
}

function updateStateOptions(countrySelectId, stateSelectId) {
    const countrySelect = document.getElementById(countrySelectId);
    const stateSelect = document.getElementById(stateSelectId);
    if (!countrySelect || !stateSelect) return;
    const countryCode = countrySelect.value;
    const countryInfo = getCountryValidation(countryCode);
    stateSelect.innerHTML = '<option value="">Select State/Province</option>';
    countryInfo.states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
    stateSelect.classList.remove('is-valid', 'is-invalid');
    const errorElement = document.getElementById(`${stateSelectId}Error`);
    if (errorElement) errorElement.style.display = 'none';
}

function validateSelect(select) {
    const errorElement = document.getElementById(`${select.id}Error`);
    if (select.required && !select.value) {
        select.classList.add('is-invalid');
        select.classList.remove('is-valid');
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = 'Please select an option';
        }
        return false;
    }
    select.classList.remove('is-invalid');
    select.classList.add('is-valid');
    if (errorElement) errorElement.style.display = 'none';
    return true;
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[pattern], input[required]');
    const selects = form.querySelectorAll('select[required]');
    inputs.forEach(input => { isValid &= validateField(input); });
    selects.forEach(select => { isValid &= validateSelect(select); });
    return isValid;
}

function showAlert(message, type) {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '2000';
    alertDiv.style.minWidth = '300px';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        if (typeof bootstrap !== 'undefined') {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        } else {
            alertDiv.remove();
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function () {
    // Activate the first tab
    const triggerTab = document.querySelector('.profile-nav a[data-bs-toggle="tab"]');
    if (triggerTab && typeof bootstrap !== 'undefined') {
        const tab = new bootstrap.Tab(triggerTab);
        tab.show();
    }

    let profileDeleteReq = false;
    let cropper;
    let croppedImageBlob = null;
    const fileInput = document.getElementById('profilePhotoUpload');
    const previewImage = document.getElementById('editProfileImagePreview');
    const cropImage = document.getElementById('imageToCrop');

    let cropModal, editModal;
    if (document.getElementById('cropImageModal') && typeof bootstrap !== 'undefined') {
        cropModal = new bootstrap.Modal(document.getElementById('cropImageModal'));
    }
    if (document.getElementById('editProfileModal') && typeof bootstrap !== 'undefined') {
        editModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    }

    const countrySelect = document.getElementById('country');
    const editCountrySelect = document.getElementById('editCountry');

    if (countrySelect) {
        countrySelect.addEventListener('change', () => updateStateOptions('country', 'state'));
        updateStateOptions('country', 'state');
    }
    if (editCountrySelect) {
        editCountrySelect.addEventListener('change', () => updateStateOptions('editCountry', 'editState'));
        updateStateOptions('editCountry', 'editState');
    }

    const cameraBtn = document.querySelector('#openFiles');
    if (cameraBtn && fileInput) {
        cameraBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file || !file.type.startsWith('image/')) {
                showAlert('Please select a valid image file', 'danger');
                return;
            }
            const reader = new FileReader();
            reader.onload = e => {
                if (cropImage) {
                    cropImage.src = e.target.result;
                    if (cropper) cropper.destroy();
                    if (typeof Cropper !== 'undefined') {
                        cropper = new Cropper(cropImage, {
                            aspectRatio: 1,
                            viewMode: 1,
                            autoCropArea: 0.9,
                            responsive: true,
                            ready: updateCropDimensions,
                            crop: updateCropDimensions
                        });
                    }
                    if (editModal) editModal.hide();
                    if (cropModal) cropModal.show();
                }
            };
            reader.readAsDataURL(file);
        });
    }

    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const rotateLeftBtn = document.getElementById('rotateLeftBtn');
    const rotateRightBtn = document.getElementById('rotateRightBtn');
    if (zoomInBtn) zoomInBtn.onclick = () => cropper?.zoom(0.1);
    if (zoomOutBtn) zoomOutBtn.onclick = () => cropper?.zoom(-0.1);
    if (rotateLeftBtn) rotateLeftBtn.onclick = () => cropper?.rotate(-15);
    if (rotateRightBtn) rotateRightBtn.onclick = () => cropper?.rotate(15);

    function updateCropDimensions() {
        const data = cropper?.getData();
        const dimensionsEl = document.getElementById('cropDimensions');
        if (data && dimensionsEl) {
            dimensionsEl.textContent = `${Math.round(data.width)}×${Math.round(data.height)}`;
        }
    }

    const cropImageBtn = document.getElementById('cropImageBtn');
    if (cropImageBtn) {
        cropImageBtn.onclick = () => {
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
            canvas.toBlob(blob => {
                croppedImageBlob = blob;
                if (previewImage) previewImage.src = URL.createObjectURL(blob);
                if (cropModal) cropModal.hide();
                if (editModal) editModal.show();
            }, 'image/jpeg');
        };
    }

    const saveProfileBtn = document.getElementById('saveProfileChanges');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            const spinner = saveProfileBtn.querySelector('.spinner-border');
            const text = saveProfileBtn.querySelector('.btn-text');
            let isValid = true;
            const usernameInput = document.getElementById('editUsername');
            if (usernameInput) {
                const username = usernameInput.value.trim();
                if (!patterns.username.test(username)) {
                    showFieldError(usernameInput, usernameInput.nextElementSibling, "Username must be 3-20 letters only");
                    isValid = false;
                }
            }
            const phoneInput = document.getElementById('editphone');
            if (phoneInput) {
                const phone = phoneInput.value.trim();
                const countryCode = document.getElementById('editCountry')?.value || 'IN';
                const countryInfo = getCountryValidation(countryCode);
                if (!countryInfo.phonePattern.test(phone)) {
                    showFieldError(phoneInput, phoneInput.nextElementSibling, `Enter a valid ${countryInfo.phoneFormat}`);
                    isValid = false;
                }
            }
            if (!isValid) return;

            try {
                const formData = new FormData();
                if (usernameInput) formData.append('username', usernameInput.value.trim());
                if (phoneInput) formData.append('phone', phoneInput.value.trim());
                if (croppedImageBlob) {
                    formData.append('profilePhoto', croppedImageBlob, 'profile.jpg');
                } else if (fileInput?.files[0]) {
                    formData.append('profilePhoto', fileInput.files[0]);
                }
                if (profileDeleteReq) formData.append('profileDeleteReq', profileDeleteReq);

                saveProfileBtn.disabled = true;
                if (spinner) spinner.classList.remove('d-none');
                if (text) text.textContent = "Saving...";

                const res = await fetch('/editProfile', { method: 'PATCH', body: formData });
                profileDeleteReq = false;
                croppedImageBlob = null;
                sessionStorage.setItem('profileToast', res.ok ? 'success' : 'error');
                window.location.reload();
            } catch (error) {
                sessionStorage.setItem('profileToast', 'error');
                window.location.reload();
            }
        });
    }

    const toast = sessionStorage.getItem('profileToast');
    if (toast && typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: toast === 'success' ? 'success' : 'error',
            title: toast === 'success' ? 'Profile saved successfully!' : 'Something went wrong!',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
        });
        sessionStorage.removeItem('profileToast');
    }

    const removeBtn = document.getElementById('removeImageBtn');
    if (removeBtn && previewImage) {
        removeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (typeof Swal === 'undefined') {
                if (!confirm('Are you sure?')) return;
            } else {
                const result = await Swal.fire({
                    toast: true,
                    icon: 'warning',
                    title: 'Are you sure?',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes!',
                    cancelButtonText: 'No',
                    position: 'top-end'
                });
                if (!result.isConfirmed) return;
            }
            profileDeleteReq = true;
            const userName = previewImage.dataset.username || 'User';
            previewImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2e7d32&color=fff&size=160`;
            removeBtn.style.display = 'none';
        });
    }

    const cancelBtn = document.getElementById('cancellProfileEditBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => window.location.reload());

    const addAddressForm = document.getElementById('addAddressForm');
    const saveAddressBtn = document.getElementById('saveAddress');
    if (addAddressForm) {
        addAddressForm.querySelectorAll('input[pattern], input[required]').forEach(input => {
            input.addEventListener('input', () => validateField(input));
            input.addEventListener('blur', () => validateField(input));
        });
        addAddressForm.querySelectorAll('select[required]').forEach(select => {
            select.addEventListener('change', () => validateSelect(select));
        });
    }

    if (saveAddressBtn) {
        saveAddressBtn.addEventListener('click', async function () {
            if (!validateForm(addAddressForm)) return;
            const formData = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                altPhone: document.getElementById('altPhone').value.trim() || undefined,
                addressType: document.getElementById('addressType').value,
                country: document.getElementById('country').value,
                state: document.getElementById('state').value.trim(),
                city: document.getElementById('city').value.trim(),
                street: document.getElementById('street').value.trim(),
                pincode: document.getElementById('pincode').value.trim()
            };
            try {
                const response = await fetch('/addAddress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (response.ok) {
                    if (typeof Swal !== 'undefined') {
                        await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Address added!', showConfirmButton: false, timer: 1000 });
                    }
                    if (typeof bootstrap !== 'undefined') {
                        const addModal = bootstrap.Modal.getInstance(document.getElementById('addAddressModal'));
                        if (addModal) addModal.hide();
                    }
                    await reloadAddressSection();
                }
            } catch (error) { console.error(error); }
        });
    }

    const editAddressForm = document.getElementById('editAddressForm');
    const updateAddressBtn = document.getElementById('updateAddress');
    if (editAddressForm) {
        editAddressForm.querySelectorAll('input[pattern], input[required]').forEach(input => {
            input.addEventListener('input', () => validateField(input));
            input.addEventListener('blur', () => validateField(input));
        });
        editAddressForm.querySelectorAll('select[required]').forEach(select => {
            select.addEventListener('change', () => validateSelect(select));
        });
    }

    if (updateAddressBtn) {
        updateAddressBtn.addEventListener('click', async function () {
            if (!validateForm(editAddressForm)) return;
            const formData = {
                _id: document.getElementById('editAddressId').value,
                addressType: document.getElementById('editAddressType').value,
                name: document.getElementById('editName').value.trim(),
                street: document.getElementById('editStreet').value.trim(),
                city: document.getElementById('editCity').value.trim(),
                state: document.getElementById('editState').value.trim(),
                pincode: document.getElementById('editPincode').value.trim(),
                country: document.getElementById('editCountry').value,
                phone: document.getElementById('editPhone').value.trim(),
                altPhone: document.getElementById('editAltPhone').value.trim() || undefined
            };
            try {
                const response = await fetch(`/editAddress?addressId=${encodeURIComponent(formData._id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (response.ok) {
                    if (typeof Swal !== 'undefined') {
                        await Swal.fire({ icon: 'success', title: 'Address updated!', timer: 1500, showConfirmButton: false });
                    }
                    if (typeof bootstrap !== 'undefined') {
                        const editModal = bootstrap.Modal.getInstance(document.getElementById('editAddressModal'));
                        if (editModal) editModal.hide();
                    }
                    await reloadAddressSection();
                }
            } catch (error) { console.error(error); }
        });
    }

    const printOrderBtn = document.getElementById('printOrderBtn');
    if (printOrderBtn) printOrderBtn.addEventListener('click', () => window.print());

    // Clear Add Address Modal on Close
    const addAddressModal = document.getElementById('addAddressModal');
    if (addAddressModal) {
        addAddressModal.addEventListener('hidden.bs.modal', function () {
            if (addAddressForm) {
                addAddressForm.reset();
                addAddressForm.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
                    el.classList.remove('is-invalid', 'is-valid');
                });
                addAddressForm.querySelectorAll('.invalid-feedback').forEach(el => {
                    el.style.display = 'none';
                });
                // Reset state options if applicable
                updateStateOptions('country', 'state');
            }
        });
    }

    // Dropdown filter for orders
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach((item) => {
        item.addEventListener('click', async function (e) {
            e.preventDefault();
            filter = e.target.getAttribute('data-filter') || '';
            await paginationForOrderSection(1);
        });
    });
});

window.paginationForOrderSection = async function (pageNumber) {
    try {
        const response = await fetch(`/userProfile?filter=${encodeURIComponent(filter)}&page=${encodeURIComponent(pageNumber)}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) return;
        const data = await response.json();
        renderOrders(data.order || [], data.currentPage || 1, data.totalPage || 1);
    } catch (error) { console.error(error); }
};


function renderOrders(orders, currentPage, totalPage) {
    const container = document.querySelector('#orders .card-body');
    if (!container) return;
    container.innerHTML = '';
    if (orders.length === 0) {
        container.innerHTML = `<div class="empty-state text-center py-5"><h4>No Orders Found</h4><p>No orders with status <b>${filter}</b> were found.</p></div>`;
        return;
    }
    orders.forEach((order, index) => {
        const retryPayment = order.status === 'Failed' || (order.paymentMethod === 'RPAY' && order.paymentStatus === 'Pending');
       container.innerHTML += `
<div class="order-item p-3 mb-3 border rounded">
    <div class="d-flex justify-content-between flex-wrap mb-2">
        <h5>Order #${order.orderId}</h5>
        <span class="badge ${getStatusBadgeClass(order.status)} p-2">${order.status}</span>
    </div>
    <p class="text-muted mb-1">Placed on ${new Date(order.createdOn).toLocaleDateString()}</p>
    <div class="d-flex justify-content-between flex-wrap align-items-center">
        <div>
            <p>${order.orderedItems.length} items • Total: ₹${order.finalAmount.toFixed(2)}</p>
        </div>
        <div>
            <a href="/orderDetailPage?orderId=${order.orderId}" class="btn btn-sm btn-outline-primary me-2">
                <i class="fas fa-eye me-1"></i> Details
            </a>
            ${order.status === 'Failed' && order.paymentMethod === 'RPAY' ? `
                <a href="/paymentFaildRetry?orderId=${order.orderId}" class="btn btn-sm btn-warning ms-1">
                    <i class="fas fa-redo-alt me-1"></i>Retry Payment
                </a>` : ''}
        </div>
    </div>
</div>`;
    });
    const pagination = document.createElement('div');
    pagination.className = 'pagination mt-3';
    pagination.innerHTML = `
        <div class="pagination">
            ${currentPage > 1 ? `<button onclick="paginationForOrderSection(${currentPage - 1})" class="page-btn">&lt;</button>` : ''}
            <button class="page-btn active">${currentPage}</button>
            <span class="page-info">of ${totalPage}</span>
            ${currentPage < totalPage ? `<button onclick="paginationForOrderSection(${currentPage + 1})" class="page-btn">&gt;</button>` : ''}
        </div>`;
    container.appendChild(pagination);
}

window.loadAddressForEdit = function (addressData) {
    const address = JSON.parse(decodeURIComponent(addressData));
    document.getElementById('editAddressId').value = address._id;
    document.getElementById('editAddressType').value = address.addressType;
    document.getElementById('editName').value = address.name;
    document.getElementById('editStreet').value = address.street;
    document.getElementById('editCity').value = address.city;
    document.getElementById('editCountry').value = address.country;
    updateStateOptions('editCountry', 'editState');
    
    // Case-insensitive state matching
    const stateSelect = document.getElementById('editState');
    for (let option of stateSelect.options) {
        if (option.value.toLowerCase() === address.state.toLowerCase()) {
            stateSelect.value = option.value;
            break;
        }
    }
    
    document.getElementById('editPincode').value = address.pincode;
    document.getElementById('editPhone').value = address.phone;
    document.getElementById('editAltPhone').value = address.altPhone || '';
};

window.confirmDeleteAddress = async function (addressId) {
    if (typeof Swal === 'undefined') {
        if (!confirm('Are you sure?')) return;
    } else {
        const { isConfirmed } = await Swal.fire({ title: "Are you sure?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, delete it!" });
        if (!isConfirmed) return;
    }
    try {
        const res = await fetch(`/deleteAddress?addressId=${encodeURIComponent(addressId)}`, { method: 'DELETE' });
        if (res.ok) await reloadAddressSection();
    } catch (error) { console.error(error); }
};



async function reloadAddressSection() {
    try {
        const res = await fetch('/userProfile');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newAddressTab = doc.querySelector('#address');
        if (newAddressTab) {
            const currentTab = document.querySelector('#address');
            if (currentTab) currentTab.innerHTML = newAddressTab.innerHTML;
        }
    } catch (error) { console.error(error); }
}
