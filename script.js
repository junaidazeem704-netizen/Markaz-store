// Default Datasets
const defaultCategories = ["Watches", "Clothing", "Electronics"];

const defaultProducts = [
    {
        title: "Trending Smart Watch",
        price: "2500",
        category: "Watches",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"]
    }
];

// Memory Data State
let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

// Horizontal Slider Scroll Function
function scrollSlider(distance) {
    const container = document.getElementById('products-container');
    if (container) {
        container.scrollBy({ left: distance, behavior: 'smooth' });
    }
}

// Global Image Change
function changeImage(idx, src) {
    const el = document.getElementById(`img-${idx}`);
    if (el) el.src = src;
}

// Render Products & Categories
window.addEventListener('DOMContentLoaded', () => {
    renderCategoriesBar();
    displayProducts(products);
});

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
        container.innerHTML = `<p style="width:100%;text-align:center;color:#9ca3af;padding:40px 0;">No products found in this category.</p>`;
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
                <span class="badge-tag">${p.category || 'General'}</span>
                <span class="sale-badge">SALE</span>
                <div class="image-wrapper">
                    <img id="img-${i}" src="${imgs[0]}" class="p-img" loading="lazy" alt="Product">
                </div>
                ${thumbs}
                <div class="card-content">
                    <div class="rating-stars">★★★★★ <span class="review-count">(24)</span></div>
                    <h3>${p.title}</h3>
                    <div class="price-row">
                        <span class="price">Rs. ${p.price}</span>
                        <span class="old-price">Rs. ${Math.round(p.price * 1.25)}</span>
                    </div>
                    <button class="wa-btn" onclick="goToCheckout(${i})">🛍️ Order Now</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = cards;
}

// Direct Checkout Navigation
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

function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

// Checkout Page Handler
window.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('checkout-product-title');
    if (!titleEl) return;

    const item = JSON.parse(localStorage.getItem('checkoutItem'));
    if (item) {
        titleEl.innerText = item.title;
        document.getElementById('checkout-product-price').innerText = `Rs. ${item.price}`;
    }
});

// Fixed Order Submission Handler
async function submitOrder() {
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !phone || !address || !item) {
        alert('Baraye meharbani apni tamam details bharein!');
        return;
    }

    const submitBtn = document.querySelector('.btn-whatsapp');
    if (submitBtn) {
        submitBtn.innerText = "Processing Order...";
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch("/api/send-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: item.title,
                price: item.price,
                name: name,
                phone: phone,
                address: address
            })
        });

        // Response Error Check
        if (!response.ok) {
            throw new Error(`Server returned HTTP status ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
        } else {
            alert("Order submission mein masla hua: " + (result.message || "Unknown Error"));
            if (submitBtn) {
                submitBtn.innerText = "✅ Confirm Order";
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("Network Error / API Server offline! Pehle check karein ke site Live Vercel URL par khuli hai.");
        console.error("Order error:", error);
        if (submitBtn) {
            submitBtn.innerText = "✅ Confirm Order";
            submitBtn.disabled = false;
        }
    }
}
