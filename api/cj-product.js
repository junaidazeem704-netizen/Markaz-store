// Vercel Serverless Function: Multi-Image & Auto-Category CJ Fetcher
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const sku = (req.query.sku || '').trim();

    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU / PID Code zaroori hai!' });
    }

    const cjApiKey = process.env.CJ_API_KEY;

    if (!cjApiKey) {
        return res.status(400).json({
            success: false,
            message: 'Vercel Environment Variables me CJ_API_KEY set nahi hai!'
        });
    }

    try {
        // 1. Get Access Token
        const tokenRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: cjApiKey })
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.result || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(400).json({
                success: false,
                message: `CJ Auth Error: ${tokenData.message || 'Invalid API Key'}`
            });
        }

        const token = tokenData.data.accessToken;
        const headers = { 'CJ-Access-Token': token };

        let productData = null;

        // 2. Query Details
        let queryRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${encodeURIComponent(sku)}`, { headers });
        let queryJson = await queryRes.json();

        if (queryJson.result && queryJson.data) {
            productData = queryJson.data;
        } else {
            queryRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(sku)}`, { headers });
            queryJson = await queryRes.json();
            if (queryJson.result && queryJson.data) {
                productData = queryJson.data;
            }
        }

        // 3. Fallback Search via List API
        if (!productData) {
            let listRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productSku=${encodeURIComponent(sku)}`, { headers });
            let listJson = await listRes.json();

            let targetPid = null;

            if (listJson.result && listJson.data && listJson.data.list && listJson.data.list.length > 0) {
                targetPid = listJson.data.list[0].pid;
            } else {
                listRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?key=${encodeURIComponent(sku)}`, { headers });
                listJson = await listRes.json();
                if (listJson.result && listJson.data && listJson.data.list && listJson.data.list.length > 0) {
                    targetPid = listJson.data.list[0].pid;
                }
            }

            if (targetPid) {
                queryRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${encodeURIComponent(targetPid)}`, { headers });
                queryJson = await queryRes.json();
                if (queryJson.result && queryJson.data) {
                    productData = queryJson.data;
                }
            }
        }

        if (!productData) {
            return res.status(404).json({
                success: false,
                message: `CJ API par Code (${sku}) nahi mila!`
            });
        }

        // Category Name
        const categoryName = productData.categoryName || productData.categoryFirst || productData.categorySecond || "CJ Imports";

        // Title & Price Calculation
        const title = productData.productNameEn || productData.productName || `CJ Product (${sku})`;
        const pkrRate = 280;
        let usdPrice = parseFloat(productData.sellPrice || productData.productPrice || 0);
        let basePricePKR = Math.round(usdPrice * pkrRate);
        let shippingCostPKR = Math.round(5 * pkrRate);

        // Extract Multiple Images
        let imagesList = [];

        if (productData.productImageSet) {
            if (Array.isArray(productData.productImageSet)) {
                imagesList = imagesList.concat(productData.productImageSet);
            } else if (typeof productData.productImageSet === 'string') {
                try { imagesList = imagesList.concat(JSON.parse(productData.productImageSet)); }
                catch(e) { imagesList = imagesList.concat(productData.productImageSet.split(',')); }
            }
        }

        if (productData.productImage) {
            const extra = productData.productImage.includes(',') 
                ? productData.productImage.split(',') 
                : [productData.productImage];
            imagesList = imagesList.concat(extra);
        }

        // Add Variant Images
        if (productData.variants && Array.isArray(productData.variants)) {
            productData.variants.forEach(v => {
                if (v.variantImage) imagesList.push(v.variantImage);
            });
        }

        // Unique Clean Images List
        let images = [...new Set(imagesList.map(img => (typeof img === 'string' ? img.trim() : '')).filter(Boolean))];

        if (images.length === 0) {
            images = ["https://via.placeholder.com/400?text=No+CJ+Image"];
        }

        // Variants
        let variants = [];
        if (productData.variants && Array.isArray(productData.variants)) {
            variants = productData.variants.map(v => ({
                vid: v.vid,
                sku: v.variantSku,
                color: v.variantKey || v.variantColor || "Standard",
                size: v.variantSize || "",
                price: v.variantSellPrice,
                image: v.variantImage || ""
            }));
        }

        return res.status(200).json({
            success: true,
            data: {
                sku: productData.productSku || sku,
                title: title,
                categoryName: categoryName,
                basePricePKR: basePricePKR,
                shippingCostPKR: shippingCostPKR,
                images: images,
                variants: variants,
                source: "CJ"
            }
        });

    } catch (err) {
        console.error("CJ API Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
