// Vercel Serverless Function: Smart CJ Dropshipping Product & Image Fetcher
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { sku } = req.query;

    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU / PID Code zaroori hai!' });
    }

    const cjApiKey = process.env.CJ_API_KEY;

    if (!cjApiKey) {
        return res.status(400).json({
            success: false,
            message: 'Vercel Environment Variables me CJ_API_KEY nahi mili! Pehle Vercel me API Key add karein.'
        });
    }

    try {
        // 1. Get Access Token from CJ Dropshipping
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

        // 2. Fetch Details: Pehle SKU se search karein
        let prodRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(sku)}`, {
            headers: { 'CJ-Access-Token': token }
        });
        let pJson = await prodRes.json();

        // 3. Fallback: Agar SKU se na miley, toh PID se search karein
        if (!pJson.result || !pJson.data) {
            prodRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${encodeURIComponent(sku)}`, {
                headers: { 'CJ-Access-Token': token }
            });
            pJson = await prodRes.json();
        }

        if (!pJson.result || !pJson.data) {
            return res.status(404).json({
                success: false,
                message: `CJ par Yeh Code (${sku}) nahi mila! Sahi SKU/PID copy karein.`
            });
        }

        const productData = pJson.data;

        // Product Title
        const title = productData.productNameEn || productData.productName || `CJ Product (${sku})`;
        
        // Price Calculation (USD to PKR @ 280)
        const pkrRate = 280;
        let basePriceUSD = parseFloat(productData.sellPrice || productData.productPrice || 0);
        let basePricePKR = Math.round(basePriceUSD * pkrRate);
        let shippingCostPKR = Math.round(5 * pkrRate); // ~5 USD shipping estimate

        // Extract Real Images from CJ
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

        images = images.map(img => img ? img.trim() : '').filter(Boolean);

        if (images.length === 0) {
            images = ["https://via.placeholder.com/400?text=No+CJ+Image+Found"];
        }

        // Variants (Color & Size)
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

    } catch (error) {
        console.error("CJ Fetch Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
