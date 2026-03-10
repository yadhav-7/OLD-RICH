
// Coupon functionality
function toggleCouponDropdown() {
    const list = document.getElementById("couponList");
    const arrow = document.getElementById("arrow");
    if (!list || !arrow) return;
    list.style.display = list.style.display === "block" ? "none" : "block";
    arrow.parentElement.classList.toggle("active");
}

function setCoupon(code) {
    const couponInput = document.getElementById("couponCode");
    if (couponInput) couponInput.value = code;
    const couponList = document.getElementById("couponList");
    if (couponList) couponList.style.display = "none";
}

let alreadyApplied = false;
let couponDiscount = null;

async function applyCoupon() {
    try {
        if (alreadyApplied) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Coupon already applied',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            return;
        }

        const couponInput = document.getElementById("couponCode");
        const code = couponInput ? couponInput.value : '';
        const savingsEl = document.getElementById('savings');
        let savings = savingsEl ? savingsEl.textContent : '₹0.00';

        if (!code) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Please enter or select a coupon',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            return;
        }

        const response = await fetch('/applyCoupon', {
            method: 'post',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ code, savings })
        });

        let result = await response.json();

        if (response.ok) {
            couponDiscount = result.couponDiscount;
            if (savingsEl) savingsEl.textContent = '₹' + Number(result.savings).toFixed(2);

            const couponDiscountEl = document.getElementById('couponDiscount');
            if (couponDiscountEl) couponDiscountEl.textContent = '₹' + Number(result.couponDiscount).toFixed(2);

            const totalCartEl = document.getElementById('totalCart');
            if (totalCartEl) totalCartEl.textContent = '₹' + Number(result.totalCart).toFixed(2);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: result.message || `Coupon applied: ${code}`,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });

            alreadyApplied = true;

            let couponButton = document.getElementById('couponButton');
            if (couponButton) {
                couponButton.innerHTML = `<i class="bi bi-x"></i>`;
                couponButton.onclick = removeCoupon;
            }

        } else {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: result.message || 'Something went wrong!',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        }
    } catch (error) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: error.message || 'Something went wrong!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    }
}

function removeCoupon() {
    try {
        if (!alreadyApplied) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'There is no coupon applied!',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            return;
        }

        alreadyApplied = false;
        const couponCode = document.getElementById('couponCode');
        const totalCart = document.getElementById('totalCart');
        const savings = document.getElementById('savings');
        const couponDiscountEl = document.getElementById('couponDiscount');
        const couponDiscountValue = couponDiscountEl ? parseFloat(couponDiscountEl.textContent.slice(1)) : 0;

        const totalCartValue = totalCart ? parseFloat(totalCart.textContent.slice(1)) : 0;
        const totalSavingsValue = savings ? parseFloat(savings.textContent.slice(1)) : 0;

        if (couponCode) {
            couponCode.value = '';
            couponCode.placeholder = 'Enter coupon code';
        }

        let couponButton = document.getElementById('couponButton');
        if (couponButton) {
            couponButton.innerHTML = '<i class="bi bi-check"></i>';
            couponButton.onclick = applyCoupon;
        }

        if (savings) savings.textContent = '₹' + (totalSavingsValue - couponDiscountValue).toFixed(2);
        if (totalCart) totalCart.textContent = '₹' + (totalCartValue + couponDiscountValue).toFixed(2);
        if (couponDiscountEl) couponDiscountEl.textContent = '₹' + (0).toFixed(2);

    } catch (error) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Something went wrong while removing coupon!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    }
}
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

document.addEventListener('DOMContentLoaded', function() {
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
});

document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('#addAddressForm, #editAddressForm');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            const handler = () => {
                if (input.tagName === 'SELECT') validateSelect(input);
                else validateField(input);
            }
            input.addEventListener('input', handler)
            input.addEventListener('blur', handler)
        })
    })

    const saveAddressBtn = document.getElementById('saveAddressBtn');
    if (saveAddressBtn) {
        saveAddressBtn.addEventListener('click', function () {
            if (!validateForm(document.getElementById('addAddressForm'))) {
                
                const firstError = document.getElementById('addAddressForm').querySelector('.is-invalid');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            saveAddress();
        });
    }
});

