// ================= MARKAZ STORE COMPLETE & FIXED SCRIPT ================= //

// 1. Initial Default Datasets
const defaultCategories = ["Watches", "Clothing", "Electronics"];

const defaultProducts = [
    {
        title: "Trending Smart Watch",
        price: "2500",
        category: "Watches",
        images: ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"]
    }
];

// Memory Data State via LocalStorage
let categories = JSON.parse(localStorage.getItem('myCategories')) || defaultCategories;
let products = JSON.parse(localStorage.getItem('myProducts')) || defaultProducts;
let currentFilterProducts = [...products];

// API Keys Configuration
const IMGBB_API_KEY = "311cba478ef03480a9e99f45226dc6ac";
const WEB3FORMS_KEY = "09271853-97ee-4438-8b51-9fad973e26dd";

// Modal Admin Handler
function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) renderAdminPanels();
}

// Global Image Change (Thumbnails)
function changeImage(idx, src) {
    const el = document.getElementById(`img-${idx}`);
    if (el) el.src = src;
}

// 2. Initialize Page Content & Listeners
window.addEventListener('DOMContentLoaded', () => {
    renderCategoriesBar();
    displayProducts(products);

    // Sync Checkout Page Details
    const titleEl = document.getElementById('checkout-product-title');
    if (titleEl) {
        const item = JSON.parse(localStorage.getItem('checkoutItem'));
        if (item) {
            titleEl.innerText = item.title;
            const priceEl = document.getElementById('checkout-product-price');
            if (priceEl) priceEl.innerText = `Rs. ${item.price}`;
        }
    }
});

// Render Category Filter Buttons
function renderCategoriesBar() {
    const catBar = document.getElementById('category-bar');
    if (!catBar) return;

    let html = `<button class="cat-btn active" onclick="filterCategory('All', this)">All</button>`;
    categories.forEach(cat => {
        html += `<button class="cat-btn" onclick="filterCategory('${cat}', this)">${cat}</button>`;
    });
    catBar.innerHTML = html;
}

// Display Products in Main Grid
function displayProducts(list) {
    const container = document.getElementById('products-container');
    if (!container) return;

    currentFilterProducts = list;

    if (!list.length) {
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#9ca3af;">No products found.</p>`;
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

// Filter Categories
function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (cat === 'All') displayProducts(products);
    else displayProducts(products.filter(p => p.category === cat));
}

// Navigate to Checkout Page
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

// Order Submission Handler
async function submitOrder() {
    const nameEl = document.getElementById('c-name');
    const phoneEl = document.getElementById('c-phone');
    const addressEl = document.getElementById('c-address');
    
    if (!nameEl || !phoneEl || !addressEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const address = addressEl.value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !phone || !address || !item) {
        alert('Baraye meharbani apni tamam details (Name, Phone, Address) bharein!');
        return;
    }

    const submitBtn = document.querySelector('.btn-whatsapp');
    if (submitBtn) {
        submitBtn.innerText = "Processing Order...";
        submitBtn.disabled = true;
    }

    const formData = {
        access_key: WEB3FORMS_KEY,
        subject: `🛍️ New Order: ${item.title} - Rs. ${item.price}`,
        from_name: "Markaz Store Engine",
        "Product Title": item.title,
        "Product Price": `PKR ${item.price}`,
        "Customer Name": name,
        "Customer Phone": phone,
        "Delivery Address": address
    };

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            const formBox = document.getElementById('checkout-form-box');
            const successBox = document.getElementById('success-box');
            if (formBox) formBox.style.display = 'none';
            if (successBox) successBox.style.display = 'block';
        } else {
            alert("Order process karne mein masla hua. Dubara try karein.");
            if (submitBtn) {
                submitBtn.innerText = "✅ Confirm Order";
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("Network error. Internet connection check karein.");
        if (submitBtn) {
            submitBtn.innerText = "✅ Confirm Order";
            submitBtn.disabled = false;
        }
    }
}

// 3. Image Compression & ImgBB Cloud Helpers

// Canvas Blob Compressor for ImgBB
function compressImageToBlob(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                canvas.width = (img.width > maxWidth) ? maxWidth : img.width;
                canvas.height = (img.width > maxWidth) ? (img.height * scale) : img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas compression failed"));
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Canvas Base64 Compressor for Backup
function compressImageToBase64(file, maxWidth = 500, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                canvas.width = (img.width > maxWidth) ? maxWidth : img.width;
                canvas.height = (img.width > maxWidth) ? (img.height * scale) : img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// High Speed ImgBB Upload Function
async function uploadToImgBB(file) {
    try {
        // Pehle mobile image ko compress karke lightweight JPEG Blob banayein (100KB-200KB)
        const compressedBlob = await compressImageToBlob(file, 800, 0.7);

        const formData = new FormData();
        formData.append("image", compressedBlob, "product.jpg");

        // ImgBB Direct Endpoint
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result && result.success && result.data && result.data.url) {
            return result.data.url; // Hosted Image URL
        } else {
            throw new Error(result.error ? result.error.message : "ImgBB response invalid");
        }
    } catch (err) {
        console.warn("ImgBB upload failed, falling back to local compressed image:", err);
        // Fallback: Agar ImgBB block ho, to compressed image direct save ho jaye
        return await compressImageToBase64(file, 500, 0.6);
    }
}

// 4. Admin Panel Logic & Add Product
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
    if (confirm('Is category ko delete karein?')) {
        categories.splice(index, 1);
        localStorage.setItem('myCategories', JSON.stringify(categories));
        renderCategoriesBar();
        renderAdminPanels();
    }
}

// Robust Add Product Function
async function addProduct() {
    const titleEl = document.getElementById('p-title');
    const priceEl = document.getElementById('p-price');
    const catEl = document.getElementById('p-category');
    const fileInput = document.getElementById('p-img-file');
    const urlInput = document.getElementById('p-img1');

    if (!titleEl || !priceEl) {
        alert("Form inputs nahi mile. Page reload karein.");
        return;
    }

    const title = titleEl.value.trim();
    const price = priceEl.value.trim();
    const category = catEl ? catEl.value : 'General';

    if (!title || !price) {
        alert('Product Title aur Price zaroori hain!');
        return;
    }

    const submitBtn = document.querySelector('.modal-content .btn-primary') || document.querySelector('button[onclick="addProduct()"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : "Add Product";

    let imageSrc = '';

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            if (submitBtn) {
                submitBtn.innerText = "⏳ Uploading Image...";
                submitBtn.disabled = true;
            }

            // Direct ImgBB Cloud Upload with Fallback
            imageSrc = await uploadToImgBB(fileInput.files[0]);

        } catch (e) {
            alert('Photo upload karne mein masla hua: ' + e);
            if (submitBtn) {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
            return;
        }
    } else if (urlInput && urlInput.value.trim()) {
        imageSrc = urlInput.value.trim();
    }

    if (!imageSrc) {
        alert('Photo select karein ya direct URL enter karein!');
        if (submitBtn) {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
        return;
    }

    // Save product
    products.push({ title, price, category, images: [imageSrc] });

    try {
        localStorage.setItem('myProducts', JSON.stringify(products));
    } catch (e) {
        alert('Storage error: Pehle se kaafi data save ho chuka hai.');
    }

    // Form Reset
    titleEl.value = '';
    priceEl.value = '';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';

    if (submitBtn) {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }

    displayProducts(products);
    renderAdminPanels();
    alert('🎉 Product Store par successfully add ho gaya hai!');
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
    if (confirm('Kya aap tamam storage clear karna chahte hain?')) {
        localStorage.clear();
        alert('Storage Cleared!');
        location.reload();
    }
}
