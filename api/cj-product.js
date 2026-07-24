// Vercel Serverless Function: Official CJ Dropshipping API v2 Endpoint
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
        // 1. Get Access Token (CJ API V2 Docs)
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

        // 2. Try Direct Query by PID or productSku
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

        // 3. Fallback: Search via Product List API if Direct Query fails
        if (!productData) {
            let listRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productSku=${encodeURIComponent(sku)}`, { headers });
            let listJson = await listRes.json();

            let targetPid = null;

            if (listJson.result && listJson.data && listJson.data.list && listJson.data.list.length > 0) {
                targetPid = listJson.data.list[0].pid;
            } else {
                // Keyword Search Fallback
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
                message: `CJ API par Code (${sku}) nahi mila! Kripya SKU / PID verify karein.`
            });
        }

        // Extract Title & Conversion USD to PKR (Rate: 280)
        const title = productData.productNameEn || productData.productName || `CJ Product (${sku})`;
        const pkrRate = 280;
        let usdPrice = parseFloat(productData.sellPrice || productData.productPrice || 0);
        let basePricePKR = Math.round(usdPrice * pkrRate);
        let shippingCostPKR = Math.round(5 * pkrRate); // Standard ~5 USD Shipping Estimate

        // Extract Product Images
        let images = [];
        if (productData.productImageSet) {
            if (Array.isArray(productData.productImageSet)) {
                images = productData.productImageSet;
            } else if (typeof productData.productImageSet === 'string') {
                try { images = JSON.parse(productData.productImageSet); }
                catch(e) { images = productData.productImageSet.split(','); }
            }
        }

        if ((!images || images.length === 0) && productData.productImage) {
            images = productData.productImage.includes(',')
                ? productData.productImage.split(',')
                : [productData.productImage];
        }

        images = images.map(img => (typeof img === 'string' ? img.trim() : '')).filter(Boolean);

        if (images.length === 0) {
            images = ["https://via.placeholder.com/400?text=No+CJ+Image"];
        }

        // Extract Variants
        let variants = [];
        if (productData.variants && Array.isArray(productData.variants)) {
            variants = productData.variants.map(v => ({
                vid: v.vid,
                sku: v.variantSku,
                color: v.variantKey || v.variantColor || "Standard",
                size: v.variantSize || "",
                price: v.variantSellPrice
            }));
        }

        return res.status(200).json({
            success: true,
            data: {
                sku: productData.productSku || sku,
                title: title,
                basePricePKR: basePricePKR,
                shippingCostPKR: shippingCostPKR,
                images: images,
                variants: variants,
                source: "CJ"
            }
        });

    } catch (err) {
        console.error("CJ API Execution Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