async function saveAddress() {
    const saveBtn = document.getElementById('saveAddressBtn');
    const saveText = document.getElementById('saveAddressText');
    const saveSpinner = document.getElementById('saveAddressSpinner');

    if (saveBtn) saveBtn.disabled = true;
    if (saveText) saveText.classList.add('d-none');
    if (saveSpinner) saveSpinner.classList.remove('d-none');

    const addressData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        altPhone: document.getElementById('altPhone').value.trim(),
        addressType: document.getElementById('addressType').value,
        country: document.getElementById('country').value,
        state: document.getElementById('state').value.trim(),
        city: document.getElementById('city').value.trim(),
        street: document.getElementById('street').value.trim(),
        pincode: document.getElementById('pincode').value.trim(),
    };

    try {
        const response = await fetch('/addAddress', {
            method: 'post',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(addressData)
        });
        const result = await response.json();
        if (response.ok) {
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: result.message || 'Address added successfully!',
                showConfirmButton: false, timer: 3000, timerProgressBar: true
            });
            const modalEl = document.getElementById('addAddressModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            addAddressToDOM(result.address);
            document.getElementById('addAddressForm').reset();
            document.getElementById('addAddressForm').querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
        } else {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: result.message || 'Error', showConfirmButton: false, timer: 3000 });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Network error', showConfirmButton: false, timer: 3000 });
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (saveText) saveText.classList.remove('d-none');
        if (saveSpinner) saveSpinner.classList.add('d-none');
    }
}

function addAddressToDOM(address) {
    const addressContainer = document.getElementById('addressContainer');
    if (!addressContainer) return;
    const addressCard = document.createElement('div');
    addressCard.className = 'address-card';
    addressCard.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="address" id="address_${address._id}" value="${address._id}">
            <label class="address-title" for="address_${address._id}">${address.addressType} Address</label>
        </div>
        <div class="address-details">
            <strong>${address.name}</strong><br>${address.city}, ${address.state}<br>${address.street}<br>${address.pincode}
        </div>
        <div class="address-details">
            Phone: ${address.phone}<br>${address.altPhone ? `Alt. Phone: ${address.altPhone}` : ''}
        </div>
        <div class="address-actions">
            <button class="btn btn-outline-premium btn-sm" data-bs-toggle="modal" data-bs-target="#editAddressModal"
                onclick="loadAddressForEdit('${address._id}', '${address.name}', '${address.phone}', '${address.altPhone || ''}', '${address.street}', '${address.country}', '${address.city}', '${address.state}', '${address.pincode}', '${address.addressType}')">
                Edit
            </button>
        </div>
    `;
    addressContainer.appendChild(addressCard);
}

function loadAddressForEdit(id, name, phone, altPhone, street, editCountry, city, state, pincode, addressType) {
    document.getElementById('editAddressId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editPhone').value = phone;
    document.getElementById('editAltPhone').value = altPhone || '';
    document.getElementById('editStreet').value = street;
    document.getElementById('editCity').value = city;
    document.getElementById('editCountry').value = editCountry;
    updateStateOptions('editCountry', 'editState');
    
    // Case-insensitive state matching
    const stateSelect = document.getElementById('editState');
    for (let option of stateSelect.options) {
        if (option.value.toLowerCase() === state.toLowerCase()) {
            stateSelect.value = option.value;
            break;
        }
    }
    
    document.getElementById('editPincode').value = pincode;
    document.getElementById('editAddressType').value = addressType;
}

async function updateAddress() {
    const updateBtn = document.getElementById('updateAddressBtn');
    const updateText = document.getElementById('updateAddressText');
    const updateSpinner = document.getElementById('updateAddressSpinner');

    if (updateBtn) updateBtn.disabled = true;
    if (updateText) updateText.classList.add('d-none');
    if (updateSpinner) updateSpinner.classList.remove('d-none');

    if (!validateForm(document.getElementById('editAddressForm'))) {
        const firstError = document.getElementById('editAddressForm').querySelector('.is-invalid');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (updateBtn) updateBtn.disabled = false;
        if (updateText) updateText.classList.remove('d-none');
        if (updateSpinner) updateSpinner.classList.add('d-none');
        return;
    }

    const addAddressId = document.getElementById('editAddressId').value;
    const addressData = {
        addressType: document.getElementById('editAddressType').value,
        name: document.getElementById('editName').value,
        street: document.getElementById('editStreet').value,
        city: document.getElementById('editCity').value,
        state: document.getElementById('editState').value,
        pincode: document.getElementById('editPincode').value,
        country: document.getElementById('editCountry').value,
        phone: document.getElementById('editPhone').value,
        altPhone: document.getElementById('editAltPhone').value
    };

    try {
        const response = await fetch(`/editAddress?addressId=${encodeURIComponent(addAddressId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addressData)
        });
        const result = await response.json();
        if (response.ok) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: result.message || 'Edited successfully!', showConfirmButton: false, timer: 2000 });
            const modalEl = document.getElementById('editAddressModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            updateAddressInDOM(addAddressId, result.data || addressData);
        } else {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: result.message || 'Failed', showConfirmButton: false, timer: 2000 });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error', showConfirmButton: false, timer: 2000 });
    } finally {
        if (updateBtn) updateBtn.disabled = false;
        if (updateText) updateText.classList.remove('d-none');
        if (updateSpinner) updateSpinner.classList.add('d-none');
    }
}

