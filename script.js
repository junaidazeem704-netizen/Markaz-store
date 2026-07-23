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

// Global Image Change
function changeImage(idx, src) {
    const el = document.getElementById(`img-${idx}`);
    if (el) el.src = src;
}

// Render Products Grid & Categories Filter (index.html)
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
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#9ca3af;padding:40px 0;">No products found in this category.</p>`;
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
                <img id="img-${i}" src="${imgs[0]}" class="p-img" loading="lazy" alt="Product">
                ${thumbs}
                <h3>${p.title}</h3>
                <div class="price">Rs. ${p.price}</div>
                <button class="wa-btn" onclick="goToCheckout(${i})">Order Now</button>
            </div>
        `;
    });
    container.innerHTML = cards;
}

// Direct Safe Checkout Navigation
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

// Checkout Page Sync & Handler (checkout.html)
window.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('checkout-product-title');
    if (!titleEl) return;

    const item = JSON.parse(localStorage.getItem('checkoutItem'));
    if (item) {
        titleEl.innerText = item.title;
        document.getElementById('checkout-product-price').innerText = `Rs. ${item.price}`;
    }
});

// Vercel API Order Submission (Silent Email Sending)
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

        const result = await response.json();

        if (result.success) {
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
        } else {
            alert("Order submission mein masla hua. Wapas try karein.");
            if (submitBtn) {
                submitBtn.innerText = "✅ Confirm Order";
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("Network Error! Connectivity check karein.");
        if (submitBtn) {
            submitBtn.innerText = "✅ Confirm Order";
            submitBtn.disabled = false;
        }
    }
}

// ==========================================
// ADMIN DASHBOARD FUNCTIONS (admin.html Only)
// ==========================================

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
                <span><b>[${p.category}]</b> ${p.title} - Rs. ${p.price}</span>
                <button class="btn-delete" onclick="deleteProduct(${i})">Delete</button>
            </div>
        `).join('');
    }
}

// Add & Delete Category
function addCategory() {
    const input = document.getElementById('new-cat-name');
    if (!input) return;
    const name = input.value.trim();
    
    if (name && !categories.includes(name)) {
        categories.push(name);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        input.value = '';
        renderAdminPanels();
        alert('New category added!');
    }
}

function deleteCategory(index) {
    if (confirm('Is category ko delete karein?')) {
        categories.splice(index, 1);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderAdminPanels();
    }
}

// Image Resizer/Compressor (Prevents Storage Crash)
function processAndCompressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
}

// Add Product (Admin Only)
async function addProduct() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const category = document.getElementById('p-category').value;
    const fileInput = document.getElementById('p-img-file');
    const urlInput = document.getElementById('p-img1');

    let imageSrc = '';

    if (!title || !price) {
        alert('Product Title aur Price zaroori hain!');
        return;
    }

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            imageSrc = await processAndCompressImage(fileInput.files[0]);
        } catch (e) {
            alert('Image process karne mein masla hua. Dubara try karein.');
            return;
        }
    } else if (urlInput && urlInput.value.trim()) {
        imageSrc = urlInput.value.trim();
    }

    if (!imageSrc) {
        alert('Image upload karein ya URL enter karein!');
        return;
    }

    products.push({ title, price, category, images: [imageSrc] });
    
    try {
        localStorage.setItem('myProducts', JSON.stringify(products));
    } catch (e) {
        alert('Storage full ho chuki hai! Purane products delete karein.');
        products.pop();
        return;
    }

    document.getElementById('p-title').value = '';
    document.getElementById('p-price').value = '';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';

    renderAdminPanels();
    alert('Product successfully add ho gaya!');
}

function deleteProduct(index) {
    if (confirm('Is product ko delete karein?')) {
        products.splice(index, 1);
        localStorage.setItem('myProducts', JSON.stringify(products));
        renderAdminPanels();
    }
}

function resetStorage() {
    if (confirm('Kya aap saara data (Products & Categories) reset karna chahte hain?')) {
        localStorage.clear();
        alert('Storage Reset Complete!');
        location.reload();
    }
}
