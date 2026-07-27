// ================= MARKAZ STORE MAIN SCRIPT WITH SLIDER ================= //

const defaultProducts = [
    {
        id: "1",
        title: "2 pcs suits unstitched",
        price: 2200,
        originalPrice: 2750,
        category: "Clothing",
        images: [
            "https://i.ibb.co/6P0YpP6/suit-sample.jpg"
        ],
        rating: "⭐⭐⭐⭐⭐ (32)",
        isCjProduct: false
    }
];

// Fetch Products from Local Storage
function getAllProducts() {
    const saved = localStorage.getItem('markazProducts');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error("Storage error:", e);
        }
    }
    return defaultProducts;
}

// Render Products with Image Slider Carousel
function renderProducts(categoryFilter = "All") {
    const container = document.getElementById('product-container');
    if (!container) return;

    const products = getAllProducts();

    const filtered = (categoryFilter === "All" || categoryFilter === "all") 
        ? products 
        : products.filter(p => (p.category || "").toLowerCase() === categoryFilter.toLowerCase());

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-500 text-xs py-10">
                Is category mein abhi koi product nahi hai.
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((p, index) => {
        // Collect Image Array or Fallback Single Image
        let imgList = [];
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            imgList = p.images;
        } else if (p.imageUrl || p.image) {
            imgList = [p.imageUrl || p.image];
        } else {
            imgList = ["https://via.placeholder.com/400x500"];
        }

        const price = p.price || 2200;
        const originalPrice = p.originalPrice || Math.round(price * 1.25);
        const category = (p.category || "Clothing").toUpperCase();
        const title = p.title || "Product";
        const productJSON = encodeURIComponent(JSON.stringify(p));

        return `
            <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                
                <!-- 📸 IMAGE SLIDER BOX -->
                <div class="relative w-full aspect-[4/5] bg-slate-950 overflow-hidden group">
                    
                    <!-- Badges -->
                    <span class="absolute top-3 left-3 z-20 bg-indigo-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur">
                        ${category}
                    </span>
                    <span class="absolute top-3 right-3 z-20 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        SALE
                    </span>

                    <!-- Horizontal Scrollable Slider (Finger Swipe Enabled) -->
                    <div class="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
                        ${imgList.map((imgUrl) => `
                            <img 
                                src="${imgUrl}" 
                                class="w-full h-full object-cover flex-shrink-0 snap-center" 
                                loading="lazy" 
                                alt="${title}"
                            />
                        `).join('')}
                    </div>

                    <!-- Slide Indicator Dots (If multiple images) -->
                    ${imgList.length > 1 ? `
                        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-slate-950/60 px-2 py-1 rounded-full backdrop-blur">
                            ${imgList.map((_, i) => `<span class="w-1.5 h-1.5 rounded-full bg-white/70"></span>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- 🏷️ PRODUCT DETAILS -->
                <div class="p-4 space-y-3">
                    <div class="text-xs text-amber-400 font-medium">
                        ${p.rating || '⭐⭐⭐⭐⭐ (32)'}
                    </div>

                    <h3 class="font-bold text-white text-base leading-snug line-clamp-2">
                        ${title}
                    </h3>

                    <div class="flex items-baseline gap-2">
                        <span class="text-xl font-extrabold text-emerald-400">Rs. ${price}</span>
                        <span class="text-xs text-slate-500 line-through">Rs. ${originalPrice}</span>
                    </div>

                    <button onclick="previewAndBuy('${productJSON}')" class="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition duration-150 text-sm shadow-lg flex items-center justify-center gap-2">
                        👁️ Preview & Buy
                    </button>
                </div>

            </div>
        `;
    }).join('');
}

// Category Filter Setup
function setupCategoryFilters() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => {
                b.classList.remove('active', 'bg-indigo-600', 'text-white');
                b.classList.add('bg-slate-900', 'text-slate-300');
            });

            e.target.classList.add('active', 'bg-indigo-600', 'text-white');
            e.target.classList.remove('bg-slate-900', 'text-slate-300');

            const selectedCat = e.target.getAttribute('data-category') || "All";
            renderProducts(selectedCat);
        });
    });
}

// Preview & Buy Handler
function previewAndBuy(productEncoded) {
    try {
        const product = JSON.parse(decodeURIComponent(productEncoded));
        localStorage.setItem('selectedProduct', JSON.stringify({
            title: product.title || "Product",
            price: product.price || 0,
            cjSku: product.sku || product.cjSku || "",
            isCjProduct: product.isCjProduct || false,
            imageUrl: (product.images && product.images[0]) || product.imageUrl || product.image || ""
        }));
        window.location.href = "checkout.html";
    } catch (err) {
        console.error("Select error:", err);
    }
}

// Auto Load
document.addEventListener("DOMContentLoaded", () => {
    renderProducts("All");
    setupCategoryFilters();
});
