// ================= STORE DATA & INITIAL STATE ================= //

// Default Categories with Beauty included
const defaultCategories = ["Beauty", "Watches", "Clothing", "Electronics", "Home & Garden", "CJ Imports"];

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

// Ensure 'Beauty' exists in categories if missing from older localStorage
if (!categories.some(c => c.toLowerCase() === 'beauty')) {
    categories.unshift("Beauty");
    localStorage.setItem('myCategories', JSON.stringify(categories));
}

let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

let selectedColor = "";
let selectedSize = "";
let tempCjData = null; // Temporary storage for fetched CJ product

// ================= PAGE INITIALIZATION ================= //

window.addEventListener('DOMContentLoaded', () => {
    renderCategoriesBar();
    displayProducts(products);
    setupCheckoutPage();
    renderAdminPanel();
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

    const titleEl = document.getElementById('detail-title');
    if (titleEl) titleEl.innerText = item.title;

    const priceEl = document.getElementById('detail-price');
    if (priceEl) priceEl.innerText = `Rs. ${item.price}`;

    const oldPriceEl = document.getElementById('detail-old-price');
    if (oldPriceEl) oldPriceEl.innerText = `Rs. ${Math.round(item.price * 1.25)}`;

    const badgeEl = document.getElementById('detail-source-badge');
    if (badgeEl) badgeEl.innerText = item.source === 'CJ' ? 'CJ Dropshipping' : 'Markaz Verified';

    const mainImg = document.getElementById('detail-main-img');
    const galleryContainer = document.getElementById('detail-gallery');

    const imgs = item.images && item.images.length ? item.images : ['https://via.placeholder.com/300'];
    if (mainImg) mainImg.src = imgs[0];

    if (galleryContainer) {
        galleryContainer.innerHTML = imgs.map((img, idx) => `
            <img src="${img}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchDetailImg(this, '${img}')">
        `).join('');
    }

    // Load Variants
    if (item.variants && item.variants.length) {
        const colors = [...new Set(item.variants.map(v => v.color).filter(Boolean))];
        const sizes = [...new Set(item.variants.map(v => v.size).filter(Boolean))];

        if (colors.length) {
            const colorBox = document.getElementById('color-variant-box');
            if (colorBox) colorBox.style.display = 'block';
            const colorOpts = document.getElementById('color-options');
            if (colorOpts) {
                colorOpts.innerHTML = colors.map((c, i) => `
                    <div class="variant-pill ${i === 0 ? 'active' : ''}" onclick="selectVariantPill(this, 'color', '${c}')">${c}</div>
                `).join('');
            }
            selectedColor = colors[0];
        }

        if (sizes.length) {
            const sizeBox = document.getElementById('size-variant-box');
            if (sizeBox) sizeBox.style.display = 'block';
            const sizeOpts = document.getElementById('size-options');
            if (sizeOpts) {
                sizeOpts.innerHTML = sizes.map((s, i) => `
                    <div class="variant-pill ${i === 0 ? 'active' : ''}" onclick="selectVariantPill(this, 'size', '${s}')">${s}</div>
                `).join('');
            }
            selectedSize = sizes[0];
        }
    }
}

function switchDetailImg(el, src) {
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const mainImg = document.getElementById('detail-main-img');
    if (mainImg) mainImg.src = src;
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
        const priceEl = document.getElementById('checkout-product-price');
        if (priceEl) priceEl.innerText = `Rs. ${item.price}`;
    }
}

