// ============================================
// CONFIGURATION
// ============================================
const IMGBB_API_KEY = '311cba478ef03480a9e99f45226dc6ac';
const STORE_NAME = 'Markaz Store';
const STORE_EMAIL = 'info@markazstore.com';

// ============================================
// DEFAULT DATA
// ============================================
const defaultCategories = ["Watches", "Clothing", "Electronics"];

const defaultProducts = [
    {
        title: "Trending Smart Watch",
        price: "2500",
        category: "Watches",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"],
        sizes: [],
        colors: ["Black", "Silver"]
    }
];

// ============================================
// STATE MANAGEMENT
// ============================================
let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

// Admin panel image storage
let uploadedImages = [];
let sizes = [];
let colors = [];

// ============================================
// DOM READY - INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    renderCategoriesBar();
    displayProducts(products);
    updateHeroStats();
    renderFooterCategories();
    setupCategorySuggestions('new-cat-name', 'category-suggestions');
    setupCategorySuggestions('p-category-input', 'category-suggestions-product');
    
    // Checkout page sync
    if (document.getElementById('checkout-product-title')) {
        const item = JSON.parse(localStorage.getItem('checkoutItem'));
        if (item) {
            document.getElementById('checkout-product-title').innerText = item.title;
            document.getElementById('checkout-product-price').innerText = `Rs. ${item.price}`;
            if (item.category) {
                document.getElementById('checkout-product-category').innerText = item.category;
            }
        }
    }
    
    // Admin panel initialization
    if (document.querySelector('.admin-wrapper')) {
        renderAdminPanel();
        updateStats();
        setupImageUpload();
        loadSavedOptions();
    }
    
    // Category suggestions for admin
    setTimeout(() => {
        setupCategorySuggestions('new-cat-name', 'category-suggestions');
        setupCategorySuggestions('p-category-input', 'category-suggestions-product');
    }, 300);
    
    setTimeout(() => syncAllCategories(), 500);
});

// ============================================
// IMAGE UPLOAD SETUP (Admin Panel)
// ============================================
function setupImageUpload() {
    const imageInput = document.getElementById('p-images');
    if (!imageInput) return;
    
    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        const grid = document.getElementById('image-preview-grid');
        if (!grid) return;
        
        for (let file of files) {
            if (uploadedImages.length >= 5) {
                showToast('Maximum 5 images allowed!', 'warning');
                break;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedImages.push(event.target.result);
                renderImagePreviews();
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });
}

