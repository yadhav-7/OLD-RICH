
// DOM Elements
const addCouponBtn = document.getElementById('addCouponBtn');
const couponModal = document.getElementById('couponModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveCouponBtn = document.getElementById('saveCouponBtn');
const couponForm = document.getElementById('couponForm');
const modalTitle = document.getElementById('modalTitle');
const couponId = document.getElementById('couponId');
const tableBody = document.getElementById('tableBody');
const searchForm = document.querySelector('.search-form');
const searchInput = document.getElementById('searchInput');
const searchResetBtn = document.getElementById('searchResetBtn');
const currentPageElement = document.getElementById('currentPage');

// Event Listeners for Modal
addCouponBtn?.addEventListener('click', () => {
    couponForm.reset();
    clearErrors();
    couponId.value = '';
    if (modalTitle) modalTitle.textContent = 'Add New Coupon';
    couponModal?.classList.add('show');
});

closeModal?.addEventListener('click', () => {
    couponModal?.classList.remove('show');
});

cancelBtn?.addEventListener('click', () => {
    couponModal?.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === couponModal) {
        couponModal.classList.remove('show');
    }
});

// Clear error messages when user starts typing
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', function () {
        const errorId = this.id + 'Error';
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
});

// Save Coupon
saveCouponBtn?.addEventListener("click", async () => {
    try {
        // Browser validation
        if (!couponForm?.checkValidity()) {
            couponForm?.reportValidity();
            return;
        }

        const isAdd = modalTitle?.textContent === "Add New Coupon";
        const isEdit = modalTitle?.textContent === "Edit Coupon";

        // Collect fields
        const formValues = {
            name: document.getElementById("name").value,
            code: document.getElementById("code").value,
            amount: parseFloat(document.getElementById("amount").value),
            minimumPrice: parseFloat(document.getElementById("minimumPrice").value),
            maxUsage: parseInt(document.getElementById("maxUsage").value),
            isList: document.getElementById("isList").value === "true",
            expireOn: new Date(document.getElementById("expireOn").value)
        };

        const errors = validateCouponForm();
        const isValid = displayErrors(errors);
        if (!isValid) return;


        if (isAdd) {
            const response = await fetch(`/admin/addCoupon?page=${encodeURIComponent(1)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ formData: formValues })
            });

            const result = await response.json();

            if (!response.ok) {
                return Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: result.message || "Failed to add!",
                    showConfirmButton: false,
                    timer: 2000
                });
            }

            // Close modal
            couponModal.classList.remove("show");

            // Reload first
            window.location.reload();

            // Then show notification after reload (it will show when page loads)
            localStorage.setItem('showCouponSuccess', 'true');

            return;
        }
        // --------------------------
        //  EDIT COUPON
        // --------------------------
        if (isEdit) {
            const couponData = {
                name: formValues.name,
                code: formValues.code,
                amount: formValues.amount,
                minimumPrice: formValues.minimumPrice,
                maxUsage: formValues.maxUsage,
                isList: document.getElementById("isList").value === "true",
                expireOn: document.getElementById("expireOn").value
            };

            const response = await fetch(
                `/admin/editCoupon?id=${encodeURIComponent(couponId.value)}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ couponData })
                }
            );

            const result = await response.json();

            couponModal.classList.remove("show");

            if (!response.ok) {
                return (typeof Toastify !== 'undefined') ? Toastify({
                    text: result.message || "Update failed",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                        color: "#fff",
                        fontWeight: "500",
                        borderRadius: "8px",
                        padding: "10px 16px"
                    }
                }).showToast() : alert(result.message || "Update failed");
            }

            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: "Coupon updated successfully!",
                    duration: 1500,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "linear-gradient(to right, #4CAF50, #45a049)",
                        color: "#fff",
                        fontWeight: "500",
                        borderRadius: "8px",
                        padding: "10px 16px"
                    }
                }).showToast();
            }

            const rowId = `row-${couponData.code}`;
            const row = document.getElementById(rowId);

            if (row) {
                updateDOMRow(row, couponData);
            } else {
                refreshCurrentPage();
            }

        }


    } catch (error) {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: "Something went wrong, please try again later!",
                duration: 5000,
                gravity: "top",
                position: "center",
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                    color: "#fff",
                    padding: "16px",
                    borderRadius: "8px"
                }
            }).showToast();
        } else {
            console.error(error);
        }
    }
});