async function submitOrder() {
    const nameInput = document.getElementById('c-name');
    const phoneInput = document.getElementById('c-phone');
    const addressInput = document.getElementById('c-address');
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!nameInput || !phoneInput || !addressInput || !item) {
        alert('Baraye meharbani apni tamaam details bharein!');
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    if (!name || !phone || !address) {
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
            const formBox = document.getElementById('checkout-form-box');
            const successBox = document.getElementById('success-box');
            if (formBox) formBox.style.display = 'none';
            if (successBox) successBox.style.display = 'block';
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

async function fetchCjProductDetails() {
    const skuInput = document.getElementById('cj-sku-input');
    if (!skuInput) return;

    const sku = skuInput.value.trim();
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
            if (previewCard) previewCard.style.display = 'block';

            // Fill Title
            const titleInput = document.getElementById('cj-p-title');
            if (titleInput) titleInput.value = data.title;
            
            // Cost & Margin
            const totalBaseCost = (data.basePricePKR || 0) + (data.shippingCostPKR || 0);
            const costInput = document.getElementById('cj-p-cost');
            if (costInput) costInput.value = totalBaseCost;
            
            const marginInput = document.getElementById('cj-p-margin');
            if (marginInput) marginInput.value = 10;

            // Render Multi-Image Gallery
            const galleryEl = document.getElementById('cj-preview-gallery');
            const countEl = document.getElementById('cj-img-count');
            
            if (data.images && data.images.length) {
                if (countEl) countEl.innerText = data.images.length;
                if (galleryEl) {
                    galleryEl.innerHTML = data.images.map((imgUrl, i) => `
                        <img src="${imgUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 2px solid ${i === 0 ? '#10b981' : '#374151'}; flex-shrink: 0;" title="Image ${i+1}">
                    `).join('');
                }
            }

            // SMART DETECTOR (TITLE + CATEGORY KEYWORDS)
            const combinedText = ((data.title || "") + " " + (data.categoryName || "")).toLowerCase();
            let matchedCategory = "CJ Imports";

            if (combinedText.includes("aloe") || combinedText.includes("cream") || combinedText.includes("skin") || combinedText.includes("moistur") || combinedText.includes("beauty") || combinedText.includes("health") || combinedText.includes("makeup") || combinedText.includes("care") || combinedText.includes("massage") || combinedText.includes("essence") || combinedText.includes("lotion") || combinedText.includes("serum") || combinedText.includes("facial") || combinedText.includes("lipstick") || combinedText.includes("cosmetic")) {
                matchedCategory = "Beauty";
            } else if (combinedText.includes("garden") || combinedText.includes("home") || combinedText.includes("kitchen") || combinedText.includes("decor") || combinedText.includes("household")) {
                matchedCategory = "Home & Garden";
            } else if (combinedText.includes("watch") || combinedText.includes("jewelry") || combinedText.includes("ring") || combinedText.includes("necklace")) {
                matchedCategory = "Watches";
            } else if (combinedText.includes("cloth") || combinedText.includes("apparel") || combinedText.includes("wear") || combinedText.includes("shirt") || combinedText.includes("suit")) {
                matchedCategory = "Clothing";
            } else if (combinedText.includes("electronic") || combinedText.includes("gadget") || combinedText.includes("phone") || combinedText.includes("charger") || combinedText.includes("cable")) {
                matchedCategory = "Electronics";
            } else if (data.categoryName) {
                matchedCategory = data.categoryName;
            }

            // Ensure category exists in categories array
            let targetCategoryName = categories.find(c => c.toLowerCase() === matchedCategory.toLowerCase());
            if (!targetCategoryName) {
                categories.push(matchedCategory);
                localStorage.setItem('myCategories', JSON.stringify(categories));
                targetCategoryName = matchedCategory;
            }

            // Refresh Dropdowns across admin UI
            renderAdminCategoryDropdown();

            // Explicitly set value and index on CJ Category Select
            const catSelect = document.getElementById('cj-p-category');
            if (catSelect) {
                for (let i = 0; i < catSelect.options.length; i++) {
                    if (catSelect.options[i].value.toLowerCase() === targetCategoryName.toLowerCase()) {
                        catSelect.selectedIndex = i;
                        break;
                    }
                }
            }

            // Calculate Selling Price
            calculateCjFinalPrice();

            if (previewCard) previewCard.scrollIntoView({ behavior: 'smooth' });

        } else {
            alert("CJ Product Fetch Error: " + json.message);
        }
    } catch (e) {
        alert("Failed to connect to CJ API endpoint!");
    }
}

function calculateCjFinalPrice() {
    const costInput = document.getElementById('cj-p-cost');
    const marginInput = document.getElementById('cj-p-margin');
    const finalInput = document.getElementById('cj-p-final');

    if (!costInput || !marginInput || !finalInput) return;

    const baseCost = parseFloat(costInput.value) || 0;
    const margin = parseFloat(marginInput.value) || 0;

    const finalPrice = Math.round(baseCost * (1 + margin / 100));
    finalInput.value = finalPrice;
}

