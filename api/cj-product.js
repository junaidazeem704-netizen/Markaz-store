const https = require('https');

// Helper function: API requests handle karne ke liye bina node-fetch ke
function makeRequest(url, method, headers, postData = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON format from server'));
                }
            });
        });

        req.on('error', (err) => reject(err));

        if (postData && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

module.exports = async function handler(req, res) {
    // CORS aur JSON configuration set karna
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { sku } = req.query;
    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU Code zaroori hai!' });
    }

    const apiKey = process.env.CJ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel Config Error: CJ_API_KEY missing!' });
    }

    try {
        // Step 1: Access Token generate karna
        const tokenUrl = 'https://cjdropshipping.com';
        const tokenHeaders = { 'Content-Type': 'application/json' };
        
        const tokenData = await makeRequest(tokenUrl, 'POST', tokenHeaders, { apiKey: apiKey });
        
        if (!tokenData || tokenData.code !== 200 || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: 'CJ API Key galat hai ya Vercel mein theek tarike se save nahi hui.' 
            });
        }

        const accessToken = tokenData.data.accessToken;

        // Step 2: SKU product detail list fetch karna
        const productUrl = `https://cjdropshipping.com{sku}`;
        const productHeaders = {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const productData = await makeRequest(productUrl, 'GET', productHeaders);

        if (productData && productData.code === 200 && productData.data && productData.data.list && productData.data.list.length > 0) {
            const item = productData.data.list[0]; // Pehla array item uthana
            
            return res.status(200).json({
                success: true,
                title: item.productNameEn || item.productName,
                price: item.productPrice || "0",
                image: item.productImage || 'https://placeholder.com'
            });
        } else {
            return res.status(404).json({ success: false, message: `Product SKU (${sku}) CJ par nahi mila!` });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Backend Connection Error: ' + error.message });
    }
};
