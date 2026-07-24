// ================= VERCEL SERVERLESS FUNCTION: /api/cj-product.js ================= //

export default async function handler(req, res) {
    const { sku } = req.query;

    if (!sku) {
        return res.status(400).json({ success: false, message: "SKU code zaroori hai!" });
    }

    const cleanSku = sku.trim();
    const CJ_TOKEN = process.env.CJ_API_TOKEN || process.env.CJ_API_KEY;

    if (!CJ_TOKEN) {
        return res.status(500).json({ 
            success: false, 
            message: "CJ_API_TOKEN / CJ_API_KEY Vercel Environment Variables mein missing hai!" 
        });
    }

    try {
        // 1. Fetch from CJ API
        let cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(cleanSku)}`, {
            headers: { 'CJ-Access-Token': CJ_TOKEN }
        });
        
        let cjData = await cjRes.json();

        // Check if CJ returned a specific API error (e.g. Token Expired / Unauthorized)
        if (cjData.code && cjData.code !== 200 && !cjData.result) {
            return res.status(400).json({
                success: false,
                message: `CJ API Response Error (${cjData.code}): ${cjData.message || 'Token Expired ya Invalid Request'}`
            });
        }

        // 2. Try PID search if SKU query was empty
        if (!cjData.data) {
            cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${encodeURIComponent(cleanSku)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            cjData = await cjRes.json();
        }

        // 3. Try Auto-Trimming Variant suffix (e.g. CJYD275940804DW -> CJYD2759408)
        if (!cjData.data && cleanSku.length > 8) {
            const trimmedSku = cleanSku.substring(0, cleanSku.length - 4);
            cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(trimmedSku)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            cjData = await cjRes.json();
        }

        if (!cjData || !cjData.data) {
            return res.status(404).json({ 
                success: false, 
                message: `CJ par Code (${cleanSku}) nahi mila! Code sahi hai to CJ Access Token check karein.` 
            });
        }

        const p = cjData.data;
        const USD_TO_PKR = 280;
        const basePriceUSD = parseFloat(p.sellPrice || 0);
        const basePricePKR = Math.round(basePriceUSD * USD_TO_PKR);

        let images = [];
        if (p.productImageSet && Array.isArray(p.productImageSet)) {
            images = p.productImageSet;
        } else if (p.productImage) {
            images = [p.productImage];
        }

        return res.status(200).json({
            success: true,
            data: {
                sku: p.productSku || cleanSku,
                pid: p.pid || "",
                title: p.productNameEn || p.productName || "CJ Product",
                categoryName: p.categoryName || "",
                basePriceUSD: basePriceUSD,
                basePricePKR: basePricePKR,
                shippingCostPKR: 500,
                images: images,
                variants: (p.variants || []).map(v => ({
                    vid: v.vid,
                    color: v.variantKey || v.variantStandard || "",
                    size: v.variantSize || "",
                    sku: v.variantSku,
                    priceUSD: v.variantSellPrice
                }))
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "CJ Server connection error!" });
    }
}