function saveCjProductToStore() {
    if (!tempCjData) {
        alert("Pehle Product Fetch Karein!");
        return;
    }

    const titleInput = document.getElementById('cj-p-title');
    const finalInput = document.getElementById('cj-p-final');
    const catSelect = document.getElementById('cj-p-category');

    const title = titleInput ? titleInput.value.trim() : "";
    const finalPrice = finalInput ? finalInput.value.trim() : "";
    const category = catSelect ? catSelect.value : "Beauty";

    if (!title || !finalPrice) {
        alert("Title aur Final Price hona zaroori hai!");
        return;
    }

    const productImages = (tempCjData.images && tempCjData.images.length > 0) 
        ? tempCjData.images 
        : ['https://via.placeholder.com/300'];

    const newProd = {
        title: title,
        price: finalPrice,
        category: category,
        images: productImages,
        sku: tempCjData.sku,
        variants: tempCjData.variants || [],
        source: "CJ"
    };

    products.unshift(newProd);
    localStorage.setItem('myProducts', JSON.stringify(products));

    const previewCard = document.getElementById('cj-preview-card');
    const skuInput = document.getElementById('cj-sku-input');
    if (previewCard) previewCard.style.display = 'none';
    if (skuInput) skuInput.value = '';
    tempCjData = null;

    renderAdminPanel();
    alert(`🎉 Product (${productImages.length} images ke saath) Store Par Successfully Add Ho Gaya!`);
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
        <div class="list-pill" style="display:inline-flex; align-items:center; gap:8px; background:#1e293b; padding:4px 10px; border-radius:20px; font-size:0.85rem; color:#e2e8f0;">
            <span>${cat}</span>
            <button class="btn-delete" style="background:none; border:none; color:#ef4444; cursor:pointer;" onclick="deleteCategory(${idx})">✕</button>
        </div>
    `).join('');
}

function renderAdminCategoryDropdown() {
    const selectEl = document.getElementById('p-category');
    if (selectEl) selectEl.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    const cjSelectEl = document.getElementById('cj-p-category');
    if (cjSelectEl) cjSelectEl.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-cat-name');
    if (!input) return;
    const name = input.value.trim();
    if (name && !categories.some(c => c.toLowerCase() === name.toLowerCase())) {
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

    if (!products.length) {
        listEl.innerHTML = `<p style="color:#64748b; font-size:0.9rem;">Koi product mojood nahi hai.</p>`;
        return;
    }

    listEl.innerHTML = products.map((p, idx) => {
        const img = p.images && p.images.length ? p.images[0] : 'https://via.placeholder.com/50';
        const imgCount = p.images ? p.images.length : 1;
        return `
            <div class="admin-product-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #1e293b;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${img}" style="width:45px; height:45px; object-fit:cover; border-radius:6px;" alt="product">
                    <div>
                        <strong style="color:#f8fafc; font-size:0.95rem;">${p.title}</strong>
                        <div style="font-size:0.8rem; color:#38bdf8;">
                            Rs. ${p.price} | 
                            <span style="color:${p.source==='CJ'?'#818cf8':'#10b981'}">${p.source || 'Markaz'}</span> | 
                            🖼️ ${imgCount} img
                        </div>
                    </div>
                </div>
                <button class="btn-delete" style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;" onclick="deleteProduct(${idx})">✕</button>
            </div>
        `;
    }).join('');
}

function addNewProduct() {
    const titleInput = document.getElementById('p-title');
    const priceInput = document.getElementById('p-price');
    const catInput = document.getElementById('p-category');
    const urlInput = document.getElementById('p-url');

    if (!titleInput || !priceInput) return;

    const title = titleInput.value.trim();
    const price = priceInput.value.trim();
    const category = catInput ? catInput.value : "General";
    const urlValue = urlInput ? urlInput.value.trim() : "";

    if (!title || !price) {
        alert("Title aur Price likhein!");
        return;
    }

    products.unshift({
        title: title,
        price: price,
        category: category,
        images: [urlValue || 'https://via.placeholder.com/300'],
        source: "Markaz"
    });
    localStorage.setItem('myProducts', JSON.stringify(products));

    titleInput.value = '';
    priceInput.value = '';
    if (urlInput) urlInput.value = '';

    renderAdminPanel();
    alert("Markaz Product Saved!");
}

function deleteProduct(idx) {
    if (confirm("Kya aap is product ko delete karna chahte hain?")) {
        products.splice(idx, 1);
        localStorage.setItem('myProducts', JSON.stringify(products));
        renderAdminPanel();
    }
}
