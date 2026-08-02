// ================= MARKAZ STORE COMPLETE SYNCED SCRIPT ================= //

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

const IMGBB_API_KEY = "311cba478ef03480a9e99f45226dc6ac";

// Modal Admin Toggle
function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        renderAdminPanels();
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

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

// Ultra-Fast Canvas Compressor
function compressPhoto(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const scale = MAX_WIDTH / img.width;
                
                canvas.width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
                canvas.height = (img.width > MAX_WIDTH) ? (img.height * scale) : img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.65));
            };
            img.onerror = () => resolve(e.target.result);
        };
        reader.onerror = () => resolve('');
    });
}

// High Speed Safe Upload
async function processProductPhoto(file) {
    const compressedLocal = await compressPhoto(file);

    try {
        const base64Clean = compressedLocal.split(',')[1];
        const formData = new FormData();
        formData.append("image", base64Clean);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const resData = await response.json();
        if (resData && resData.success && resData.data && resData.data.url) {
            return resData.data.url;
        }
    } catch (err) {
        console.warn("ImgBB API fallback active.", err);
    }

    return compressedLocal;
}

// Add Product Function
async function addProduct() {
    const titleInput = document.getElementById('p-title');
    const priceInput = document.getElementById('p-price');
    const catInput = document.getElementById('p-category');
    const fileInput = document.getElementById('p-img-file');
    const urlInput = document.getElementById('p-img1');
    const statusBox = document.getElementById('upload-status');

    if (!titleInput || !priceInput) return;

    const title = titleInput.value.trim();
    const price = priceInput.value.trim();
    const category = catInput ? catInput.value : 'General';

    if (!title || !price) {
        alert('Product Title aur Price bharna zaroori hai!');
        return;
    }

    let finalImageUrl = '';

    if (fileInput && fileInput.files && fileInput.files[0]) {
        if (statusBox) {
            statusBox.style.color = "#818cf8";
            statusBox.innerText = "⏳ Saving Photo...";
        }

        finalImageUrl = await processProductPhoto(fileInput.files[0]);

    } else if (urlInput && urlInput.value.trim()) {
        finalImageUrl = urlInput.value.trim();
    }

    if (!finalImageUrl) {
        alert('Photo select karein!');
        return;
    }

    products.push({ title, price, category, images: [finalImageUrl] });

    try {
        localStorage.setItem('myProducts', JSON.stringify(products));
    } catch (e) {
        console.warn("Storage warning", e);
    }

    titleInput.value = '';
    priceInput.value = '';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (statusBox) statusBox.innerText = '';

    displayProducts(products);
    renderAdminPanels();
    toggleAdminModal();
    alert('🎉 Product Store par successfully add ho gaya hai!');
}

// Render Admin Data Lists
function renderAdminPanels() {
    const select = document.getElementById('p-category');
    if (select) {
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const catList = document.getElementById('categories-manage-list');
    if (catList) {
        catList.innerHTML = categories.map((c, i) => `
            <div class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span class="text-slate-300 font-medium">${c}</span>
                <button class="bg-rose-900/50 text-rose-300 px-2 py-1 rounded text-[10px]" onclick="deleteCategory(${i})">Delete</button>
            </div>
        `).join('');
    }

    const prodList = document.getElementById('admin-products-list');
    if (prodList) {
        prodList.innerHTML = products.map((p, i) => `
            <div class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span class="text-slate-300 truncate max-w-[200px]"><b>[${p.category}]</b> ${p.title}</span>
                <button class="bg-rose-900/50 text-rose-300 px-2 py-1 rounded text-[10px]" onclick="deleteProduct(${i})">Delete</button>
            </div>
        `).join('');
    }
}

function addCategory() {
    const input = document.getElementById('new-cat-name');
    if (!input) return;
    const name = input.value.trim();
    if (name && !categories.includes(name)) {
        categories.push(name);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        input.value = '';
        renderCategoriesBar();
        renderAdminPanels();
    }
}

function deleteCategory(index) {
    if (confirm('Category delete karein?')) {
        categories.splice(index, 1);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderCategoriesBar();
        renderAdminPanels();
    }
}

function deleteProduct(index) {
    if (confirm('Product delete karein?')) {
        products.splice(index, 1);
        localStorage.setItem('myProducts', JSON.stringify(products));
        displayProducts(products);
        renderAdminPanels();
    }
}

function resetStorage() {
    if (confirm('Kya aap tamam store data clear karna chahte hain?')) {
        localStorage.clear();
        alert('Storage Cleared!');
        location.reload();
    }
}