function updateDOMRow(row, coupon) {
    row.querySelector(".c-name").textContent = coupon.name;
    row.querySelector(".c-code span").textContent = coupon.code;
    row.querySelector(".c-amount").textContent = `₹${coupon.amount}`;
    row.querySelector(".c-min").textContent = `₹${coupon.minimumPrice}`;
    row.querySelector(".c-max").textContent = coupon.maxUsage;

    const expire = new Date(coupon.expireOn);
    row.querySelector(".c-expire-date").textContent = expire.toLocaleDateString("en-GB");
    row.querySelector(".c-expire-time").textContent = expire.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // Visibility
    const visible = row.querySelector(".c-visible span");
    if (visible) visible.textContent = coupon.isList ? "Public" : "Private";

    // Status
    const statusSpan = row.querySelector(".c-status span");
    const isExpired = expire < new Date();
    if (statusSpan) {
        statusSpan.textContent = isExpired ? "Expired" : "Valid";
        statusSpan.style.color = isExpired ? "#d32f2f" : "#388e3c";
    }
}



async function refreshCurrentPage() {
    const currentPageEl = document.getElementById("currentPage");
    const currentPage = currentPageEl ? currentPageEl.textContent : 1;

    const res = await fetch(`/admin/couponPage?page=${currentPage}`);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    const tableBody = document.getElementById("tableBody");
    const newTableBody = doc.getElementById("tableBody");
    if (tableBody && newTableBody) {
        tableBody.innerHTML = newTableBody.innerHTML;
    }
}

// Check if we need to show success message after reload
window.addEventListener('load', function () {
    if (localStorage.getItem('showCouponSuccess') === 'true') {
        setTimeout(() => {
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: "Coupon added successfully!",
                    duration: 1500,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "linear-gradient(to right, #ffc107, #ffd54f)",
                        color: "#1a1a1a",
                        fontWeight: "500",
                        borderRadius: "8px",
                        padding: "10px 16px"
                    }
                }).showToast();
            }

            // Clear the flag
            localStorage.removeItem('showCouponSuccess');
        }, 100); // Small delay
    }
});

function addCouponRow(coupon) {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

    const createdDate = new Date(coupon.createdOn).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
    });

    const expireDate = new Date(coupon.expireOn).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
    });

    const expireTime = new Date(coupon.expireOn).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit"
    });

    // Check if we need to maintain only 3 coupons per page
    const currentRows = tbody.querySelectorAll('tr');
    if (currentRows.length >= 3) {
        // Remove the last row to maintain only 3 coupons
        currentRows[currentRows.length - 1].remove();
    }

    tbody.insertAdjacentHTML("afterbegin", `
        <tr id="row-${coupon.code}">
            <td class="c-name">${coupon.name}</td>
            <td class="c-code"><span class="code">${coupon.code}</span></td>
            <td class="c-created">${createdDate}</td>
            <td class="c-expire-date">${expireDate}</td>
            <td class="c-expire-time">${expireTime}</td>
            <td class="c-amount">₹${coupon.amount}</td>
            <td class="c-min">₹${coupon.minimumPrice}</td>
            <td class="c-status">
                <span class="badge ${new Date(coupon.expireOn) < new Date() ? "expired" : "valid"}"
                    style="color:${new Date(coupon.expireOn) < new Date() ? "#d32f2f" : "#388e3c"}">
                    ${new Date(coupon.expireOn) < new Date() ? "Expired" : "Valid"}
                </span>
            </td>
            <td class="c-visible">
                <span id="visibleStatus${coupon.code}" class="badge private">
                    ${coupon.isList ? "Public" : "Private"}
                </span>
            </td>
            <td class="c-max">${coupon.maxUsage}</td>
            <td class="actions">
                <button class="btn btn-soft btn-small edit-btn" data-id="${coupon._id}" data-code="${coupon.code}">Edit</button>
                <button class="btn btn-neutral btn-small list-btn"
                        data-id="${coupon.code}" data-status="${coupon.isList ? "Public" : "private"}">
                    ${coupon.isList ? "unList" : "List"}
                </button>
                <button class="btn btn-neutral btn-small delete-btn" data-id="${coupon.code}">Delete</button>
            </td>
        </tr>
    `);
}

