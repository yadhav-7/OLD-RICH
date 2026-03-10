
// Your existing JavaScript code remains exactly the same
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('categoryForm');
    const nameInput = document.getElementById('categoryName');
    const descriptionInput = document.getElementById('categoryDescription');
    const nameError = document.getElementById('name-error');
    const descriptionError = document.getElementById('description-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset error messages
        nameError.textContent = '';
        descriptionError.textContent = '';

        // Validate inputs
        let isValid = true;
        const categoryName = nameInput.value.trim();
        const categoryDescription = descriptionInput.value.trim();

        if (!categoryName) {
            nameError.textContent = 'Category name is required';
            isValid = false;
        } else if (categoryName.length < 3) {
            nameError.textContent = 'Name must be at least 3 characters';
            isValid = false;
        } else if (categoryName.length > 15) {
            nameError.textContent = 'Name must be less than 15 characters';
            isValid = false;
        }

        if (!categoryDescription) {
            descriptionError.textContent = 'Description is required';
            isValid = false;
        } else if (categoryDescription.length < 10) {
            descriptionError.textContent = 'Description must be at least 10 characters';
            isValid = false;
        } else if (categoryDescription.length > 1000) {
            descriptionError.textContent = 'Description must be less than 1000 characters';
            isValid = false;
        }

        if (!isValid) return;

        try {
            const data = { categoryName, categoryDescription };

            const response = await apiReq('/admin/addCategory', 'POST', data);

            if (response.status) {

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Category added successfully!',
                    timer: 1500,
                    showConfirmButton: false,
                });

                // Reload only on success
                setTimeout(() => location.reload(), 1500);

            } else {

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message || 'Something went wrong!',
                    showConfirmButton: true,
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'OK'
                });

                // ❌ NO RELOAD HERE FOR ERRORS
            }

        } catch (error) {
            console.error('Error:', error.message);

            Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: error.message || 'Something went wrong!',
            });
        }

    });

    // Reset form on modal close
    document.getElementById('addCategoryModal').addEventListener('hidden.bs.modal', () => {
        form.reset();
        nameError.textContent = '';
        descriptionError.textContent = '';
    });
});

//Add category offer
async function addOffer(categoryId) {

    const { value: amount } = await Swal.fire({
        title: 'Offer In percentage',
        input: 'number',
        inputLabel: 'Percentage',
        inputPlaceholder: '%',
        inputAttributes: {
            min: 1,
            max: 99,
            step: 1
        },
        inputValidator: (value) => {
            if (!value) return 'Please enter a percentage';
            if (value < 1 || value > 99) return 'Enter a value between 1 and 99';
        }

    })

    if (amount) {

        try {
            const response = await fetch('/admin/addCategoryOffer', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    offerPercentage: amount,
                    categoryId: categoryId
                }),
            })

            const data = await response.json();
            if (response.ok && data.status === true) {
                Swal.fire(
                    'Offer added',
                    'The offer has been added',
                    'success'
                ).then(() => {
                    location.reload();
                })
            } else {
                Swal.fire('Failed', data.message || 'Adding offer failed', 'error')
            }
        } catch (error) {
            Swal.fire(
                'Error',
                'An error occured while adding offer',
                'error'
            )
            console.log('Error adding offer', error)
        }
    }
}

//remove offer
async function removeOffer(categoryId) {

    try {
        const response = await fetch('/admin/removeCategoryOffer', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                categoryId: categoryId
            })
        })

        const data = await response.json()

        if (response.ok && data.status === true) {
            Swal.fire(
                'Offer removed',
                'The offer has been removes',
                'success'
            ).then(() => {
                location.reload()
            })
        } else {
            Swal.fire('Failed', data.message || 'Removing offer failed', 'error')
        }
    } catch (error) {
        Swal.fire(
            'Error',
            'An error occured by while removing offer',
            'error'
        )
        console.log('error removing offer', error)
    }
}

// SEARCH
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-button');
const table = document.getElementById('category-table');

