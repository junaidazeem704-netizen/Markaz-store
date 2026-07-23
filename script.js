// Default Datasets
const defaultCategories = ["Watches", "Clothing", "Electronics"];

const defaultProducts = [
    {
        title: "Trending Smart Watch",
        price: "2500",
        category: "Watches",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"]
    }
];

// Memory Data State
let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

// Horizontal Slider Scroll Function
function scrollSlider(distance) {
    const container = document.getElementById('products-container');
    if (container) {
        container.scrollBy({ left: distance, behavior: 'smooth' });
    }
}

// Global Image Change
function changeImage(idx, src) {
    const el = document.getElementById(`img-${idx}`);
    if (el) el.src = src;
}

// Render Products & Categories
window.addEventListener('DOMContentLoaded', () => {
    renderCategoriesBar();
    displayProducts(products);
});

function renderCategoriesBar() {
    const catBar = document.getElementById('category-bar');
    if (!catBar) return;

    let html = `<button class="cat-btn active" onclick="filterCategory('All', this)">All</button>`;
    categories.forEach(cat => {
        html += `<button class="cat-btn" onclick="filterCategory('${cat}', this)">${cat}</button>`;
    });
    catBar.innerHTML = html;
}

function displayProducts(list) {
    const container = document.getElementById('products-container');
    if (!container) return;

    currentFilterProducts = list;

    if (!list.length) {
        container.innerHTML = `<p style="width:100%;text-align:center;color:#9ca3af;padding:40px 0;">No products found in this category.</p>`;
        return;
    }

    let cards = '';
    list.forEach((p, i) => {
        const imgs = p.images && p.images.length ? p.images : ['https://via.placeholder.com/200'];
        let thumbs = '';
        if (imgs.length > 1) {
            thumbs = `<div class="thumb-box">` + 
                imgs.map(img => `<img src="${img}" class="t-img" onclick="changeImage(${i}, '${img}')">`).join('') + 
                `</div>`;
        }

        cards += `
            <div class="card">
                <span class="badge-tag">${p.category || 'General'}</span>
                <span class="sale-badge">SALE</span>
                <div class="image-wrapper">
                    <img id="img-${i}" src="${imgs[0]}" class="p-img" loading="lazy" alt="Product">
                </div>
                ${thumbs}
                <div class="card-content">
                    <div class="rating-stars">★★★★★ <span class="review-count">(24)</span></div>
                    <h3>${p.title}</h3>
                    <div class="price-row">
                        <span class="price">Rs. ${p.price}</span>
                        <span class="old-price">Rs. ${Math.round(p.price * 1.25)}</span>
                    </div>
                    <button class="wa-btn" onclick="goToCheckout(${i})">🛍️ Order Now</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = cards;
}

// Direct Checkout Navigation
function goToCheckout(index) {
    const item = currentFilterProducts[index];
    if (item) {
        localStorage.setItem('checkoutItem', JSON.stringify({
            title: item.title,
            price: item.price
        }));
        window.location.href = 'checkout.html';
    }
}

function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

// Checkout Page Handler
window.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('checkout-product-title');
    if (!titleEl) return;

    const item = JSON.parse(localStorage.getItem('checkoutItem'));
    if (item) {
        titleEl.innerText = item.title;
        document.getElementById('checkout-product-price').innerText = `Rs. ${item.price}`;
    }
});

// Fixed Order Submission Handler
async function submitOrder() {
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !phone || !address || !item) {
        alert('Baraye meharbani apni tamam details bharein!');
        return;
    }

    const submitBtn = document.querySelector('.btn-whatsapp');
    if (submitBtn) {
        submitBtn.innerText = "Processing Order...";
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch("/api/send-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: item.title,
                price: item.price,
                name: name,
                phone: phone,
                address: address
            })
        });

        // Response Error Check
        if (!response.ok) {
            throw new Error(`Server returned HTTP status ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
        } else {
            alert("Order submission mein masla hua: " + (result.message || "Unknown Error"));
            if (submitBtn) {
                submitBtn.innerText = "✅ Confirm Order";
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("Network Error / API Server offline! Pehle check karein ke site Live Vercel URL par khuli hai.");
        console.error("Order error:", error);
        if (submitBtn) {
            submitBtn.innerText = "✅ Confirm Order";
            submitBtn.disabled = false;
        }
    }
}
// ================= ADMIN PANEL FUNCTIONS ================= //

function renderAdminPanel() {
    renderAdminCategories();
    renderAdminCategoryDropdown();
    renderAdminProducts();
}

// 1. Categories Functions
function renderAdminCategories() {
    const listEl = document.getElementById('admin-category-list');
    if (!listEl) return;

    if (!categories.length) {
        listEl.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">No categories added yet.</span>`;
        return;
    }

    listEl.innerHTML = categories.map((cat, idx) => `
        <div class="list-pill">
            <span>${cat}</span>
            <button class="btn-delete" onclick="deleteCategory(${idx})">✕</button>
        </div>
    `).join('');
}

function renderAdminCategoryDropdown() {
    const selectEl = document.getElementById('p-category');
    if (!selectEl) return;

    selectEl.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-cat-name');
    const name = input.value.trim();

    if (!name) {
        alert("Category name likhna zaroori hai!");
        return;
    }

    if (categories.includes(name)) {
        alert("Yeh category pehle se maujood hai!");
        return;
    }

    categories.push(name);
    localStorage.setItem('myCategories', JSON.stringify(categories));
    input.value = '';

    renderAdminPanel();
    alert(`Category "${name}" add ho gayi!`);
}

function deleteCategory(index) {
    if (confirm(`Kya aap "${categories[index]}" category delete karna chahte hain?`)) {
        categories.splice(index, 1);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderAdminPanel();
    }
}

// 2. Products Functions
function renderAdminProducts() {
    const listEl = document.getElementById('admin-products-list');
    if (!listEl) return;

    if (!products.length) {
        listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">No products in store.</p>`;
        return;
    }

    listEl.innerHTML = products.map((p, idx) => {
        const img = p.images && p.images.length ? p.images[0] : 'https://via.placeholder.com/50';
        return `
            <div class="admin-product-item">
                <div class="admin-prod-info">
                    <img src="${img}" class="admin-prod-img" alt="product">
                    <div>
                        <strong style="display:block; font-size:0.95rem;">${p.title}</strong>
                        <span style="font-size:0.8rem; color:#38bdf8;">Rs. ${p.price}</span> | 
                        <span style="font-size:0.8rem; color:var(--text-muted);">${p.category || 'General'}</span>
                    </div>
                </div>
                <button class="btn-delete" style="width:28px; height:28px; font-size:0.9rem;" onclick="deleteProduct(${idx})">✕</button>
            </div>
        `;
    }).join('');
}

function addNewProduct() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const category = document.getElementById('p-category').value;
    const fileInput = document.getElementById('p-file');
    const urlInput = document.getElementById('p-url').value.trim();

    if (!title || !price) {
        alert("Product Title aur Price likhna zaroori hai!");
        return;
    }

    const saveAndRefresh = (imgSrc) => {
        const newProd = {
            title: title,
            price: price,
            category: category,
            images: [imgSrc || 'https://via.placeholder.com/300']
        };

        products.unshift(newProd);
        localStorage.setItem('myProducts', JSON.stringify(products));

        // Form Clear
        document.getElementById('p-title').value = '';
        document.getElementById('p-price').value = '';
        document.getElementById('p-file').value = '';
        document.getElementById('p-url').value = '';

        renderAdminPanel();
        alert("🎉 Product Store Par Add Ho Gaya!");
    };

    // Check if File Uploaded
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveAndRefresh(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (urlInput) {
        saveAndRefresh(urlInput);
    } else {
        saveAndRefresh('https://via.placeholder.com/300');
    }
}

function deleteProduct(index) {
    if (confirm(`Kya aap "${products[index].title}" ko delete karna chahte hain?`)) {
        products.splice(index, 1);
        localStorage.setItem('myProducts', JSON.stringify(products));
        renderAdminPanel();
    }
}