function updateCouponRow(coupon) {
    const row = document.getElementById(`row-${coupon.code}`);
    if (!row) return;

    row.querySelector(".c-name").textContent = coupon.name;
    row.querySelector(".c-code span").textContent = coupon.code;

    row.querySelector(".c-created").textContent =
        new Date(coupon.createdOn).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });

    row.querySelector(".c-expire-date").textContent =
        new Date(coupon.expireOn).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });

    row.querySelector(".c-expire-time").textContent =
        new Date(coupon.expireOn).toLocaleTimeString("en-GB", {
            hour: "2-digit", minute: "2-digit"
        });

    row.querySelector(".c-amount").textContent = `₹${coupon.amount}`;
    row.querySelector(".c-min").textContent = `₹${coupon.minimumPrice}`;

    // Status
    const statusSpan = row.querySelector(".c-status span");
    const expired = new Date(coupon.expireOn) < new Date();

    if (statusSpan) {
        statusSpan.textContent = expired ? "Expired" : "Valid";
        statusSpan.style.color = expired ? "#d32f2f" : "#388e3c";
    }

    // Visibility
    const visibleSpan = row.querySelector(".c-visible span");
    if (visibleSpan) {
        visibleSpan.textContent = coupon.isList ? "Public" : "Private";
        visibleSpan.id = `visibleStatus${coupon.code}`;
    }

    // Max usage
    row.querySelector(".c-max").textContent = coupon.maxUsage;

    // UPDATE THE BUTTON DATA ATTRIBUTES TOO!
    const editBtn = row.querySelector(".edit-btn");
    const couponIdField = document.getElementById('couponId');
    if (editBtn) {
        editBtn.setAttribute("data-id", coupon._id || (couponIdField ? couponIdField.value : ''));
        editBtn.setAttribute("data-code", coupon.code);
    }

    const listBtn = row.querySelector(".list-btn");
    if (listBtn) {
        listBtn.setAttribute("data-id", coupon.code);
        listBtn.setAttribute("data-status", coupon.isList ? "Public" : "private");
        listBtn.textContent = coupon.isList ? "unList" : "List";
    }

    const deleteBtn = row.querySelector(".delete-btn");
    if (deleteBtn) {
        deleteBtn.setAttribute("data-id", coupon.code);
    }
}

function clearErrors() {
    document.querySelectorAll(".error").forEach(el => el.textContent = "");
}

function displayErrors(errors) {
    clearErrors();

    let hasError = false;

    if (errors.name) {
        document.getElementById("nameError").textContent = errors.name;
        hasError = true;
    }
    if (errors.code) {
        document.getElementById("codeError").textContent = errors.code;
        hasError = true;
    }
    if (errors.amount) {
        document.getElementById("amountError").textContent = errors.amount;
        hasError = true;
    }
    if (errors.minimumPrice) {
        document.getElementById("minimumPriceError").textContent = errors.minimumPrice;
        hasError = true;
    }
    if (errors.maxUsage) {
        document.getElementById("maxUsageError").textContent = errors.maxUsage;
        hasError = true;
    }
    if (errors.isList) {
        document.getElementById("isListError").textContent = errors.isList;
        hasError = true;
    }
    if (errors.expireOn) {
        document.getElementById("expireOnError").textContent = errors.expireOn;
        hasError = true;
    }

    return !hasError; // true if valid, false if errors
}

