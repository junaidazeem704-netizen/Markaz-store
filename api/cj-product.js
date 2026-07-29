const https = require('https');

// Pure Node.js Standard HTTPS Request Processing
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
        req.on('timeout', () => { req.destroy(); reject(new Error('CJ Gateway Timeout')); });

        if (postData && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

module.exports = async function handler(req, res) {
    // Handshake configuration headers setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { sku } = req.query;
    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU field input is required!' });
    }

    // Vercel backend environment setup check
    let apiKey = process.env.CJ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel Config Error: Dashboard mein CJ_API_KEY environment variable nahi mila!' });
    }

    // Koshish karein k agar koi accidental space ho to trim ho jaye
    apiKey = apiKey.trim();

    try {
        // Step 1: Getting validation session handshake token
        const tokenUrl = 'https://cjdropshipping.com';
        const tokenHeaders = { 'Content-Type': 'application/json' };
        
        const tokenRes = await makeRequest(tokenUrl, 'POST', tokenHeaders, { apiKey: apiKey });
        
        // Agar CJ Server JSON ke bajaye HTML throw kar raha hai to iska mukammal detail handle karna
        if (!tokenRes.isJson) {
            const serverRawText = typeof tokenRes.body === 'string' ? tokenRes.body.substring(0, 100) : 'Blank String';
            return res.status(502).json({ 
                success: false, 
                message: `CJ Security Refused (Invalid Key): Apni Vercel Dashboard key check karein. CJ Server Response Text snippet: "${serverRawText}"`
            });
        }

        const tokenData = tokenRes.body;
        if (!tokenData || tokenData.code !== 200 || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: `CJ Token Refused: ${tokenData.message || 'Apni API Key dobara check karein, CJ ne reject kar di.'}` 
            });
        }

        const accessToken = tokenData.data.accessToken;

        // Step 2: Catalog mapping queries
        const productUrl = `https://cjdropshipping.com{sku.trim()}&pageNum=1&pageSize=1`;
        const productHeaders = {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const productRes = await makeRequest(productUrl, 'GET', productHeaders);

        if (!productRes.isJson) {
            return res.status(502).json({ success: false, message: 'Product Mapping Error: CJ gateway returned non-json data.' });
        }

        const productData = productRes.body;

        if (productData && productData.code === 200 && productData.data && productData.data.list) {
            const rootList = productData.data.list;

            if (Array.isArray(rootList) && rootList.length > 0) {
                const targetProduct = rootList[0];
                
                return res.status(200).json({
                    success: true,
                    title: targetProduct.productNameEn || targetProduct.productName || "CJ Product",
                    price: targetProduct.productPrice || targetProduct.sellPrice || "0",
                    image: targetProduct.productImage || targetProduct.productImg || targetProduct.img || 'https://placeholder.com'
                });
            }
        }
        
        return res.status(404).json({ success: false, message: `Product Variant with SKU (${sku}) not found inside CJ Catalog.` });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Processor Error: ' + error.message });
    }
};