function renderImagePreviews() {
    const grid = document.getElementById('image-preview-grid');
    if (!grid) return;
    
    if (uploadedImages.length === 0) {
        grid.innerHTML = '';
        return;
    }
    
    grid.innerHTML = uploadedImages.map((img, i) => `
        <div class="image-preview-item">
            <img src="${img}" alt="Product image ${i+1}" />
            <button class="remove-img" onclick="removeImage(${i})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Update hidden input
    document.getElementById('p-images-data').value = JSON.stringify(uploadedImages);
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
}

// ============================================
// SIZE & COLOR OPTIONS (Admin Panel)
// ============================================
function loadSavedOptions() {
    // Load from hidden inputs if they exist
    const sizesData = document.getElementById('p-sizes');
    const colorsData = document.getElementById('p-colors');
    
    if (sizesData && sizesData.value) {
        sizes = JSON.parse(sizesData.value);
        renderOptions('size');
    }
    if (colorsData && colorsData.value) {
        colors = JSON.parse(colorsData.value);
        renderOptions('color');
    }
}

function addOption(type) {
    const inputId = type === 'size' ? 'size-input' : 'color-input';
    const containerId = type === 'size' ? 'sizes-container' : 'colors-container';
    const hiddenId = type === 'size' ? 'p-sizes' : 'p-colors';
    const array = type === 'size' ? sizes : colors;
    
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const value = input.value.trim();
    
    if (!value) {
        showToast('Please enter a value', 'error');
        return;
    }
    
    if (array.includes(value)) {
        showToast('Option already exists', 'warning');
        return;
    }
    
    array.push(value);
    document.getElementById(hiddenId).value = JSON.stringify(array);
    input.value = '';
    renderOptions(type);
}

function removeOption(type, index) {
    const array = type === 'size' ? sizes : colors;
    const hiddenId = type === 'size' ? 'p-sizes' : 'p-colors';
    
    array.splice(index, 1);
    document.getElementById(hiddenId).value = JSON.stringify(array);
    renderOptions(type);
}

function renderOptions(type) {
    const containerId = type === 'size' ? 'sizes-container' : 'colors-container';
    const array = type === 'size' ? sizes : colors;
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    if (array.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = array.map((item, i) => `
        <span class="option-tag">
            ${item}
            <button class="remove" onclick="removeOption('${type}', ${i})">×</button>
        </span>
    `).join('');
}

// ============================================
// UPDATE HERO STATS
// ============================================
function updateHeroStats() {
    const totalProducts = document.getElementById('total-products-display');
    const totalCategories = document.getElementById('total-categories-display');
    if (totalProducts) totalProducts.textContent = products.length;
    if (totalCategories) totalCategories.textContent = categories.length;
}

// ============================================
// RENDER FOOTER CATEGORIES
// ============================================
function renderFooterCategories() {
    const container = document.getElementById('footer-categories');
    if (!container) return;
    container.innerHTML = categories.map(c => 
        `<a href="#products" onclick="filterCategory('${c}')">${c}</a>`
    ).join('');
}

// ============================================
// RENDER CATEGORIES BAR
// ============================================
function renderCategoriesBar() {
    const catBar = document.getElementById('category-bar');
    if (!catBar) return;

    let html = `<button class="cat-btn active" onclick="filterCategory('All', this)">All</button>`;
    categories.forEach(cat => {
        html += `<button class="cat-btn" onclick="filterCategory('${cat}', this)">${cat}</button>`;
    });
    catBar.innerHTML = html;
}

// ============================================
// DISPLAY PRODUCTS (With Sizes & Colors)
// ============================================
function displayProducts(list) {
    const container = document.getElementById('products-container');
    if (!container) return;

    currentFilterProducts = list;

    if (!list.length) {
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#6a6a82;padding:60px 0;">
            <i class="fas fa-box-open" style="font-size:2.4rem;display:block;margin-bottom:12px;"></i>
            No products found.
        </p>`;
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
        
        let sizeHtml = '';
        if (p.sizes && p.sizes.length > 0) {
            sizeHtml = `<div class="product-options"><span class="opt-label">Sizes:</span> ${p.sizes.map(s => `<span class="opt-tag">${s}</span>`).join('')}</div>`;
        }
        
        let colorHtml = '';
        if (p.colors && p.colors.length > 0) {
            colorHtml = `<div class="product-options"><span class="opt-label">Colors:</span> ${p.colors.map(c => `<span class="opt-tag" style="background:${c.toLowerCase()};color:white;padding:2px 12px;border-radius:4px;">${c}</span>`).join('')}</div>`;
        }

        cards += `
            <div class="card">
                <span class="badge">${p.category || 'General'}</span>
                <img id="img-${i}" src="${imgs[0]}" class="p-img" loading="lazy" alt="${p.title}">
                ${thumbs}
                <h3>${p.title}</h3>
                ${sizeHtml}
                ${colorHtml}
                <div class="price">Rs. ${p.price}</div>
                <button class="wa-btn" onclick="goToCheckout(${i})">
                    <i class="fas fa-shopping-bag"></i> Order Now
                </button>
            </div>
        `;
    });
    container.innerHTML = cards;
}

// ============================================
// CHANGE IMAGE (Thumbnail Click)
// ============================================
function changeImage(idx, src) {
    const el = document.getElementById(`img-${idx}`);
    if (el) el.src = src;
}

// ============================================
// FILTER CATEGORY
// ============================================
function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

// ============================================
// GO TO CHECKOUT
// ============================================
function goToCheckout(index) {
    const item = currentFilterProducts[index];
    if (item) {
        localStorage.setItem('checkoutItem', JSON.stringify({
            title: item.title,
            price: item.price,
            category: item.category || 'General'
        }));
        window.location.href = 'checkout.html';
    }
}

