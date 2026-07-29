const https = require('https');

// Pure Node.js Standard HTTPS Request Processing
function makeRequest(url, method, headers, postData = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        // Anti-Bot / Firewall safety parameters block
        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
        };

        const finalHeaders = { ...defaultHeaders, ...headers };
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: finalHeaders,
            timeout: 12000
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
        req.on('timeout', () => { req.destroy(); reject(new Error('CJ Gateway Timeout')); });

        if (postData && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { sku } = req.query;
    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU query is blank!' });
    }

    const apiKey = process.env.CJ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel Config Error: Dashboard variable CJ_API_KEY missing!' });
    }

    try {
        // 🔴 Step 1: Corrected Global API Token URL Path (Removed /v1)
        const tokenUrl = 'https://cjdropshipping.com';
        const tokenHeaders = { 'Content-Type': 'application/json' };
        
        const tokenRes = await makeRequest(tokenUrl, 'POST', tokenHeaders, { apiKey: apiKey.trim() });
        
        if (!tokenRes.isJson) {
            return res.status(502).json({ 
                success: false, 
                message: `CJ Gateway Structure Error: Expected JSON but received raw response: "${tokenRes.body.toString().substring(0, 100)}"`
            });
        }

        const tokenData = tokenRes.body;
        
        // CJ V2 Responses use 200 or "200" string as success code
        if (!tokenData || (tokenData.code !== 200 && tokenData.code !== "200") || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: `CJ Token Refused: ${tokenData.message || 'Apni API Key check karein, CJ ne authorize nahi kiya.'}` 
            });
        }

        const accessToken = tokenData.data.accessToken;

        // 🔴 Step 2: Corrected Global Product List V2 URL Path (Removed /v1)
        const productUrl = `https://cjdropshipping.com{sku.trim()}&pageNum=1&pageSize=1`;
        const productHeaders = {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const productRes = await makeRequest(productUrl, 'GET', productHeaders);

        if (!productRes.isJson) {
            return res.status(502).json({ success: false, message: 'Product Mapping Error: CJ gateway structure layout mismatched.' });
        }

        const productData = productRes.body;

        if (productData && (productData.code === 200 || productData.code === "200") && productData.data && productData.data.list) {
            const rootList = productData.data.list;

            if (Array.isArray(rootList) && rootList.length > 0) {
                const targetProduct = rootList[0]; // Safely target first array node item
                
                return res.status(200).json({
                    success: true,
                    title: targetProduct.productNameEn || targetProduct.productName || "CJ Item",
                    price: targetProduct.productPrice || targetProduct.sellPrice || "0",
                    image: targetProduct.productImage || targetProduct.productImg || targetProduct.img || 'https://placeholder.com'
                });
            }
        }
        
        return res.status(404).json({ success: false, message: `Product SKU (${sku}) CJ database mein nahi mila.` });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Exception Interruption: ' + error.message });
    }
};