function updateAddressInDOM(addressId, addressData) {
    try {
        const addressRadio = document.querySelector(`input[name="address"][value="${addressId}"]`);
        if (!addressRadio) return;
        const addressCard = addressRadio.closest('.address-card');
        if (!addressCard) return;

        const addressTitle = addressCard.querySelector('.address-title');
        if (addressTitle) addressTitle.textContent = addressRadio.checked ? 'Default Address' : `${addressData.addressType} Address`;

        const addressDetails = addressCard.querySelectorAll('.address-details');
        if (addressDetails[0]) addressDetails[0].innerHTML = `<strong>${addressData.name}</strong><br>${addressData.city}, ${addressData.state}<br>${addressData.street}<br>${addressData.pincode}`;
        if (addressDetails[1]) addressDetails[1].innerHTML = `Phone: ${addressData.phone}<br>${addressData.altPhone ? `Alt. Phone: ${addressData.altPhone}` : ''}`;

        const editButton = addressCard.querySelector('.btn-outline-premium');
        if (editButton) {
            editButton.setAttribute('onclick', `loadAddressForEdit('${addressId}', '${addressData.name}', '${addressData.phone}', '${addressData.altPhone || ''}', '${addressData.street}', '${addressData.country}', '${addressData.city}', '${addressData.state}', '${addressData.pincode}', '${addressData.addressType}')`);
        }
    } catch (error) { console.error(error); }
}

