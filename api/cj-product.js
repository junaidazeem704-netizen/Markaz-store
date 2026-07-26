// ================= VERCEL SERVERLESS FUNCTION: /api/cj-product.js ================= //

export default async function handler(req, res) {
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

        // 1. Helper: CJ se fresh Access Token hasil karne ke liye
        async function getFreshAccessToken() {
            try {
                const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: CJ_KEY })
                });
                const data = await response.json();
                if (data.result && data.data && data.data.accessToken) {
                    return data.data.accessToken;
                }
            } catch (e) {
                console.error("Token Auth Error:", e);
            }
            return null;
        }

        // 2. Helper: Product query run karne ke liye
        async function fetchProduct(token, queryParam) {
            const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?${queryParam}`, {
                headers: { 'CJ-Access-Token': token }
            });
            return await response.json();
        }

        // Attempt 1: Direct Product SKU Query
        let cjData = await fetchProduct(accessToken, `productSku=${encodeURIComponent(cleanSku)}`);

        // If Token Expired / Invalid (Error Code 1600001), fetch fresh token automatically
        if (cjData.code === 1600001 || (cjData.message && cjData.message.toLowerCase().includes("invalid"))) {
            const freshToken = await getFreshAccessToken();
            if (freshToken) {
                accessToken = freshToken;
                cjData = await fetchProduct(accessToken, `productSku=${encodeURIComponent(cleanSku)}`);
            }
        }

        // Attempt 2: PID Query
        if (!cjData || !cjData.data) {
            cjData = await fetchProduct(accessToken, `pid=${encodeURIComponent(cleanSku)}`);
        }

        // Attempt 3: Variant Suffix Auto-Trim (e.g. CJAM130816105EV -> CJAM130816)
        if ((!cjData || !cjData.data) && cleanSku.length > 8) {
            const trimmedSku = cleanSku.substring(0, cleanSku.length - 5);
            cjData = await fetchProduct(accessToken, `productSku=${encodeURIComponent(trimmedSku)}`);
        }

        if (!cjData || !cjData.data) {
            return res.status(404).json({ 
                success: false, 
                message: `CJ Product (${cleanSku}) nahi mila! Baraye meharbani main SKU check karein.` 
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
}
