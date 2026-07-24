// ================= STORE DATA & INITIAL STATE ================= //

const defaultCategories = ["Watches", "Clothing", "Electronics", "CJ Imports"];

const defaultProducts = [
    {
        title: "Trending suit loan",
        price: "3500",
        category: "Clothing",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"],
        source: "Markaz"
    }
];

let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

let selectedColor = "";
let selectedSize = "";
let tempCjData = null; // Temporary storage for fetched CJ SKU product

// ================= PAGE INITIALIZATION ================= //

window.addEventListener('DOMContentLoaded', () => {
    renderCategoriesBar();
    displayProducts(products);
    setupCheckoutPage();
});

function scrollSlider(distance) {
    const container = document.getElementById('products-container');
    if (container) container.scrollBy({ left: distance, behavior: 'smooth' });
}

// ================= STORE FRONT UI FUNCTIONS ================= //

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
        container.innerHTML = `<p style="width:100%;text-align:center;color:#9ca3af;padding:40px 0;">No products found.</p>`;
        return;
    }

    let cards = '';
    list.forEach((p, i) => {
        const imgs = p.images && p.images.length ? p.images : ['https://via.placeholder.com/200'];
        const badgeText = p.source === 'CJ' ? 'CJ DROPSHIP' : (p.category || 'MARKAZ');

        cards += `
            <div class="card" onclick="openProductPreview(${i})">
                <span class="badge-tag">${badgeText}</span>
                <span class="sale-badge">SALE</span>
                <div class="image-wrapper">
                    <img id="img-${i}" src="${imgs[0]}" class="p-img" loading="lazy" alt="Product">
                </div>
                <div class="card-content">
                    <div class="rating-stars">★★★★★ <span class="review-count">(32)</span></div>
                    <h3>${p.title}</h3>
                    <div class="price-row">
                        <span class="price">Rs. ${p.price}</span>
                        <span class="old-price">Rs. ${Math.round(p.price * 1.25)}</span>
                    </div>
                    <button class="wa-btn" onclick="event.stopPropagation(); openProductPreview(${i})">👁️ Preview & Buy</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = cards;
}

function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

function openProductPreview(index) {
    const item = currentFilterProducts[index];
    if (item) {
        localStorage.setItem('selectedPreviewProduct', JSON.stringify(item));
        window.location.href = 'product.html';
    }
}

// ================= PRODUCT PREVIEW PAGE (product.html) ================= //

function loadProductDetail() {
    const raw = localStorage.getItem('selectedPreviewProduct');
    if (!raw) return;
    const item = JSON.parse(raw);

    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-price').innerText = `Rs. ${item.price}`;
    document.getElementById('detail-old-price').innerText = `Rs. ${Math.round(item.price * 1.25)}`;
    document.getElementById('detail-source-badge').innerText = item.source === 'CJ' ? 'CJ Dropshipping' : 'Markaz Verified';

    const mainImg = document.getElementById('detail-main-img');
    const galleryContainer = document.getElementById('detail-gallery');

    const imgs = item.images && item.images.length ? item.images : ['https://via.placeholder.com/300'];
    mainImg.src = imgs[0];

    galleryContainer.innerHTML = imgs.map((img, idx) => `
        <img src="${img}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchDetailImg(this, '${img}')">
    `).join('');

    // Load Variants (Color & Size)
    if (item.variants && item.variants.length) {
        const colors = [...new Set(item.variants.map(v => v.color).filter(Boolean))];
        const sizes = [...new Set(item.variants.map(v => v.size).filter(Boolean))];

        if (colors.length) {
            document.getElementById('color-variant-box').style.display = 'block';
            document.getElementById('color-options').innerHTML = colors.map((c, i) => `
                <div class="variant-pill ${i === 0 ? 'active' : ''}" onclick="selectVariantPill(this, 'color', '${c}')">${c}</div>
            `).join('');
            selectedColor = colors[0];
        }

        if (sizes.length) {
            document.getElementById('size-variant-box').style.display = 'block';
            document.getElementById('size-options').innerHTML = sizes.map((s, i) => `
                <div class="variant-pill ${i === 0 ? 'active' : ''}" onclick="selectVariantPill(this, 'size', '${s}')">${s}</div>
            `).join('');
            selectedSize = sizes[0];
        }
    }
}

function switchDetailImg(el, src) {
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('detail-main-img').src = src;
}

function selectVariantPill(el, type, val) {
    const parent = el.parentElement;
    parent.querySelectorAll('.variant-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    if (type === 'color') selectedColor = val;
    if (type === 'size') selectedSize = val;
}

function proceedToCheckoutFromDetail() {
    const item = JSON.parse(localStorage.getItem('selectedPreviewProduct'));
    if (item) {
        localStorage.setItem('checkoutItem', JSON.stringify({
            title: item.title,
            price: item.price,
            selectedColor: selectedColor,
            selectedSize: selectedSize,
            cjSku: item.sku || "",
            isCjProduct: item.source === "CJ"
        }));
        window.location.href = 'checkout.html';
    }
}

// ================= CHECKOUT PAGE FUNCTIONS ================= //

function setupCheckoutPage() {
    const titleEl = document.getElementById('checkout-product-title');
    if (!titleEl) return;

    const item = JSON.parse(localStorage.getItem('checkoutItem'));
    if (item) {
        titleEl.innerText = item.title;
        document.getElementById('checkout-product-price').innerText = `Rs. ${item.price}`;
    }
}

async function submitOrder() {
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !phone || !address || !item) {
        alert('Baraye meharbani apni tamaam details bharein!');
        return;
    }

    const btn = document.getElementById('btn-submit-order');
    if (btn) {
        btn.innerText = "Processing Order...";
        btn.disabled = true;
    }

    try {
        const response = await fetch("/api/send-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: item.title,
                price: item.price,
                name: name,
                phone: phone,
                address: address,
                selectedColor: item.selectedColor || "",
                selectedSize: item.selectedSize || "",
                cjSku: item.cjSku || "",
                isCjProduct: item.isCjProduct || false
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
        } else {
            alert(`Order Error: ${result.message || 'Server Error'}`);
            if (btn) { btn.innerText = "⚡ Confirm Order"; btn.disabled = false; }
        }
    } catch (err) {
        alert("Network Error!");
        if (btn) { btn.innerText = "⚡ Confirm Order"; btn.disabled = false; }
    }
}

// ================= ADMIN: CJ DROPSHIPPING FETCH & IMPORT ================= //
// Step 1: Fetch CJ Details with Multi-Images & Auto-Category
async function fetchCjProductDetails() {
    const sku = document.getElementById('cj-sku-input').value.trim();

    if (!sku) {
        alert("Baraye meharbani SKU Code darj karein!");
        return;
    }

    try {
        const res = await fetch(`/api/cj-product?sku=${encodeURIComponent(sku)}`);
        const json = await res.json();

        if (json.success) {
            const data = json.data;
            tempCjData = data;

            // Display Preview Card
            const previewCard = document.getElementById('cj-preview-card');
            previewCard.style.display = 'block';

            // Title
            document.getElementById('cj-p-title').value = data.title;
            
            // Cost & Margin
            const totalBaseCost = (data.basePricePKR || 0) + (data.shippingCostPKR || 0);
            document.getElementById('cj-p-cost').value = totalBaseCost;
            document.getElementById('cj-p-margin').value = 10;

            // Render Multi-Image Gallery
            const galleryEl = document.getElementById('cj-preview-gallery');
            const countEl = document.getElementById('cj-img-count');
            
            if (data.images && data.images.length) {
                if (countEl) countEl.innerText = data.images.length;
                if (galleryEl) {
                    galleryEl.innerHTML = data.images.map((imgUrl, i) => `
                        <img src="${imgUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid ${i === 0 ? '#10b981' : '#334155'}; flex-shrink: 0;" title="Image ${i+1}">
                    `).join('');
                }
            }

            // AUTO CATEGORY SELECT / ADD
            const fetchedCategory = data.categoryName || "CJ Imports";
            let existingCat = categories.find(c => c.toLowerCase() === fetchedCategory.toLowerCase());

            if (!existingCat) {
                categories.push(fetchedCategory);
                localStorage.setItem('myCategories', JSON.stringify(categories));
                existingCat = fetchedCategory;
                renderAdminPanel(); // Refresh lists
            }

            const catSelect = document.getElementById('cj-p-category');
            if (catSelect) {
                catSelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
                catSelect.value = existingCat;
            }

            // Calculate Initial Selling Price
            calculateCjFinalPrice();

            // Scroll down
            previewCard.scrollIntoView({ behavior: 'smooth' });

        } else {
            alert("CJ Product Fetch Error: " + json.message);
        }
    } catch (e) {
        alert("Failed to connect to CJ API endpoint!");
    }
}

// Step 2: Save CJ Product to Store
function saveCjProductToStore() {
    if (!tempCjData) {
        alert("Pehle Product Fetch Karein!");
        return;
    }

    const title = document.getElementById('cj-p-title').value.trim();
    const finalPrice = document.getElementById('cj-p-final').value.trim();
    const category = document.getElementById('cj-p-category').value;

    if (!title || !finalPrice) {
        alert("Title aur Final Price hona zaroori hai!");
        return;
    }

    // Save ALL fetched images
    const productImages = (tempCjData.images && tempCjData.images.length > 0) 
        ? tempCjData.images 
        : ['https://via.placeholder.com/300'];

    const newProd = {
        title: title,
        price: finalPrice,
        category: category,
        images: productImages, // Full Array of All Images
        sku: tempCjData.sku,
        variants: tempCjData.variants || [],
        source: "CJ"
    };

    products.unshift(newProd);
    localStorage.setItem('myProducts', JSON.stringify(products));

    // Clear Preview Box
    document.getElementById('cj-preview-card').style.display = 'none';
    document.getElementById('cj-sku-input').value = '';
    tempCjData = null;

    renderAdminPanel();
    alert(`🎉 Product (${productImages.length} images ke saath) Store Par Add Ho Gaya!`);
}

}

// ================= GENERAL ADMIN PANEL FUNCTIONS ================= //

function renderAdminPanel() {
    renderAdminCategories();
    renderAdminCategoryDropdown();
    renderAdminProducts();
}

function renderAdminCategories() {
    const listEl = document.getElementById('admin-category-list');
    if (!listEl) return;
    listEl.innerHTML = categories.map((cat, idx) => `
        <div class="list-pill">
            <span>${cat}</span>
            <button class="btn-delete" onclick="deleteCategory(${idx})">✕</button>
        </div>
    `).join('');
}

function renderAdminCategoryDropdown() {
    const selectEl = document.getElementById('p-category');
    if (selectEl) selectEl.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-cat-name');
    const name = input.value.trim();
    if (name && !categories.includes(name)) {
        categories.push(name);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        input.value = '';
        renderAdminPanel();
    }
}

function deleteCategory(idx) {
    categories.splice(idx, 1);
    localStorage.setItem('myCategories', JSON.stringify(categories));
    renderAdminPanel();
}

function renderAdminProducts() {
    const listEl = document.getElementById('admin-products-list');
    if (!listEl) return;

    listEl.innerHTML = products.map((p, idx) => {
        const img = p.images && p.images.length ? p.images[0] : 'https://via.placeholder.com/50';
        return `
            <div class="admin-product-item">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${img}" class="admin-prod-img" alt="product">
                    <div>
                        <strong>${p.title}</strong>
                        <div style="font-size:0.8rem; color:#38bdf8;">Rs. ${p.price} | <span style="color:${p.source==='CJ'?'#818cf8':'#10b981'}">${p.source || 'Markaz'}</span></div>
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteProduct(${idx})">✕</button>
            </div>
        `;
    }).join('');
}

// Add Manual Product (Markaz)
function addNewProduct() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const category = document.getElementById('p-category').value;
    const fileInput = document.getElementById('p-file');
    const urlInput = document.getElementById('p-url').value.trim();

    if (!title || !price) {
        alert("Title aur Price likhein!");
        return;
    }

    const saveAndRefresh = (imgSrc) => {
        products.unshift({
            title: title,
            price: price,
            category: category,
            images: [imgSrc || 'https://via.placeholder.com/300'],
            source: "Markaz"
        });
        localStorage.setItem('myProducts', JSON.stringify(products));

        // Form reset
        document.getElementById('p-title').value = '';
        document.getElementById('p-price').value = '';
        document.getElementById('p-file').value = '';
        document.getElementById('p-url').value = '';

        renderAdminPanel();
        alert("Markaz Product Saved!");
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => saveAndRefresh(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveAndRefresh(urlInput);
    }
}

function deleteProduct(idx) {
    if (confirm("Kya aap is product ko delete karna chahte hain?")) {
        products.splice(idx, 1);
        localStorage.setItem('myProducts', JSON.stringify(products));
        renderAdminPanel();
    }
}
