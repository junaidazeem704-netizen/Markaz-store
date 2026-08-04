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
        colors: ["Black", "Silver"],
        description: "Premium smart watch with fitness tracking and heart rate monitor."
    },
    {
        title: "Premium Leather Jacket",
        price: "8500",
        category: "Clothing",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Brown", "Tan"],
        description: "High quality genuine leather jacket for men. Perfect for winter."
    },
    {
        title: "Wireless Bluetooth Headphones",
        price: "4500",
        category: "Electronics",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"],
        sizes: [],
        colors: ["Black", "White", "Blue"],
        description: "Premium wireless headphones with noise cancellation and 30hr battery life."
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
    updateHeroStats();
    renderFooterCategories();
    setupCategorySuggestions('new-cat-name', 'category-suggestions');
    setupCategorySuggestions('p-category-input', 'category-suggestions-product');
    
    // Update cart badge
    updateCartBadge();
    
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
    
    setTimeout(() => syncAllCategories(), 500);
});

// ============================================
// UPDATE CART BADGE
// ============================================
// ============================================
// UPDATE CART BADGE
// ============================================
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = cart.length;
    });
}

// ============================================
// DISPLAY PRODUCTS (For Products Page)
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
                imgs.slice(0, 4).map(img => `<img src="${img}" class="t-img">`).join('') + 
                `</div>`;
        }
        
        let sizeHtml = '';
        if (p.sizes && p.sizes.length > 0) {
            sizeHtml = `<div class="product-options"><span class="opt-label">Sizes:</span> ${p.sizes.slice(0, 3).map(s => `<span class="opt-tag">${s}</span>`).join('')}${p.sizes.length > 3 ? ' +' : ''}</div>`;
        }
        
        let colorHtml = '';
        if (p.colors && p.colors.length > 0) {
            colorHtml = `<div class="product-options"><span class="opt-label">Colors:</span> ${p.colors.slice(0, 3).map(c => `<span class="opt-tag color-dot" style="background:${c.toLowerCase()};color:white;padding:2px 10px;border-radius:4px;">${c}</span>`).join('')}${p.colors.length > 3 ? ' +' : ''}</div>`;
        }

        cards += `
            <div class="card" onclick="viewProduct(${i})" style="cursor:pointer;">
                <span class="badge">${p.category || 'General'}</span>
                <img src="${imgs[0]}" class="p-img" loading="lazy" alt="${p.title}">
                ${thumbs}
                <h3>${p.title}</h3>
                ${sizeHtml}
                ${colorHtml}
                <div class="price">Rs. ${p.price}</div>
                <button class="wa-btn" onclick="event.stopPropagation(); viewProduct(${i})">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `;
    });
    container.innerHTML = cards;
}

// ============================================
// VIEW PRODUCT (Navigate to detail page)
// ============================================
function viewProduct(index) {
    const item = currentFilterProducts[index];
    if (item) {
        localStorage.setItem('viewProduct', JSON.stringify({
            index: index,
            ...item
        }));
        window.location.href = 'product-detail.html';
    }
}

// ============================================
// FILTER CATEGORY
// ============================================
function filterCategory(cat, btn) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    if (cat === 'All') {
        displayProducts(products);
    } else {
        displayProducts(products.filter(p => p.category === cat));
    }
}

// ============================================
// RENDER CATEGORIES BAR
// ============================================
function renderCategoriesBar() {
    const catBar = document.getElementById('category-bar');
    if (catBar) {
        let html = `<button class="cat-btn active" onclick="filterCategory('All', this)">All</button>`;
        categories.forEach(cat => {
            html += `<button class="cat-btn" onclick="filterCategory('${cat}', this)">${cat}</button>`;
        });
        catBar.innerHTML = html;
    }
    
    // Also render category filter on products page
    const catFilter = document.getElementById('category-filter');
    if (catFilter) {
        let html = `<button class="cat-btn active" onclick="filterCategory('All', this)">All</button>`;
        categories.forEach(cat => {
            html += `<button class="cat-btn" onclick="filterCategory('${cat}', this)">${cat}</button>`;
        });
        catFilter.innerHTML = html;
    }
}

