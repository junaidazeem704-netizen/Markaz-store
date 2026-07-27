// ================= MARKAZ STORE MAIN SCRIPT (script.js) ================= //

// 1. Initial Default Products (Agar local storage khali ho)
const defaultProducts = [
    {
        id: "1",
        title: "Trending suit loan",
        price: 2200,
        originalPrice: 2750,
        category: "Clothing",
        imageUrl: "https://i.ibb.co/6P0YpP6/suit-sample.jpg",
        rating: "⭐⭐⭐⭐⭐ (32)",
        isCjProduct: false
    }
];

// 2. Fetch Products (Admin LocalStorage + Default)
function getAllProducts() {
    const saved = localStorage.getItem('markazProducts');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error("LocalStorage read error:", e);
        }
    }
    return defaultProducts;
}

// 3. Render Products To Store Page (FIXED HTML syntax)
function renderProducts(categoryFilter = "All") {
    // Product Container Target
    const container = document.getElementById('product-container') || 
                      document.querySelector('.product-grid') || 
                      document.querySelector('.products-container') ||
                      document.getElementById('products');

    if (!container) return;

    const products = getAllProducts();

    // Category Filter
    const filteredProducts = (categoryFilter === "All" || categoryFilter === "all") 
        ? products 
        : products.filter(p => (p.category || "").toLowerCase() === categoryFilter.toLowerCase());

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 40px 0;">
                <p>Is category mein koi product nahi mila.</p>
            </div>
        `;
        return;
    }

    // Render Cards
    container.innerHTML = filteredProducts.map(p => {
        const imageSrc = p.imageUrl || p.image || "https://via.placeholder.com/300";
        const price = p.price || 2200;
        const originalPrice = p.originalPrice || Math.round(price * 1.25);
        const category = (p.category || "Clothing").toUpperCase();
        const title = p.title || "Trending Product";

        const productJSON = encodeURIComponent(JSON.stringify(p));

        return `
            <div class="product-card">
                <span class="category-badge">${category}</span>
                <span class="sale-badge">SALE</span>
                
                <!-- 🛠️ FIXED IMAGE TAG (NO TEXT GLITCH) -->
                <img src="${imageSrc}" class="p-img" loading="lazy" alt="${title}">
                
                <div class="product-info">
                    <div class="rating">${p.rating || '⭐⭐⭐⭐⭐ (32)'}</div>
                    <h3 class="product-title">${title}</h3>
                    
                    <div class="price-container">
                        <span class="current-price">Rs. ${price}</span>
                        <span class="original-price">Rs. ${originalPrice}</span>
                    </div>
                    
                    <button onclick="previewAndBuy('${productJSON}')" class="preview-btn">
                        👁️ Preview & Buy
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Category Filter Buttons Click Handler
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.category-btn, .filter-chip, button[data-category]');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const selectedCat = e.target.getAttribute('data-category') || e.target.innerText.trim();
            renderProducts(selectedCat);
        });
    });
}

// 5. Preview & Buy Button Click (Redirect to Checkout)
function previewAndBuy(productEncoded) {
    try {
        const product = JSON.parse(decodeURIComponent(productEncoded));
        
        // Selected Product Storage
        localStorage.setItem('selectedProduct', JSON.stringify({
            title: product.title || "Product",
            price: product.price || 0,
            cjSku: product.sku || product.cjSku || "",
            isCjProduct: product.isCjProduct || false,
            imageUrl: product.imageUrl || product.image || ""
        }));

        // Redirect to Checkout Page
        window.location.href = "checkout.html";
    } catch (err) {
        console.error("Product select error:", err);
    }
}

// 6. Page Load Auto-Execution
document.addEventListener("DOMContentLoaded", () => {
    renderProducts("All");
    setupCategoryFilters();
});