function validateCouponForm() {
    const errors = {
        name: "",
        code: "",
        amount: "",
        minimumPrice: "",
        maxUsage: "",
        isList: "",
        expireOn: ""
    };

    const name = document.getElementById('name').value.trim();
    const code = document.getElementById('code').value.trim().toUpperCase();
    const amount = document.getElementById('amount').value.trim();
    const minimumPrice = document.getElementById('minimumPrice').value.trim();
    const maxUsage = document.getElementById('maxUsage').value.trim();
    const isList = document.getElementById('isList').value;
    const expireOn = document.getElementById('expireOn').value.trim();

    if (!name) {
        errors.name = "Name is required.";
    } else if (name.length < 3 || name.length > 10) {
        errors.name = "Name must be 3–10 characters.";
    } else if (!/[a-zA-Z]/.test(name)) {
        errors.name = "Name must contain at least one alphabet.";
    }

    const codeRe = /^[A-Z0-9_-]{3,10}$/;
    if (!code) errors.code = "Code is required.";
    else if (!codeRe.test(code)) errors.code = "Code must be 3–10 chars (A-Z, 0-9, _, -).";

    if (amount === "") errors.amount = "Amount is required.";
    else if (isNaN(amount) || Number(amount) < 0) errors.amount = "Amount must be a number ≥ 0.";
    else if (Number(amount) >= Number(minimumPrice)) {
        errors.amount = "Discount Price cannot be equal or more than Minimum Cart value";
    }

    // minimumPrice → number ≥ 0
    if (minimumPrice === "") errors.minimumPrice = "Minimum Price is required.";
    else if (isNaN(minimumPrice) || Number(minimumPrice) < 0) errors.minimumPrice = "Minimum Price must be ≥ 0.";

    // maxUsage → integer ≥ 1
    if (maxUsage === "") errors.maxUsage = "Max Usage is required.";
    else if (!Number.isInteger(Number(maxUsage)) || Number(maxUsage) < 1)
        errors.maxUsage = "Max Usage must be an integer ≥ 1.";

    // isList → must be true/false
    if (isList !== "true" && isList !== "false") {
        errors.isList = "Please select Public or Private.";
    }

    // expireOn → valid future date
    if (!expireOn) {
        errors.expireOn = "Expire date is required.";
    } else {
        const expDate = new Date(expireOn);
        if (isNaN(expDate.getTime())) {
            errors.expireOn = "Expire date must be valid.";
        } else if (expDate <= new Date()) {
            errors.expireOn = "Expire date must be in the future.";
        }
    }

    return errors;
}

