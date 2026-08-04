// Add at top - IMGBB API Key (Get from https://api.imgbb.com/)
const IMGBB_API_KEY = '311cba478ef03480a9e99f45226dc6ac'; // Replace with your key

// Modified addProduct with IMBB upload
async function addProduct() {
    const title = document.getElementById('p-title').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const category = document.getElementById('p-category').value;
    const fileInput = document.getElementById('p-img-file');
    const urlInput = document.getElementById('p-img1');

    if (!title || !price) {
        alert('Product Title and Price are required!');
        return;
    }

    let imageSrc = '';

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
                alert('Image upload failed. Please try again or use URL.');
                return;
            }
        } catch (e) {
            alert('Image upload error. Please check your connection.');
            return;
        }
    } else if (urlInput && urlInput.value.trim()) {
        imageSrc = urlInput.value.trim();
    }

    if (!imageSrc) {
        alert('Please upload an image or enter a URL.');
        return;
    }

    products.push({ title, price, category, images: [imageSrc] });
    
    try {
        localStorage.setItem('myProducts', JSON.stringify(products));
    } catch (e) {
        alert('Storage full! Delete some old products.');
        products.pop();
        return;
    }

    // Clear form
    document.getElementById('p-title').value = '';
    document.getElementById('p-price').value = '';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';

    displayProducts(products);
    renderAdminPanels();
    alert('Product added successfully! ✅');
}

// Modified submitOrder with Nodemailer API
async function submitOrder() {
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const item = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!name || !phone || !address || !item) {
        alert('Please fill all fields (Name, Phone, Address)!');
        return;
    }

    const submitBtn = document.querySelector('.btn-whatsapp');
    if (submitBtn) {
        submitBtn.innerText = "Processing Order...";
        submitBtn.disabled = true;
    }

    try {
        // Send to Nodemailer API endpoint
        const response = await fetch('/api/send-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
            // Increment order count
            let orders = parseInt(localStorage.getItem('orderCount') || 0);
            localStorage.setItem('orderCount', orders + 1);
            
            // Show success
            document.getElementById('checkout-form-box').style.display = 'none';
            document.getElementById('success-box').style.display = 'block';
        } else {
            alert('Order failed. Please try again.');
            if (submitBtn) {
                submitBtn.innerText = "✅ Confirm Order";
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        alert('Network error. Please check your internet connection.');
        if (submitBtn) {
            submitBtn.innerText = "✅ Confirm Order";
            submitBtn.disabled = false;
        }
    }
}