// function to fetch & render products
const fetchAndRenderProducts = async (search, page = 1) => {
    try {

        const res = await fetch(`/admin/category?search=${encodeURIComponent(search)}&page=${page}`, {
            headers: { 'Accept': 'application/json' }
        });

        const result = await res.json();
        const product = result.category;
        const currentPage = result.currentPage;
        const totalPages = result.totalPages;

        table.innerHTML = '';

        if (!product || product.length === 0) {
            table.innerHTML = '<tr><td colspan="7" class="text-center">No categories found</td></tr>';
        } else {
            product.forEach((item, index) => {
                table.innerHTML += `
      <tr>
        <td class="text-center fw-bold">${index + 1}</td>

        <td>
          <div class="d-flex align-items-center">
            <div>
              <h6 class="mb-0">${item.name}</h6>
            </div>
          </div>
        </td>

        <td>
          <p class="mb-0 text-truncate" style="max-width: 200px;">
            ${item.description || 'No Description'}
          </p>
        </td>

        <td class="text-center">
          <div class="d-flex flex-column align-items-center gap-2">
            <span class="badge bg-${item.categoryOffer ? 'success' : 'secondary'}">
              ${item.categoryOffer ? item.categoryOffer + '%' : 'No offer'}
            </span>
            ${item.categoryOffer
                        ? `<button class="btn btn-sm btn-outline-danger" onclick="removeOffer('${item._id}')">Remove</button>`
                        : `<button class="btn btn-sm btn-outline-primary" onclick="addOffer('${item._id}')">Add Offer</button>`}
          </div>
        </td>

        <td class="text-center">
          <span class="badge rounded-pill bg-${item.isListed ? 'success' : 'danger'}">
            ${item.isListed ? 'Listed' : 'Unlisted'}
          </span>
        </td>

        <td class="text-center">
          ${item.isListed
                        ? `<a onclick="Unlist('${item._id}', ${index})" id="btn-${item._id}" class="btn btn-sm btn-outline-danger">Unlist</a>`
                        : `<a onclick="list('${item._id}', ${index})" id="btn-${item._id}" class="btn btn-sm btn-outline-success">List</a>`}
        </td>

        <td class="text-center">
          <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-sm btn-warning text-white">
              <a href="/admin/editCategory?id=${item._id}" style="color: inherit; text-decoration: none;">
                Edit
              </a>
            </button>
          </div>
        </td>
      </tr>
    `;

            });

            const pagination = document.querySelector('.pagination-container');

            pagination.innerHTML = `
  <div class="pagination-container">
    ${currentPage > 1
                    ? `<a onclick="fetchAndRenderProducts('${search}', ${currentPage - 1})" class="pagination-link">&laquo;</a>`
                    : ''}

    <a id="currentPage" href="#" class="pagination-current">
      ${currentPage}
    </a>

    ${currentPage < totalPages
                    ? `<a onclick="fetchAndRenderProducts('${search}', ${currentPage + 1})" class="pagination-link">&raquo;</a>`
                    : ''}
  </div>
`;

        }

    } catch (err) {
        console.error('Error fetching products:', err);
    }
};

// On keyup search
searchInput?.addEventListener('keyup', () => {
    const searchValue = searchInput.value.trim();
    fetchAndRenderProducts(searchValue, 1); // Start from page 1 when typing
});

clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    fetchAndRenderProducts('', 1);
});

async function list(id, index) {
    try {
        const { isConfirmed } = await Swal.fire({
            toast: true,
            title: `list product?`,
            text: "Are you sure.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sure',
            cancelButtonText: 'No',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });

        if (isConfirmed) {
            const response = await fetch('/admin/ListCategory', {
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: id
                })
            })
            if (response.ok) {
                const status = document.getElementById(`index-${index}`)
                if (status) {
                    status.className = "badge rounded-pill bg-success"
                    status.textContent = 'Listed'
                }
                const btn = document.querySelector(`#btn-${id}`)
                if (btn) {
                    btn.setAttribute('onclick', `Unlist('${id}', ${index})`)
                    btn.textContent = 'Unlist';
                    btn.classList.remove('btn-outline-success');
                    btn.classList.add('btn-outline-danger');
                    btn.onclick = () => Unlist(id, index); // when listing
                }

                Swal.fire({
                    toast: true,
                    title: 'Success!',
                    text: `Category has been listed.`,
                    icon: 'success',
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

            } else {
                throw new Error("Failed to unblock user");
            }
        }
    } catch (error) {
        Swal.fire({ toast: true, icon: 'error', title: 'Error!', text: error.message });
    }
}

async function Unlist(id, index) {
    try {
        const { isConfirmed } = await Swal.fire({
            toast: true,
            title: `Unlist product?`,
            text: "Are you sure.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sure',
            cancelButtonText: 'No',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });

        if (isConfirmed) {
            const response = await fetch('/admin/unListCategory', {
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: id
                })
            })
            if (response.ok) {
                const status = document.getElementById(`index-${index}`)
                if (status) {
                    status.className = "badge rounded-pill bg-danger"
                    status.textContent = 'Unlisted'
                }
                const btn = document.querySelector(`#btn-${id}`)
                if (btn) {
                    btn.setAttribute('onclick', `list('${id}', ${index})`)
                    btn.textContent = 'List'
                    btn.classList.remove('btn-outline-danger')
                    btn.classList.add('btn-outline-success')
                    btn.onclick = () => list(id, index)
                }
                await Swal.fire({
                    toast: true,
                    title: 'Success!',
                    text: `Category has been Unlisted.`,
                    icon: 'success',
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

            } else {
                throw new Error("Failed to unblock user");
            }
        }
    } catch (error) {
        Swal.fire({ toast: true, icon: 'error', title: 'Error!', text: error.message });
    }
}
