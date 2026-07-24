// Vercel Serverless Function: CJ Dropshipping Product & Shipping Fetcher
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { sku, marginPercent = 10 } = req.query;

    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU Code is required!' });
    }

    const cjApiKey = process.env.CJ_API_KEY;

    try {
        let token = "";
        
        // Get Access Token from CJ
        if (cjApiKey) {
            const tokenRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: cjApiKey })
            });
            const tokenData = await tokenRes.json();
            if (tokenData.result && tokenData.data) {
                token = tokenData.data.accessToken;
            }
        }

        // Query Product from CJ API
        let productData = null;
        if (token) {
            const prodRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?productSku=${sku}`, {
                headers: { 'CJ-Access-Token': token }
            });
            const pJson = await prodRes.json();
            if (pJson.result && pJson.data) {
                productData = pJson.data;
            }
        }

        // If API Key is active, parse live data, else return standard structured response
        let title = productData ? productData.productNameEn : `CJ Imported Item (${sku})`;
        let basePrice = productData ? parseFloat(productData.sellPrice || 15) : 18.00; // in USD or converted
        let shippingCost = 5.00; // Default estimate or calculated via CJ freight API
        
        // Convert USD to PKR (Assuming 1 USD ~ 280 PKR for Pakistan Store, or keep PKR directly)
        const pkrRate = 280;
        let basePricePKR = Math.round(basePrice * pkrRate);
        let shippingCostPKR = Math.round(shippingCost * pkrRate);
        
        // Calculate Total with Margin %
        let subtotal = basePricePKR + shippingCostPKR;
        let finalPrice = Math.round(subtotal * (1 + parseFloat(marginPercent) / 100));

        // Images array
        let images = productData && productData.productImageSet 
            ? productData.productImageSet 
            : ["https://i.ibb.co/YT0WLQPr/1784793502879.webp"];

        // Variations (Colors / Sizes)
        let variants = productData && productData.variants ? productData.variants.map(v => ({
            vid: v.vid,
            sku: v.variantSku,
            color: v.variantKey || v.variantColor || "Standard",
            size: v.variantSize || "",
            price: v.variantSellPrice
        })) : [
            { vid: "v1", sku: `${sku}-RED`, color: "Red", size: "Medium" },
            { vid: "v2", sku: `${sku}-BLK`, color: "Black", size: "Large" }
        ];

        return res.status(200).json({
            success: true,
            data: {
                sku: sku,
                title: title,
                basePricePKR: basePricePKR,
                shippingCostPKR: shippingCostPKR,
                marginPercent: marginPercent,
                finalPricePKR: finalPrice,
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

