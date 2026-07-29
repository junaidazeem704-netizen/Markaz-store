const https = require('https');

// Robust Network Handshake processor with anti-bot firewall bypass headers
function makeRequest(url, method, headers, postData = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        // Anti-Bot / Cloudflare bypass simulation headers block
        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'keep-alive'
        };

        // Custom parameters sync with default blueprint layers
        const finalHeaders = { ...defaultHeaders, ...headers };
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: finalHeaders,
            timeout: 12000 // 12 seconds backup processing latency
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
        req.on('timeout', () => { req.destroy(); reject(new Error('CJ Server Route Timeout')); });

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
        return res.status(400).json({ success: false, message: 'SKU code context missing!' });
    }

    const apiKey = process.env.CJ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel Configuration Alert: CJ_API_KEY missing from Dashboard Settings!' });
    }

    try {
        // Step 1: Requesting temporary core validation session access token
        const tokenUrl = 'https://api.cjdropshipping.com/api2.0/v1/authentication/getAccessToken';
        const tokenHeaders = { 'Content-Type': 'application/json' };
        
        const tokenRes = await makeRequest(tokenUrl, 'POST', tokenHeaders, { apiKey: apiKey.trim() });
        
        if (!tokenRes.isJson) {
            const rawBodyStr = typeof tokenRes.body === 'string' ? tokenRes.body.replace(/<[^>]*>/g, '').substring(0, 120) : 'Non-readable layout';
            return res.status(502).json({ 
                success: false, 
                message: `CJ Firewall Blocked Request: Firewall/Cloudflare security ne request reject kar di. Clean Text Snippet: "${rawBodyStr.trim()}"`
            });
        }

        const tokenData = tokenRes.body;
        if (!tokenData || tokenData.code !== 200 || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: `CJ Security Token Failure: ${tokenData.message || 'Apni API key re-generate kar ke Vercel mein update karein.'}` 
            });
        }

        const accessToken = tokenData.data.accessToken;

        // Step 2: Fetching the target SKU mapped entity model from catalog tree node
        const productUrl = `https://cjdropshipping.com{sku.trim()}&pageNum=1&pageSize=1`;
        const productHeaders = {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const productRes = await makeRequest(productUrl, 'GET', productHeaders);

        if (!productRes.isJson) {
            return res.status(502).json({ success: false, message: 'Catalog Request Dropped: Firewall mismatch on product routing node.' });
        }

        const productData = productRes.body;

        if (productData && productData.code === 200 && productData.data && productData.data.list) {
            const rootList = productData.data.list;

            if (Array.isArray(rootList) && rootList.length > 0) {
                const targetProduct = rootList[0];
                
                return res.status(200).json({
                    success: true,
                    title: targetProduct.productNameEn || targetProduct.productName || "Imported SKU Item",
                    price: targetProduct.productPrice || targetProduct.sellPrice || "0",
                    image: targetProduct.productImage || targetProduct.productImg || targetProduct.img || 'https://placeholder.com'
                });
            }
        }
        
        return res.status(404).json({ success: false, message: `Product variant SKU (${sku}) not found inside active live catalogs.` });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'System Core Engine Interruption: ' + error.message });
    }
};
