// ================= MARKAZ STORE FRONTEND SCRIPT ================= //

const defaultCategories = ["Watches", "Clothing", "Electronics", "Beauty"];

const defaultProducts = [
    {
        title: "Trending Smart Watch",
        price: "2500",
        category: "Watches",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"]
    }
];

let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

window.addEventListener('DOMContentLoaded', () => {
    renderCategoriesBar();
    displayProducts(products);
});

// Render Category Bar Buttons
function renderCategoriesBar() {
    const catBar = document.getElementById('category-bar');
    if (!catBar) return;

    let html = `<button onclick="filterCategory('All', this)" class="cat-btn active bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition">All</button>`;
    
    categories.forEach(cat => {
        html += `<button onclick="filterCategory('${cat}', this)" class="cat-btn bg-slate-900 text-slate-300 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap transition hover:border-slate-700">${cat}</button>`;
    });
    catBar.innerHTML = html;
}

// Display Products Card in Horizontal Deck
function displayProducts(list) {
    const container = document.getElementById('product-container');
    if (!container) return;

    currentFilterProducts = list;

    if (!list.length) {
        container.innerHTML = `<p class="text-slate-500 text-xs py-8 w-full text-center">No products found in this category.</p>`;
        return;
    }

    let cards = '';
    list.forEach((p, i) => {
        const img = (p.images && p.images.length) ? p.images[0] : 'https://via.placeholder.com/200';

        cards += `
            <div class="snap-start w-[200px] min-w-[200px] bg-slate-900 border border-slate-800 p-3 rounded-2xl flex-shrink-0 flex flex-col justify-between shadow-lg">
                <div>
                    <div class="relative mb-2">
                        <span class="absolute top-2 left-2 bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur">
                            ${p.category || 'General'}
                        </span>
                        <img src="${img}" class="w-full h-44 object-cover rounded-xl bg-slate-950" loading="lazy" alt="${p.title}">
                    </div>
                    <h3 class="text-xs font-semibold text-slate-200 line-clamp-2 min-h-[32px]">${p.title}</h3>
                    <div class="text-sm font-bold text-indigo-400 mt-1">Rs. ${p.price}</div>
                </div>
                <button onclick="goToCheckout(${i})" class="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition shadow-md">
                    Order Now
                </button>
            </div>
        `;
    });
    container.innerHTML = cards;
}

// Filter Products
function filterCategory(cat, btn) {
    document.querySelectorAll('#category-bar button').forEach(b => {
        b.className = "cat-btn bg-slate-900 text-slate-300 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap transition hover:border-slate-700";
    });

    if (btn) {
        btn.className = "cat-btn active bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition";
    }

    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

// Go To Checkout
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
