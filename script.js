// ================= MARKAZ STORE MAIN SCRIPT ================= //

// Default initial products (Agar storage empty ho)
const defaultProducts = [
    {
        id: "101",
        title: "Designer Stitched Suit 3 Pcs",
        price: 2850,
        category: "Clothing",
        sizes: ["Small", "Medium", "Large"],
        colors: ["Emerald Green", "Royal Blue"],
        images: ["https://i.ibb.co/6P0YpP6/suit-sample.jpg"]
    }
];

// Local Storage se products fetch karne ka function
function getAllProducts() {
    const saved = localStorage.getItem('markazProducts');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
            console.error("Error reading storage:", e);
        }
    }
    return defaultProducts;
}

// Home Page Slider Deck Render Function
function renderProducts(categoryFilter = "All") {
    const container = document.getElementById('product-container');
    if (!container) return;

    const products = getAllProducts();
    const filtered = (categoryFilter === "All") 
        ? products 
        : products.filter(p => (p.category || "").toLowerCase() === categoryFilter.toLowerCase());

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="w-full text-center py-10 text-slate-500 text-xs">
                Is category mein abhi koi product majood nahi hai.
            </div>`;
        return;
    }

    container.innerHTML = filtered.map((p) => {
        const mainPhoto = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || "https://via.placeholder.com/400x500");
        const encodedData = encodeURIComponent(JSON.stringify(p));

        return `
            <div class="w-[260px] sm:w-[280px] flex-shrink-0 snap-center bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-slate-700 transition">
                
                <!-- Product Image -->
                <div class="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                    <span class="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider z-10">
                        ${p.category || "General"}
                    </span>
                    <img src="${mainPhoto}" loading="lazy" alt="${p.title}" class="w-full h-full object-cover" />
                </div>

                <!-- Product Info -->
                <div class="p-4 space-y-2">
                    <h3 class="font-bold text-white text-sm line-clamp-1">${p.title}</h3>
                    
                    <div class="flex items-baseline justify-between">
                        <span class="text-emerald-400 font-extrabold text-base">Rs. ${p.price}</span>
                        <span class="text-[10px] text-slate-500 line-through">Rs. ${Math.round(p.price * 1.25)}</span>
                    </div>

                    <!-- Preview Button -->
                    <button onclick="previewAndBuy('${encodedData}')" class="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5 mt-1">
                        👁️ Preview & Order
                    </button>
                </div>

            </div>
        `;
    }).join('');
}

// Filter Tab Buttons Handler
function setupCategoryFilters() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => {
                b.className = "category-btn bg-slate-900 text-slate-300 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap transition";
            });
            e.target.className = "category-btn active bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition shadow-md";
            
            const category = e.target.getAttribute('data-category') || "All";
            renderProducts(category);
        });
    });
}

// Preview Page Redirection
function previewAndBuy(productEncoded) {
    try {
        const product = JSON.parse(decodeURIComponent(productEncoded));
        localStorage.setItem('previewProduct', JSON.stringify(product));
        window.location.href = "product.html";
    } catch (err) {
        console.error("Preview error:", err);
    }
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    renderProducts("All");
    setupCategoryFilters();
});
