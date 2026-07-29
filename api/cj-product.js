const https = require('https');

// Helper function: Pure HTTPS Requests processing without node-fetch dependency
function makeRequest(url, method, headers, postData = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: headers,
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed, isJson: true });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data, isJson: false });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('CJ Server Timeout')); });

        if (postData && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

module.exports = async function handler(req, res) {
    // CORS validation rules setting up for client UI handshake
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { sku } = req.query;
    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU Code provided is blank!' });
    }

    const apiKey = process.env.CJ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel Env Key Error: CJ_API_KEY Missing!' });
    }

    try {
        // Step 1: Secure authentication endpoint access
        const tokenUrl = 'https://cjdropshipping.com';
        const tokenHeaders = { 'Content-Type': 'application/json' };
        
        const tokenRes = await makeRequest(tokenUrl, 'POST', tokenHeaders, { apiKey: apiKey.trim() });
        
        if (!tokenRes.isJson) {
            return res.status(502).json({ 
                success: false, 
                message: 'Authentication Failure: Invalid text response from core gateway.' 
            });
        }

        const tokenData = tokenRes.body;
        if (!tokenData || tokenData.code !== 200 || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: `CJ Security Token Rejected: ${tokenData.message || 'Check your environment API key string'}` 
            });
        }

        const accessToken = tokenData.data.accessToken;

        // Step 2: Querying the explicit search mapping catalog tree via listV2
        const productUrl = `https://cjdropshipping.com{sku.trim()}&pageNum=1&pageSize=1`;
        const productHeaders = {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const productRes = await makeRequest(productUrl, 'GET', productHeaders);

        if (!productRes.isJson) {
            return res.status(502).json({ success: false, message: 'Data Parsing Error: API endpoint configuration format conflict.' });
        }

        const productData = productRes.body;

        // Checking array index structural mapping layout robustly
        if (productData && productData.code === 200 && productData.data && productData.data.list) {
            const rootList = productData.data.list;

            if (Array.isArray(rootList) && rootList.length > 0) {
                // Safely indexing the root element node
                const targetProduct = rootList[0];
                
                // CJ response structural nesting validation layers
                const extractedTitle = targetProduct.productNameEn || targetProduct.productName || "CJ Imported Product";
                const extractedPrice = targetProduct.productPrice || targetProduct.sellPrice || "0";
                const extractedImage = targetProduct.productImage || targetProduct.productImg || targetProduct.img || 'https://placeholder.com';

                return res.status(200).json({
                    success: true,
                    title: extractedTitle,
                    price: extractedPrice,
                    image: extractedImage
                });
            }
        }
        
        return res.status(404).json({ success: false, message: `Product variant with SKU (${sku}) not found inside catalog.` });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Core Processing Exception: ' + error.message });
    }
};