// ============================================
// SUBMIT ORDER (With Email to Admin & Customer)
// ============================================
async function submitOrder() {
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const notes = document.getElementById('c-notes').value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !email || !phone || !address || !item) {
        showToast('Please fill all required fields!', 'error');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        showToast('Please enter a valid email address!', 'error');
        return;
    }

    const submitBtn = document.querySelector('.btn-primary');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
    }

    const orderId = 'MK-' + Date.now().toString().slice(-6);

    const orderData = {
        orderId: orderId,
        title: item.title,
        price: item.price,
        category: item.category || 'General',
        name: name,
        email: email,
        phone: phone,
        address: address,
        notes: notes || 'N/A',
        storeName: STORE_NAME,
        storeEmail: STORE_EMAIL
    };

    try {
        const adminResponse = await fetch('/api/send-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const customerResponse = await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const adminResult = await adminResponse.json();

        if (adminResult.success) {
            let orders = parseInt(localStorage.getItem('orderCount') || 0);
            localStorage.setItem('orderCount', orders + 1);
            
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
            
            document.getElementById('order-id').textContent = orderId;
            document.getElementById('order-product').textContent = item.title;
            document.getElementById('order-total').textContent = `Rs. ${item.price}`;
            document.getElementById('order-email').textContent = email;
            
            showToast('🎉 Order placed successfully! Check your email.', 'success');
        } else {
            showToast('Order failed. Please try again.', 'error');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        showToast('Network error. Check your connection.', 'error');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
            submitBtn.disabled = false;
        }
    }
}

// ============================================
// SMART CATEGORY MANAGEMENT
// ============================================
function ensureCategoryExists(categoryName) {
    if (!categoryName || categoryName.trim() === '') return 'General';
    const trimmed = categoryName.trim();
    const existing = categories.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    categories.push(trimmed);
    localStorage.setItem('myCategories', JSON.stringify(categories));
    renderCategoriesBar();
    updateHeroStats();
    renderFooterCategories();
    if (typeof renderAdminPanel === 'function') renderAdminPanel();
    if (typeof renderAdminPanels === 'function') renderAdminPanels();
    showToast(`🏷️ New category "${trimmed}" created!`, 'success');
    return trimmed;
}

function detectCategoryFromTitle(title) {
    const keywords = {
        'Watches': ['watch', 'wristwatch', 'chrono', 'timepiece', 'smartwatch', 'analog'],
        'Clothing': ['shirt', 'pants', 'jeans', 'jacket', 'coat', 'dress', 'skirt', 't-shirt', 'hoodie', 'sweater', 'kurta'],
        'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'tv', 'television', 'speaker', 'headphone', 'charger'],
        'Shoes': ['shoe', 'sneaker', 'boot', 'sandal', 'loafer'],
        'Accessories': ['bag', 'belt', 'cap', 'hat', 'scarf', 'sunglass', 'jewelry', 'necklace'],
        'Home': ['furniture', 'lamp', 'chair', 'table', 'bed', 'sofa', 'curtain', 'cushion'],
        'Books': ['book', 'novel', 'magazine', 'textbook', 'story'],
        'Toys': ['toy', 'game', 'puzzle', 'doll', 'car', 'lego'],
        'Food': ['snack', 'chocolate', 'biscuit', 'cake', 'bread', 'rice', 'oil'],
        'Beauty': ['cream', 'lotion', 'shampoo', 'soap', 'perfume', 'makeup']
    };
    const lowerTitle = title.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
        for (const word of words) {
            if (lowerTitle.includes(word)) return category;
        }
    }
    return null;
}

function syncAllCategories() {
    let created = 0;
    products.forEach(product => {
        if (product.category) {
            const existing = categories.find(c => c.toLowerCase() === product.category.toLowerCase());
            if (!existing) {
                categories.push(product.category);
                created++;
            }
        }
    });
    if (created > 0) {
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderCategoriesBar();
        updateHeroStats();
        renderFooterCategories();
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
        if (typeof renderAdminPanels === 'function') renderAdminPanels();
        showToast(`✅ ${created} new categories created!`, 'success');
    }
}

