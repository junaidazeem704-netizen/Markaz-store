// ================= VERCEL SERVERLESS FUNCTION: /api/cj-product.js ================= //

module.exports = async function handler(req, res) {
    const { sku } = req.query;

    if (!sku) {
        return res.status(400).json({ success: false, message: "SKU code zaroori hai!" });
    }

    const cleanSku = sku.trim();
    const CJ_KEY_OR_TOKEN = process.env.CJ_API_TOKEN || process.env.CJ_API_KEY;

    if (!CJ_KEY_OR_TOKEN) {
        return res.status(500).json({ 
            success: false, 
            message: "CJ_API_KEY / CJ_API_TOKEN Vercel Environment Variables mein missing hai!" 
        });
    }

    try {
        let accessToken = CJ_KEY_OR_TOKEN;

        // Step 1: Query CJ API
        let cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(cleanSku)}`, {
            headers: { 'CJ-Access-Token': accessToken }
        });

        let cjData = await cjRes.json();

        // Step 2: Auto-refresh token if invalid
        if (cjData.code === 1600001 || (cjData.message && cjData.message.includes("Invalid API key"))) {
            const authRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: CJ_KEY_OR_TOKEN })
            });

            const authData = await authRes.json();

            if (authData.result && authData.data && authData.data.accessToken) {
                accessToken = authData.data.accessToken;

                cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(cleanSku)}`, {
                    headers: { 'CJ-Access-Token': accessToken }
                });
                cjData = await cjRes.json();
            } else {
                return res.status(401).json({
                    success: false,
                    message: `CJ Token Auth Failed: Fresh Access Token copy karke Vercel mein paste karein.`
                });
            }
        }

        // Step 3: Trim Variant Suffix if direct fetch failed
        if (!cjData.data && cleanSku.length > 8) {
            const trimmedSku = cleanSku.substring(0, cleanSku.length - 4);
            cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(trimmedSku)}`, {
                headers: { 'CJ-Access-Token': accessToken }
            });
            cjData = await cjRes.json();
        }

        if (!cjData || !cjData.data) {
            return res.status(404).json({ 
                success: false, 
                message: `CJ Product (${cleanSku}) nahi mila!` 
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
        console.error("CJ API Error:", error);
        return res.status(500).json({ success: false, message: "CJ Server Connection Error!" });
    }
};
