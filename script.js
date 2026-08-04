// ============================================
// CONFIGURATION
// ============================================
const IMGBB_API_KEY = '311cba478ef03480a9e99f45226dc6ac';
const CATEGORY_AUTO_DETECT = true;
const AUTO_CREATE_CATEGORIES = true;

// ============================================
// DEFAULT DATA
// ============================================
const defaultCategories = ["Watches", "Clothing", "Electronics"];

const defaultProducts = [
    {
        title: "Trending Smart Watch",
        price: "2500",
        category: "Watches",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"]
    }
];

// ============================================
// STATE MANAGEMENT
// ============================================
let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

// ============================================
// DOM READY - INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    renderCategoriesBar();
    displayProducts(products);
    setupCategorySuggestions('new-cat-name', 'category-suggestions');
    setupCategorySuggestions('p-category-input', 'category-suggestions-product');
    
    // Setup tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const tabId = this.dataset.tab;
            const content = document.getElementById(`tab-${tabId}`);
            if (content) content.classList.add('active');
            if (tabId === 'manage-products') renderAdminPanels();
        });
    });
    
    // Sync categories after load
    setTimeout(() => syncAllCategories(), 500);
});

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
// DISPLAY PRODUCTS
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

        cards += `
            <div class="card">
                <span class="badge">${p.category || 'General'}</span>
                <img id="img-${i}" src="${imgs[0]}" class="p-img" loading="lazy" alt="${p.title}">
                ${thumbs}
                <h3>${p.title}</h3>
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
// FILTER CATEGORY
// ============================================
function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

// ============================================
// CHANGE IMAGE (Thumbnail Click)
// ============================================
function changeImage(idx, src) {
    const el = document.getElementById(`img-${idx}`);
    if (el) el.src = src;
}

// ============================================
// GO TO CHECKOUT
// ============================================
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

// ============================================
// CHECKOUT PAGE SYNC
// ============================================
if (document.getElementById('checkout-product-title')) {
    const item = JSON.parse(localStorage.getItem('checkoutItem'));
    if (item) {
        document.getElementById('checkout-product-title').innerText = item.title;
        document.getElementById('checkout-product-price').innerText = `Rs. ${item.price}`;
    }
}

// ============================================
// SUBMIT ORDER (Nodemailer)
// ============================================
async function submitOrder() {
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !phone || !address || !item) {
        showToast('Please fill all fields (Name, Phone, Address)!', 'error');
        return;
    }

    const submitBtn = document.querySelector('.btn-whatsapp');
    if (submitBtn) {
        submitBtn.innerText = "Processing...";
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch('/api/send-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: item.title,
                price: item.price,
                name: name,
                phone: phone,
                address: address
            })
        });

        const result = await response.json();

        if (result.success) {
            let orders = parseInt(localStorage.getItem('orderCount') || 0);
            localStorage.setItem('orderCount', orders + 1);
            
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
            showToast('🎉 Order placed successfully!', 'success');
        } else {
            showToast('Order failed. Please try again.', 'error');
            if (submitBtn) {
                submitBtn.innerText = "✅ Confirm Order";
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        showToast('Network error. Check your connection.', 'error');
        if (submitBtn) {
            submitBtn.innerText = "✅ Confirm Order";
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
    if (typeof renderAdminPanels === 'function') renderAdminPanels();
    if (typeof renderAdminPanel === 'function') renderAdminPanel();
    
    showToast(`🏷️ New category "${trimmed}" created!`, 'success');
    return trimmed;
}

function detectCategoryFromTitle(title) {
    const keywords = {
        'Watches': ['watch', 'wristwatch', 'chrono', 'timepiece', 'smartwatch', 'analog', 'digital watch'],
        'Clothing': ['shirt', 'pants', 'jeans', 'jacket', 'coat', 'dress', 'skirt', 't-shirt', 'hoodie', 'sweater', 'kurta', 'shalwar', 'cloth'],
        'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'tv', 'television', 'speaker', 'headphone', 'charger', 'cable', 'battery', 'electronic'],
        'Shoes': ['shoe', 'sneaker', 'boot', 'sandal', 'loafer', 'heel', 'footwear'],
        'Accessories': ['bag', 'belt', 'cap', 'hat', 'scarf', 'glove', 'sunglass', 'jewelry', 'necklace', 'ring'],
        'Home': ['furniture', 'lamp', 'chair', 'table', 'bed', 'sofa', 'curtain', 'cushion', 'pillow'],
        'Books': ['book', 'novel', 'magazine', 'textbook', 'story', 'comic'],
        'Toys': ['toy', 'game', 'puzzle', 'doll', 'car', 'lego', 'board game'],
        'Food': ['snack', 'chocolate', 'biscuit', 'cake', 'bread', 'rice', 'oil', 'spice'],
        'Beauty': ['cream', 'lotion', 'shampoo', 'soap', 'perfume', 'makeup', 'cosmetic']
    };
    
    const lowerTitle = title.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
        for (const word of words) {
            if (lowerTitle.includes(word)) {
                return category;
            }
        }
    }
    return null;
}

function syncAllCategories() {
    let created = 0;
    products.forEach(product => {
        if (product.category) {
            const existing = categories.find(c => 
                c.toLowerCase() === product.category.toLowerCase()
            );
            if (!existing) {
                categories.push(product.category);
                created++;
            }
        }
    });
    
    if (created > 0) {
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderCategoriesBar();
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
        if (typeof renderAdminPanels === 'function') renderAdminPanels();
        showToast(`✅ ${created} new categories created!`, 'success');
    } else {
        showToast('All categories are already synced!', 'info');
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
        
        const matches = categories.filter(c => 
            c.toLowerCase().includes(value)
        );
        
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
        setTimeout(() => {
            container.style.display = 'none';
        }, 200);
    });
}

function selectCategory(category) {
    const input = document.getElementById('new-cat-name');
    if (input) {
        input.value = category;
        document.getElementById('category-suggestions').style.display = 'none';
        if (!categories.includes(category)) {
            ensureCategoryExists(category);
        }
    }
}

function createNewCategory(name) {
    if (name && name.trim()) {
        const trimmed = name.trim();
        if (!categories.includes(trimmed)) {
            ensureCategoryExists(trimmed);
            const input = document.getElementById('new-cat-name');
            if (input) {
                input.value = trimmed;
                document.getElementById('category-suggestions').style.display = 'none';
            }
            if (typeof renderAdminPanel === 'function') renderAdminPanel();
            if (typeof renderAdminPanels === 'function') renderAdminPanels();
        }
    }
}

// ============================================
// ADD PRODUCT (with IMGBB Upload)
// ============================================
async function addProduct() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    let category = document.getElementById('p-category-input')?.value.trim() || 'General';
    const fileInput = document.getElementById('p-img-file');
    const urlInput = document.getElementById('p-img1');

    if (!title || !price) {
        showToast('Product Title and Price are required!', 'error');
        return;
    }

    // Ensure category exists
    category = ensureCategoryExists(category);

    let imageSrc = '';

    // Try file upload via IMGBB
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
                showToast('Image upload failed: ' + (result.error?.message || 'Unknown error'), 'error');
                return;
            }
        } catch (e) {
            showToast('Image upload error. Check your connection.', 'error');
            return;
        }
    } else if (urlInput && urlInput.value.trim()) {
        imageSrc = urlInput.value.trim();
    }

    if (!imageSrc) {
        showToast('Please upload an image or enter a URL.', 'error');
        return;
    }

    // Add product
    products.push({ title, price, category, images: [imageSrc] });
    
    try {
        localStorage.setItem('myProducts', JSON.stringify(products));
    } catch (e) {
        showToast('Storage full! Delete some old products.', 'error');
        products.pop();
        return;
    }

    // Clear form
    document.getElementById('p-title').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-category-input').value = '';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';

    // Update UI
    displayProducts(products);
    if (typeof renderAdminPanels === 'function') renderAdminPanels();
    if (typeof renderAdminPanel === 'function') renderAdminPanel();
    
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
    
    // Detect category from title
    let detectedCategory = detectCategoryFromTitle(title);
    
    if (detectedCategory) {
        detectedCategory = ensureCategoryExists(detectedCategory);
        const input = document.getElementById('p-category-input');
        if (input) {
            input.value = detectedCategory;
        }
        showToast(`🔍 Category "${detectedCategory}" detected from title!`, 'info');
    }
    
    // Add product
    await addProduct();
}

// ============================================
// ADMIN PANEL RENDER
// ============================================
function renderAdminPanels() {
    // Update category dropdown
    const select = document.getElementById('p-category');
    if (select) {
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Category list
    const catList = document.getElementById('categories-manage-list');
    if (catList) {
        catList.innerHTML = categories.map((c, i) => `
            <div class="manage-item">
                <span>${c}</span>
                <button class="btn-delete" onclick="deleteCategory(${i})">Delete</button>
            </div>
        `).join('');
    }

    // Product list
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
        catList.innerHTML = categories.map((c, i) => `
            <span class="category-tag">
                ${c}
                <button class="remove" onclick="deleteCategory(${i})">×</button>
            </span>
        `).join('');
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
                            <span class="category">${p.category || 'General'} • Rs. ${p.price}</span>
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
    const productCount = document.getElementById('product-count');
    
    if (totalProducts) totalProducts.textContent = products.length;
    if (totalCategories) totalCategories.textContent = categories.length;
    if (totalOrders) totalOrders.textContent = localStorage.getItem('orderCount') || 0;
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
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
        if (typeof renderAdminPanels === 'function') renderAdminPanels();
        showToast('Product deleted.', 'success');
    }
}

// ============================================
// TOGGLE ADMIN MODAL
// ============================================
function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';
    
    if (!isVisible) {
        renderAdminPanels();
        setTimeout(() => {
            setupCategorySuggestions('new-cat-name', 'category-suggestions');
            setupCategorySuggestions('p-category-input', 'category-suggestions-product');
        }, 100);
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
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
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
window.toggleAdminModal = toggleAdminModal;
window.filterCategory = filterCategory;
window.goToCheckout = goToCheckout;
window.submitOrder = submitOrder;
window.changeImage = changeImage;
window.displayProducts = displayProducts;
window.renderCategoriesBar = renderCategoriesBar;
window.setupCategorySuggestions = setupCategorySuggestions;