// ============================================
// CATEGORY SUGGESTIONS
// ============================================
function setupCategorySuggestions(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;
    
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim();
        if (!value) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        const matches = categories.filter(c => c.toLowerCase().includes(value));
        if (matches.length > 0) {
            container.innerHTML = matches.map(c => 
                `<div class="suggestion-item" onclick="selectCategory('${c}')">${c}</div>`
            ).join('');
            container.style.display = 'block';
        } else {
            container.innerHTML = `<div class="suggestion-item new-category" onclick="createNewCategory('${value}')">
                ➕ Create "${value}" (new category)
            </div>`;
            container.style.display = 'block';
        }
    });
    input.addEventListener('blur', function() {
        setTimeout(() => { container.style.display = 'none'; }, 200);
    });
}

function selectCategory(category) {
    const input = document.getElementById('new-cat-name') || document.getElementById('p-category-input');
    if (input) {
        input.value = category;
        const container = document.getElementById('category-suggestions') || document.getElementById('category-suggestions-product');
        if (container) container.style.display = 'none';
        if (!categories.includes(category)) ensureCategoryExists(category);
    }
}

function createNewCategory(name) {
    if (name && name.trim()) {
        const trimmed = name.trim();
        if (!categories.includes(trimmed)) {
            ensureCategoryExists(trimmed);
            const input = document.getElementById('new-cat-name') || document.getElementById('p-category-input');
            if (input) {
                input.value = trimmed;
                const container = document.getElementById('category-suggestions') || document.getElementById('category-suggestions-product');
                if (container) container.style.display = 'none';
            }
            if (typeof renderAdminPanel === 'function') renderAdminPanel();
            if (typeof renderAdminPanels === 'function') renderAdminPanels();
        }
    }
}

// ============================================
// ADD PRODUCT (Main - with IMGBB)
// ============================================
async function addProduct() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    let category = document.getElementById('p-category-input')?.value.trim() || 'General';
    
    if (!title || !price) {
        showToast('Product Title and Price are required!', 'error');
        return;
    }

    category = ensureCategoryExists(category);

    let imageUrls = [];
    let sizes = [];
    let colors = [];

    // Check if we're in admin panel with multiple images
    const imagesData = document.getElementById('p-images-data');
    
    if (imagesData) {
        // ADMIN PANEL - Multiple images
        const uploadedImages = JSON.parse(imagesData.value || '[]');
        if (uploadedImages.length === 0) {
            showToast('Please upload at least one image!', 'error');
            return;
        }
        
        // Upload each image to IMGBB
        showToast('Uploading images...', 'info');
        
        for (let img of uploadedImages) {
            try {
                const response = await fetch(img);
                const blob = await response.blob();
                const formData = new FormData();
                formData.append('image', blob);
                
                const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await uploadRes.json();
                if (result.success) {
                    imageUrls.push(result.data.url);
                } else {
                    showToast('Image upload failed: ' + (result.error?.message || 'Unknown error'), 'error');
                    return;
                }
            } catch (e) {
                showToast('Image upload error. Check your connection.', 'error');
                return;
            }
        }
        
        // Get sizes and colors from admin panel
        sizes = JSON.parse(document.getElementById('p-sizes')?.value || '[]');
        colors = JSON.parse(document.getElementById('p-colors')?.value || '[]');
        
    } else {
        // INDEX.HTML MODAL - Single image
        const fileInput = document.getElementById('p-img-file');
        const urlInput = document.getElementById('p-img1');
        let imageSrc = '';
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    imageSrc = result.data.url;
                } else {
                    showToast('Image upload failed.', 'error');
                    return;
                }
            } catch (e) {
                showToast('Image upload error.', 'error');
                return;
            }
        } else if (urlInput && urlInput.value.trim()) {
            imageSrc = urlInput.value.trim();
        }
        
        if (!imageSrc) {
            showToast('Please upload an image or enter a URL.', 'error');
            return;
        }
        imageUrls = [imageSrc];
    }

    const product = {
        title,
        price,
        category,
        images: imageUrls,
        sizes: sizes,
        colors: colors,
        createdAt: new Date().toISOString()
    };

    products.push(product);

    try {
        localStorage.setItem('myProducts', JSON.stringify(products));
    } catch (e) {
        showToast('Storage full! Delete some products.', 'error');
        products.pop();
        return;
    }

    // Clear form
    document.getElementById('p-title').value = '';
    document.getElementById('p-price').value = '';
    if (document.getElementById('p-category-input')) {
        document.getElementById('p-category-input').value = '';
    }
    
    // Clear admin panel specific fields
    if (document.getElementById('p-images-data')) {
        document.getElementById('p-images-data').value = '[]';
        uploadedImages = [];
        renderImagePreviews();
    }
    if (document.getElementById('p-sizes')) {
        document.getElementById('p-sizes').value = '[]';
        document.getElementById('p-colors').value = '[]';
        sizes = [];
        colors = [];
        renderOptions('size');
        renderOptions('color');
    }
    
    // Clear file input
    const fileInput = document.getElementById('p-img-file');
    if (fileInput) fileInput.value = '';
    const urlInput = document.getElementById('p-img1');
    if (urlInput) urlInput.value = '';

    displayProducts(products);
    updateHeroStats();
    renderFooterCategories();
    if (typeof renderAdminPanel === 'function') renderAdminPanel();
    if (typeof renderAdminPanels === 'function') renderAdminPanels();
    if (typeof updateStats === 'function') updateStats();

    showToast(`✅ Product added in "${category}" category!`, 'success');
}

