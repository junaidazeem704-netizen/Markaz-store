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
        let cjData = null;

        // 1. First Attempt: Query by Product SKU or PID
        let cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${encodeURIComponent(cleanSku)}`, {
            headers: { 'CJ-Access-Token': CJ_TOKEN }
        });
        cjData = await cjRes.json();

        // 2. Second Attempt: Query as Variant SKU (Auto-detect PID from Variant)
        if (!cjData || !cjData.result || !cjData.data) {
            const variantRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/variant/query?variantSku=${encodeURIComponent(cleanSku)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            const variantData = await variantRes.json();

            if (variantData.result && variantData.data && (variantData.data.pid || variantData.data.productSku)) {
                const targetPid = variantData.data.pid || variantData.data.productSku;
                cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${targetPid}`, {
                    headers: { 'CJ-Access-Token': CJ_TOKEN }
                });
                cjData = await cjRes.json();
            }
        }

        // 3. Third Attempt: Search via Product List API
        if (!cjData || !cjData.result || !cjData.data) {
            const listRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productSku=${encodeURIComponent(cleanSku)}`, {
                headers: { 'CJ-Access-Token': CJ_TOKEN }
            });
            const listData = await listRes.json();

            if (listData.result && listData.data && listData.data.list && listData.data.list.length > 0) {
                const foundPid = listData.data.list[0].pid;
                cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${foundPid}`, {
                    headers: { 'CJ-Access-Token': CJ_TOKEN }
                });
                cjData = await cjRes.json();
            }
        }

        // Check final response validity
        if (!cjData || !cjData.result || !cjData.data) {
            return res.status(404).json({ 
                success: false, 
                message: `CJ API par Code (${cleanSku}) nahi mila! Baraye meharbani CJ website se Main Product SKU ya PID copy karein.` 
            });
        }

        const p = cjData.data;

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

        // Structure clean data for frontend
        const formattedData = {
            sku: p.productSku || cleanSku,
            pid: p.pid || "",
            title: p.productNameEn || p.productName || "CJ Product",
            categoryName: p.categoryName || "",
            basePriceUSD: basePriceUSD,
            basePricePKR: basePricePKR,
            shippingCostPKR: 500, // Fixed estimated shipping buffer
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