// ============================================
// SMART CATEGORY MANAGEMENT (FIXED AUTO-DETECT)
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
    if (!title) return null;
    
    const keywords = {
        'Watches': ['watch', 'wristwatch', 'chrono', 'timepiece', 'smartwatch', 'analog', 'digital watch', 'timex', 'casio'],
        'Clothing': ['shirt', 'pants', 'jeans', 'jacket', 'coat', 'dress', 'skirt', 't-shirt', 'hoodie', 'sweater', 'kurta', 'shalwar', 'cloth', 'fabric', 'wear', 'fashion'],
        'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'tv', 'television', 'speaker', 'headphone', 'charger', 'cable', 'battery', 'electronic', 'gadget', 'device'],
        'Shoes': ['shoe', 'sneaker', 'boot', 'sandal', 'loafer', 'footwear', 'heel'],
        'Accessories': ['bag', 'belt', 'cap', 'hat', 'scarf', 'glove', 'sunglass', 'jewelry', 'necklace', 'ring', 'accessory'],
        'Home': ['furniture', 'lamp', 'chair', 'table', 'bed', 'sofa', 'curtain', 'cushion', 'pillow', 'home'],
        'Books': ['book', 'novel', 'magazine', 'textbook', 'story', 'comic', 'reading'],
        'Toys': ['toy', 'game', 'puzzle', 'doll', 'car', 'lego', 'board game', 'play'],
        'Food': ['snack', 'chocolate', 'biscuit', 'cake', 'bread', 'rice', 'oil', 'spice', 'food', 'drink'],
        'Beauty': ['cream', 'lotion', 'shampoo', 'soap', 'perfume', 'makeup', 'cosmetic', 'beauty']
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

// ============================================
// ADD PRODUCT WITH AUTO-DETECT (FIXED)
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
    
    const categoryInput = document.getElementById('p-category-input');
    
    if (detectedCategory) {
        // Ensure category exists
        detectedCategory = ensureCategoryExists(detectedCategory);
        if (categoryInput) {
            categoryInput.value = detectedCategory;
        }
        showToast(`🔍 Category "${detectedCategory}" detected from title!`, 'info');
    } else {
        showToast('⚠️ No category detected. Please select manually.', 'warning');
        if (categoryInput) {
            categoryInput.focus();
            categoryInput.style.borderColor = '#f59e0b';
            setTimeout(() => {
                categoryInput.style.borderColor = '';
            }, 3000);
        }
        return;
    }
    
    // Now add the product
    await addProduct();
}

// ============================================
// SYNC ALL CATEGORIES
// ============================================
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
        `<a href="products.html" onclick="localStorage.setItem('filterCategory','${c}')">${c}</a>`
    ).join('');
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
window.showToast = showToast;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.deleteProduct = deleteProduct;
window.addProduct = addProduct;
window.resetStorage = resetStorage;
window.filterCategory = filterCategory;
window.viewProduct = viewProduct;
window.displayProducts = displayProducts;
window.renderCategoriesBar = renderCategoriesBar;
window.setupCategorySuggestions = setupCategorySuggestions;
window.updateHeroStats = updateHeroStats;
window.renderFooterCategories = renderFooterCategories;
window.updateCartBadge = updateCartBadge;

// These will be overridden in admin-script.js
function addCategory() {}
function deleteCategory(index) {}
function deleteProduct(index) {}
function addProduct() {}
function renderAdminPanel() {}
function renderAdminPanels() {}
function updateStats() {}
function setupImageUpload() {}
function loadSavedOptions() {}
function addOption() {}
function removeOption() {}
function removeImage() {}
function renderImagePreviews() {}