// ============================================
// ADD PRODUCT WITH AUTO-DETECT
// ============================================
async function addProductSmart() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    
    if (!title || !price) {
        showToast('Product Title and Price are required!', 'error');
        return;
    }
    
    let detectedCategory = detectCategoryFromTitle(title);
    
    const categoryInput = document.getElementById('p-category-input');
    if (detectedCategory) {
        detectedCategory = ensureCategoryExists(detectedCategory);
        if (categoryInput) {
            categoryInput.value = detectedCategory;
        }
        showToast(`🔍 Category "${detectedCategory}" detected from title!`, 'info');
    } else {
        showToast('⚠️ No category detected. Please select manually.', 'warning');
        if (categoryInput) {
            categoryInput.focus();
        }
        return;
    }
    
    // Now add the product
    await addProduct();
}

// ============================================
// ADMIN PANEL RENDER FUNCTIONS
// ============================================
function renderAdminPanels() {
    const select = document.getElementById('p-category');
    if (select) {
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const catList = document.getElementById('categories-manage-list');
    if (catList) {
        catList.innerHTML = categories.map((c, i) => `
            <div class="manage-item">
                <span>${c}</span>
                <button class="btn-delete" onclick="deleteCategory(${i})">Delete</button>
            </div>
        `).join('');
    }

    const prodList = document.getElementById('admin-products-list');
    if (prodList) {
        prodList.innerHTML = products.map((p, i) => `
            <div class="manage-item">
                <span><b>[${p.category}]</b> ${p.title}</span>
                <button class="btn-delete" onclick="deleteProduct(${i})">Delete</button>
            </div>
        `).join('');
    }
}

function renderAdminPanel() {
    // Update category dropdown
    const select = document.getElementById('p-category');
    if (select) {
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Category tags
    const catList = document.getElementById('categories-list');
    if (catList) {
        if (categories.length === 0) {
            catList.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No categories yet.</p>';
        } else {
            catList.innerHTML = categories.map((c, i) => `
                <span class="category-tag">
                    ${c}
                    <button class="remove" onclick="deleteCategory(${i})">×</button>
                </span>
            `).join('');
        }
    }

    // Product list
    const prodList = document.getElementById('admin-products-list');
    const emptyMsg = document.getElementById('empty-products');
    if (prodList) {
        if (products.length === 0) {
            prodList.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
        } else {
            if (emptyMsg) emptyMsg.style.display = 'none';
            prodList.innerHTML = products.map((p, i) => `
                <div class="product-item">
                    <div class="info">
                        <img src="${p.images && p.images[0] ? p.images[0] : 'https://via.placeholder.com/45'}" alt="${p.title}" />
                        <div>
                            <div class="title">${p.title}</div>
                            <div class="category">
                                ${p.category || 'General'} • Rs. ${p.price}
                                ${p.sizes && p.sizes.length > 0 ? ` • Sizes: ${p.sizes.join(', ')}` : ''}
                                ${p.colors && p.colors.length > 0 ? ` • Colors: ${p.colors.join(', ')}` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="btn-danger" onclick="deleteProduct(${i})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    updateStats();
}

function updateStats() {
    const totalProducts = document.getElementById('total-products');
    const totalCategories = document.getElementById('total-categories');
    const totalOrders = document.getElementById('total-orders');
    const totalCustomers = document.getElementById('total-customers');
    const productCount = document.getElementById('product-count');
    
    if (totalProducts) totalProducts.textContent = products.length;
    if (totalCategories) totalCategories.textContent = categories.length;
    if (totalOrders) totalOrders.textContent = localStorage.getItem('orderCount') || 0;
    if (totalCustomers) totalCustomers.textContent = localStorage.getItem('customerCount') || 0;
    if (productCount) productCount.textContent = products.length;
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================
function addCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    if (name && !categories.includes(name)) {
        categories.push(name);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        document.getElementById('new-cat-name').value = '';
        renderCategoriesBar();
        updateHeroStats();
        renderFooterCategories();
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
        if (typeof renderAdminPanels === 'function') renderAdminPanels();
        showToast('Category added!', 'success');
    } else if (!name) {
        showToast('Please enter a category name.', 'error');
    } else {
        showToast('Category already exists.', 'error');
    }
}

function deleteCategory(index) {
    if (confirm('Delete this category?')) {
        categories.splice(index, 1);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderCategoriesBar();
        updateHeroStats();
        renderFooterCategories();
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
        if (typeof renderAdminPanels === 'function') renderAdminPanels();
        showToast('Category deleted.', 'success');
    }
}

// ============================================
// PRODUCT MANAGEMENT
// ============================================
function deleteProduct(index) {
    if (confirm('Delete this product?')) {
        products.splice(index, 1);
        localStorage.setItem('myProducts', JSON.stringify(products));
        displayProducts(products);
        updateHeroStats();
        renderFooterCategories();
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
        if (typeof renderAdminPanels === 'function') renderAdminPanels();
        if (typeof updateStats === 'function') updateStats();
        showToast('Product deleted.', 'success');
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        alert(message);
        return;
    }
    const msgEl = document.getElementById('toast-message');
    const titleEl = toast.querySelector('.toast-title');
    msgEl.textContent = message;
    const titles = { 
        success: '✅ Success!', 
        error: '❌ Error!', 
        info: 'ℹ️ Info', 
        warning: '⚠️ Warning' 
    };
    if (titleEl) titleEl.textContent = titles[type] || titles.success;
    toast.className = 'toast';
    if (type) toast.classList.add(type);
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ============================================
// RESET STORAGE
// ============================================
function resetStorage() {
    if (confirm('⚠️ This will delete ALL data. Continue?')) {
        localStorage.clear();
        showToast('Storage cleared! Refreshing...', 'warning');
        setTimeout(() => location.reload(), 1000);
    }
}

// ============================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================
window.ensureCategoryExists = ensureCategoryExists;
window.detectCategoryFromTitle = detectCategoryFromTitle;
window.addProductSmart = addProductSmart;
window.syncAllCategories = syncAllCategories;
window.selectCategory = selectCategory;
window.createNewCategory = createNewCategory;
window.renderAdminPanel = renderAdminPanel;
window.renderAdminPanels = renderAdminPanels;
window.updateStats = updateStats;
window.showToast = showToast;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.deleteProduct = deleteProduct;
window.addProduct = addProduct;
window.resetStorage = resetStorage;
window.filterCategory = filterCategory;
window.goToCheckout = goToCheckout;
window.submitOrder = submitOrder;
window.changeImage = changeImage;
window.displayProducts = displayProducts;
window.renderCategoriesBar = renderCategoriesBar;
window.setupCategorySuggestions = setupCategorySuggestions;
window.updateHeroStats = updateHeroStats;
window.renderFooterCategories = renderFooterCategories;
window.addOption = addOption;
window.removeOption = removeOption;
window.removeImage = removeImage;
window.renderImagePreviews = renderImagePreviews;
window.setupImageUpload = setupImageUpload;
window.loadSavedOptions = loadSavedOptions;
window.uploadedImages = uploadedImages;
window.sizes = sizes;
window.colors = colors;