// Event Delegation for dynamically created buttons
document.querySelector('tbody')?.addEventListener('click', function (e) {
    // Edit button handling
    if (e.target.classList.contains('edit-btn')) {
        const row = e.target.closest("tr");
        const couponData = {
            id: e.target.dataset.id,
            name: row.querySelector("td:nth-child(1)").textContent.trim(),
            code: row.querySelector(".code").textContent.trim(),
            createdOn: row.querySelector("td:nth-child(3)").textContent.trim(),
            expireOn: row.querySelector("td:nth-child(4)").textContent.trim(),
            expireOnTime: row.querySelector("td:nth-child(5)").textContent.trim(),
            amount: row.querySelector(".c-amount").textContent.replace("₹", "").trim(),
            minimumPrice: row.querySelector(".c-min").textContent.replace("₹", "").trim(),
            maxUsage: row.querySelector(".c-max").textContent.trim(),
            isList: row.querySelector("[id^='visibleStatus']").textContent.trim() === "Public"
        };

        // Populate the form
        document.getElementById('name').value = couponData.name;
        document.getElementById('code').value = couponData.code;
        document.getElementById('amount').value = couponData.amount;
        document.getElementById('minimumPrice').value = couponData.minimumPrice;
        document.getElementById('maxUsage').value = couponData.maxUsage;
        document.getElementById('isList').value = couponData.isList ? "true" : "false";

        // Split the date part ("15 Sep 2025")
        const [day, monthName, year] = couponData.expireOn.split(" ");

        // Get the time part ("05:35" or similar)
        const time = couponData.expireOnTime;

        const monthMap = {
            "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
            "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
            "Sep": "09", "Sept": "09",  // include both to be safe
            "Oct": "10", "Nov": "11", "Dec": "12"
        };

        // Format the date for datetime-local input (YYYY-MM-DDTHH:MM)
        const formattedDate = `${year}-${monthMap[monthName]}-${day.padStart(2, "0")}T${time.slice(0, 5)}`;

        document.getElementById('expireOn').value = formattedDate;

        const couponIdField = document.getElementById('couponId');
        if (couponIdField) couponIdField.value = couponData.id;

        // Update modal title and show
        const modalTitleEl = document.getElementById('modalTitle');
        if (modalTitleEl) modalTitleEl.textContent = 'Edit Coupon';
        document.getElementById('couponModal')?.classList.add('show');
    }

    // Delete button handling
    else if (e.target.classList.contains('delete-btn')) {
        const code = e.target.getAttribute('data-id');
        const row = e.target.closest('tr');
        const couponName = row.querySelector('td:first-child').textContent;

        // Your existing delete logic here
        (async () => {
            const { isConfirmed } = await Swal.fire({
                title: 'Are you sure?',
                text: `You are about to delete the coupon "${couponName}". This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, delete it!'
            });

            if (isConfirmed) {
                const response = await fetch(`/admin/deleteCoupon?code=${encodeURIComponent(code)}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    row.remove();
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Coupon deleted successfully',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                } else {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'Something went wrong!',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                }
            }
        })();
    }

    // List/Unlist button handling
    else if (e.target.classList.contains('list-btn')) {
        const code = e.target.getAttribute('data-id');
        const visibleStatus = document.getElementById(`visibleStatus${code}`);
        const currentStatus = e.target.getAttribute('data-status');

        // Your existing list/unlist logic here
        (async () => {
            try {
                const action = currentStatus === 'private' ? 'List' : 'unList';
                const { isConfirmed } = await Swal.fire({
                    title: `Are you sure?`,
                    text: `Do you want to ${action} this coupon?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: `Yes, ${action}`,
                    cancelButtonText: "Cancel",
                    reverseButtons: true
                });

                if (isConfirmed) {
                    const response = await fetch(`/admin/listUnlistCoupon?code=${encodeURIComponent(code)}`);
                    if (response.ok) {

                        if (currentStatus === 'Public') {
                            // Changing from Public to Private
                            e.target.setAttribute("data-status", "private");
                            e.target.textContent = "List";
                            if (visibleStatus) visibleStatus.textContent = "Private";
                        } else {
                            // Changing from Private to Public
                            e.target.setAttribute("data-status", "Public");
                            e.target.textContent = "unList";
                            if (visibleStatus) visibleStatus.textContent = "Public";
                        }
                    } else {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'error',
                            title: 'Something went wrong!',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                    }
                }
            } catch (error) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Something went wrong!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            }
        })();
    }



});

function createCouponRow(cpn, currentDate) {
    const dateObj = new Date(cpn.expireOn);
    const timeStr = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });

    return `
                <tr id="row-${cpn.code}">
                    <td class="c-name">${cpn.name}</td>
                    <td class="c-code"><span class="code">${cpn.code}</span></td>
                    <td class="c-created">${new Date(cpn.createdOn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td class="c-expire-date">${new Date(cpn.expireOn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td class="c-expire-time">
                        ${timeStr}
                    </td>
                    <td class="c-amount">₹${cpn.amount}</td>
                    <td class="c-min">₹${cpn.minimumPrice}</td>
                    <td class="c-status">
                        ${new Date(cpn.expireOn) < new Date(currentDate)
            ? '<span class="badge expired" style="color:#d32f2f;">Expired</span>'
            : '<span class="badge valid" style="color:#388e3c;">Valid</span>'
        }
                    </td>
                    <td class="c-visible">
                        ${cpn.isList
            ? `<span id="visibleStatus${cpn.code}" class="badge private">Public</span>`
            : `<span id="visibleStatus${cpn.code}" class="badge private">Private</span>`
        }
                    </td>
                    <td class="c-max">${cpn.maxUsage}</td>
                    <td class="actions">
                        <button class="btn btn-soft btn-small edit-btn" data-id="${cpn._id}" data-code="${cpn.code}">Edit</button>
                        ${cpn.isList
            ? `<button class="btn btn-neutral btn-small list-btn" data-id="${cpn.code}" data-status="Public">unList</button>`
            : `<button class="btn btn-neutral btn-small list-btn" data-id="${cpn.code}" data-status="private">List</button>`
        }
                        <button class="btn btn-neutral btn-small delete-btn" data-id="${cpn.code}">Delete</button>
                    </td>
                </tr>
            `;
}

async function pagination(currentPage, btn) {
    try {
        currentPage = parseInt(currentPage);
        let page = btn === 'next' ? currentPage + 1 : currentPage - 1;
        const searchInputEl = document.getElementById('searchInput');
        let query = searchInputEl ? searchInputEl.value : '';

        const response = await fetch(`/admin/couponPage?page=${encodeURIComponent(page)}&search=${encodeURIComponent(query)}`, {
            headers: { "Accept": "application/json" }
        });

        if (response.ok) {
            const result = await response.json();
            const tableBody = document.getElementById('tableBody');
            if (!tableBody) return;

            let rows = result.coupons.map(cpn => createCouponRow(cpn, result.currentDate)).join("");

            tableBody.innerHTML = rows;

            const paginationDiv = document.querySelector(".pagination");
            if (!paginationDiv) return;
            let paginationHTML = "";

            if (result.currentPage > 1) {
                paginationHTML += `<button onclick="pagination(${result.currentPage}, 'previous')">&#9664;</button>`;
            }

            paginationHTML += `
                <div class="page-box">${result.currentPage}</div>
                <span>of ${result.totalPage}</span>
            `;

            if (result.currentPage < result.totalPage) {
                paginationHTML += `<button onclick="pagination(${result.currentPage}, 'next')">&#9654;</button>`;
            }

            paginationDiv.innerHTML = paginationHTML;

        }
    } catch (error) {
        console.error(error);
    }
}


// Handle search form submission
const searchFormEl = document.querySelector('.search-form');
searchFormEl?.addEventListener('submit', async function (e) {
    e.preventDefault()
    try {
        const searchInputEl = document.getElementById('searchInput');
        const currentPageEl = document.getElementById('currentPage');
        if (!searchInputEl || !currentPageEl) return;

        const searchValue = searchInputEl.value.trim()
        const currentPage = currentPageEl.textContent.trim()

        const response = await fetch(`/admin/couponPage?search=${encodeURIComponent(searchValue)}&page=${encodeURIComponent(currentPage)}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const result = await response.json();
            const tableBody = document.getElementById('tableBody');
            if (!tableBody) return;

            let rows = result.coupons.map(cpn => createCouponRow(cpn, result.currentDate)).join("");

            tableBody.innerHTML = rows;

            const paginationDiv = document.querySelector(".pagination");
            if (!paginationDiv) return;
            let paginationHTML = "";

            if (result.currentPage > 1) {
                paginationHTML += `<button onclick="pagination(${result.currentPage}, 'previous')">&#9664;</button>`;
            }

            paginationHTML += `
                        <div class="page-box">${result.currentPage}</div>
                        <span>of ${result.totalPage}</span>
                    `;

            if (result.currentPage < result.totalPage) {
                paginationHTML += `<button onclick="pagination(${result.currentPage}, 'next')">&#9654;</button>`;
            }

            paginationDiv.innerHTML = paginationHTML;
        } else {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to fetch coupons!',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        }
    } catch (error) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Something went wrong!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        console.error('Search error:', error);
    }
});

// Handle reset button
const searchResetBtnEl = document.getElementById('searchResetBtn');
searchResetBtnEl?.addEventListener('click', async function (e) {
    e.preventDefault()
    try {
        const searchInputEl = document.getElementById('searchInput');
        const currentPageEl = document.getElementById('currentPage');
        if (!searchInputEl || !currentPageEl) return;

        if (!searchInputEl.value) return
        const searchValue = ''
        searchInputEl.value = ''
        const currentPage = currentPageEl.textContent.trim()

        const response = await fetch(`/admin/couponPage?search=${encodeURIComponent(searchValue)}&page=${encodeURIComponent(currentPage)}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const result = await response.json();
            const tableBody = document.getElementById('tableBody');
            if (!tableBody) return;

            let rows = result.coupons.map(cpn => createCouponRow(cpn, result.currentDate)).join("");

            tableBody.innerHTML = rows;

            const paginationDiv = document.querySelector(".pagination");
            if (!paginationDiv) return;
            let paginationHTML = "";

            if (result.currentPage > 1) {
                paginationHTML += `<button onclick="pagination(${result.currentPage}, 'previous')">&#9664;</button>`;
            }

            paginationHTML += `
                        <div class="page-box">${result.currentPage}</div>
                        <span>of ${result.totalPage}</span>
                    `;

            if (result.currentPage < result.totalPage) {
                paginationHTML += `<button onclick="pagination(${result.currentPage}, 'next')">&#9654;</button>`;
            }

            paginationDiv.innerHTML = paginationHTML;
        } else {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to fetch coupons!',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        }
    } catch (error) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Something went wrong!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        console.error('Search error:', error);
    }
});
