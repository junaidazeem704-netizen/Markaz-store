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

    // Helper Function to Query CJ API
    async function queryCj(productSkuOrPid) {
        try {
            // Try by productSku
            let r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(productSkuOrPid)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            let d = await r.json();
            if (d && d.result && d.data) return d.data;

            // Try by pid
            r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${encodeURIComponent(productSkuOrPid)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            d = await r.json();
            if (d && d.result && d.data) return d.data;

            // Try via list API
            r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productSku=${encodeURIComponent(productSkuOrPid)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            d = await r.json();
            if (d && d.result && d.data && d.data.list && d.data.list.length > 0) {
                const pid = d.data.list[0].pid;
                r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`, {
                    headers: { 'CJ-Access-Token': CJ_TOKEN }
                });
                const fullData = await r.json();
                if (fullData && fullData.result && fullData.data) return fullData.data;
            }
        } catch (e) {
            console.error("Attempt failed for:", productSkuOrPid);
        }
        return null;
    }

    try {
        let p = null;

        // 1. Attempt with EXACT input SKU
        p = await queryCj(cleanSku);

        // 2. Fallback: Auto-Strip Variant Suffix (e.g. CJYD275940804DW -> CJYD2759408)
        if (!p && cleanSku.length > 10) {
            const strippedSku4 = cleanSku.substring(0, cleanSku.length - 4); // Trim 4 chars (04DW)
            p = await queryCj(strippedSku4);
        }

        if (!p && cleanSku.length > 8) {
            const strippedSku2 = cleanSku.substring(0, cleanSku.length - 2); // Trim 2 chars
            p = await queryCj(strippedSku2);
        }

        if (!p) {
            return res.status(404).json({ 
                success: false, 
                message: `CJ API par Code (${cleanSku}) nahi mila! Baraye meharbani CJ website se Main Product SKU ya PID check karein.` 
            });
        }

        // USD to PKR Conversion (Approx 280 PKR / 1 USD)
        const USD_TO_PKR = 280;
        const basePriceUSD = parseFloat(p.sellPrice || 0);
        const basePricePKR = Math.round(basePriceUSD * USD_TO_PKR);

        // Collect all high-res product images
        let images = [];
        if (p.productImageSet && Array.isArray(p.productImageSet)) {
            images = p.productImageSet;
        } else if (p.productImage) {
            images = [p.productImage];
        }

        // Format final response
        const formattedData = {
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
        };

        return res.status(200).json({ success: true, data: formattedData });

    } catch (error) {
        console.error("CJ API Backend Error:", error);
        return res.status(500).json({ success: false, message: "CJ Server se connect hone mein masla aa raha hai." });
    }
}