async function proceedToPayment(userId) {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const placeOrderText = document.getElementById('placeOrderText');
    const placeOrderSpinner = document.getElementById('placeOrderSpinner');

    if (placeOrderBtn) placeOrderBtn.disabled = true;
    if (placeOrderText) placeOrderText.classList.add('d-none');
    if (placeOrderSpinner) placeOrderSpinner.classList.remove('d-none');

    const totalCartEl = document.getElementById('totalCart');
    let totalCart = totalCartEl ? parseInt(totalCartEl.textContent.slice(1)) : 0;

    const couponInput = document.getElementById("couponCode");
    let code = couponInput ? couponInput.value : null;

    const selectedItemsRaw = document.getElementById('selectedItems').value;
    const selectedItems = JSON.parse(selectedItemsRaw);
    const orderId = document.getElementById('orderId')?.value;

    try {
        const selectedAddress = document.querySelector('input[name="address"]:checked')?.value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

        if (!selectedAddress || !paymentMethod) {
            Swal.fire('Missing Info', 'Please select both address and payment method.', 'warning');
            if (placeOrderBtn) placeOrderBtn.disabled = false;
            if (placeOrderText) placeOrderText.classList.remove('d-none');
            if (placeOrderSpinner) placeOrderSpinner.classList.add('d-none');
            return;
        }

        const data = {
            addressId: selectedAddress,
            paymentMethod: paymentMethod,
            selectedItems: selectedItems,
            couponApplied: alreadyApplied,
            code: code,
            couponDiscount: couponDiscount,
            retryPayment: window.retryPayment,
            orderId: orderId
        };

        if (paymentMethod === 'COD' || paymentMethod === 'WALLET') {
            if (paymentMethod === 'COD' && totalCart >= 1000) {
                if (typeof Toastify !== 'undefined') {
                    Toastify({ text: 'Order above Rs 1000 not allowed for COD', duration: 3000, gravity: "top", position: "right", backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)" }).showToast();
                } else alert('Order above Rs 1000 not allowed for COD');
                if (placeOrderBtn) placeOrderBtn.disabled = false;
                if (placeOrderText) placeOrderText.classList.remove('d-none');
                if (placeOrderSpinner) placeOrderSpinner.classList.add('d-none');
                return;
            }

            const response = await fetch('/procedToCheckOut', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) window.location.href = `/orderSuccess?orderId=${encodeURIComponent(result.orderId)}`;
            else {
                if (typeof Toastify !== 'undefined') Toastify({ text: result.message || "Error", duration: 3000, gravity: "top", position: "right", backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)" }).showToast();
                else alert(result.message || "Error");
                if (placeOrderBtn) placeOrderBtn.disabled = false;
                if (placeOrderText) placeOrderText.classList.remove('d-none');
                if (placeOrderSpinner) placeOrderSpinner.classList.add('d-none');
            }
        } else if (paymentMethod === 'RPAY') {
            const endpoint = window.retryPayment !== true ? '/create-razorpay-order' : '/reCreateRazorpayOrder';
            const res = await fetch(endpoint, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const order = await res.json();
            if (!order || !order.orderId) {
                if (typeof Toastify !== 'undefined') Toastify({ text: "Failed to initiate payment", duration: 3000, gravity: "top", position: "center", backgroundColor: "linear-gradient(to right, #ff9966, #ff5e62)" }).showToast();
                if (placeOrderBtn) placeOrderBtn.disabled = false;
                if (placeOrderText) placeOrderText.classList.remove('d-none');
                if (placeOrderSpinner) placeOrderSpinner.classList.add('d-none');
            } else {
                const options = {
                    key: window.CHECKOUT_CONFIG?.razorpayKeyId || "",
                    amount: order.amount,
                    currency: order.currency,
                    name: "OLDRICH",
                    description: "Order Payment",
                    order_id: order.orderId,
                    handler: async function (response) {
                        try {
                            const verifyRes = await fetch("/verify-razorpay-payment", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    selectedItems, userId, address: selectedAddress,
                                    couponApplied: data.couponApplied, couponCode: code,
                                }),
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.success) window.location.href = `/orderSuccess?orderId=${encodeURIComponent(verifyData.orderId)}`;
                            else window.location.href = `/paymentFaildPage?razorPayOrderId=${encodeURIComponent(order.orderId)}`;
                        } catch (err) {
                            console.error(err);
                            if (typeof Toastify !== 'undefined') Toastify({ text: "Checkout error", duration: 4000, gravity: "top", position: "center", backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)" }).showToast();
                        }
                    }
                };
                const rzp = new Razorpay(options);
                rzp.open();
                rzp.on('payment.failed', () => { window.location.href = `/paymentFaildPage?razorPayOrderId=${encodeURIComponent(order.orderId)}`; });
                if (placeOrderBtn) placeOrderBtn.disabled = false;
                if (placeOrderText) placeOrderText.classList.remove('d-none');
                if (placeOrderSpinner) placeOrderSpinner.classList.add('d-none');
            }
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Failed', 'Error occurred.', 'error');
        if (placeOrderBtn) placeOrderBtn.disabled = false;
        if (placeOrderText) placeOrderText.classList.remove('d-none');
        if (placeOrderSpinner) placeOrderSpinner.classList.add('d-none');
    }
}
