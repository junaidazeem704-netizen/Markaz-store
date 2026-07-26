// ================= VERCEL SERVERLESS FUNCTION: /api/cj-product.js ================= //

module.exports = async function handler(req, res) {
    const { sku } = req.query;

    if (!sku) {
        return res.status(400).json({ success: false, message: "SKU code zaroori hai!" });
    }

    const cleanSku = sku.trim();
    const CJ_KEY = process.env.CJ_API_KEY || process.env.CJ_API_TOKEN;

    if (!CJ_KEY) {
        return res.status(500).json({ 
            success: false, 
            message: "CJ_API_KEY Vercel Environment Variables mein missing hai!" 
        });
    }

    try {
        let accessToken = CJ_KEY;

        // Helper function to fetch product from CJ
        async function fetchFromCj(token, skuCode) {
            const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(skuCode)}`, {
                headers: { 'CJ-Access-Token': token }
            });
            return await r.json();
        }

        // 1. First Attempt using existing token/key
        let cjData = await fetchFromCj(accessToken, cleanSku);

        // 2. If token is invalid/expired (Error 1600001), auto-generate fresh Access Token using API Key
        if (cjData.code === 1600001 || (cjData.message && cjData.message.toLowerCase().includes("invalid"))) {
            const authRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: CJ_KEY })
            });

            const authData = await authRes.json();

            if (authData.result && authData.data && authData.data.accessToken) {
                accessToken = authData.data.accessToken;
                // Retry product fetch with fresh Access Token
                cjData = await fetchFromCj(accessToken, cleanSku);
            } else {
                return res.status(401).json({
                    success: false,
                    message: `CJ Auth Error: Vercel mein CJ_API_KEY check karein. (${authData.message || 'Invalid API Key'})`
                });
            }
        }

        // 3. Fallback: Trim variant suffix (e.g., CJAM130816105EV -> CJAM130816) if direct search yields no data
        if ((!cjData.data || !cjData.result) && cleanSku.length > 8) {
            const trimmedSku = cleanSku.substring(0, cleanSku.length - 4);
            cjData = await fetchFromCj(accessToken, trimmedSku);
        }

        if (!cjData || !cjData.data) {
            return res.status(404).json({ 
                success: false, 
                message: `CJ Product (${cleanSku}) nahi mila! SKU Code verify karein.` 
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
