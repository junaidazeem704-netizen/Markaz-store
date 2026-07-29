const fetch = require('node-fetch');

// Token ko cache karne ke liye variables (bar bar API call na karni pare)
let cachedToken = null;
let tokenExpiry = null;

// Function: CJ API Key se Access Token nikalne ke liye
async function getCJAccessToken(apiKey) {
    // Agar token pehle se majood hai aur expire nahi hua to wahi return karein
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: apiKey })
        });

        const result = await response.json();
        
        if (result.code === 200 && result.data && result.data.accessToken) {
            cachedToken = result.data.accessToken;
            // Token 7 din ke liye valid hota hai, hum safe side ke liye 6 din set karte hain
            tokenExpiry = Date.now() + 6 * 24 * 60 * 60 * 1000; 
            return cachedToken;
        } else {
            throw new Error(result.message || 'Token generation failed');
        }
    } catch (error) {
        console.error('CJ Token Error:', error);
        return null;
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { sku } = req.query;
    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU code is required' });
    }

    // 1. Vercel dashboard se aapki save ki hui API Key uthana
    // Check karein k Vercel mein aapne naam "CJ_API_KEY" hi rakha hai
    const apiKey = process.env.CJ_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel configuration error: CJ_API_KEY missing' });
    }

    // 2. Access Token lena
    const accessToken = await getCJAccessToken(apiKey);
    if (!accessToken) {
        return res.status(501).json({ success: false, message: 'CJ Server se temporary Access Token nahi ban saka' });
    }

    try {
        // 3. Product List V2 Endpoint se SKU check karna
        const cjResponse = await fetch(`https://cjdropshipping.com{sku}`, {
            method: 'GET',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        const result = await cjResponse.json();

        // CJ ka code 200 ka matlab success hota hai
        if (result.code === 200 && result.data && result.data.list && result.data.list.length > 0) {
            const product = result.data.list[0]; // Pehla product match uthana
            
            return res.status(200).json({
                success: true,
                title: product.productNameEn || product.productName,
                price: product.productPrice || "0",
                image: product.productImage || 'https://placeholder.com'
            });
        } else {
            return res.status(404).json({ success: false, message: `Product SKU (${sku}) CJ par nahi mila!` });
        }
    } catch (error) {
        console.error('CJ Product Fetch Error:', error);
        return res.status(500).json({ success: false, message: 'Network error or CJ API change' });
    }
};
