const https = require('https');

// Helper function: API calls ko handle karne ke liye bina kisi external package ke
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
                    reject(new Error('Invalid JSON response from server'));
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
    // Browser ke connection blocks bypass karne ke liye headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { sku } = req.query;
    if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU Code zaroori hai!' });
    }

    // Vercel Environment se aapki API Key uthana
    const apiKey = process.env.CJ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Vercel Settings check karein: CJ_API_KEY missing hai!' });
    }

    try {
        // Step 1: CJ Server se Access Token generate karna
        const tokenUrl = 'https://cjdropshipping.com';
        const tokenHeaders = { 'Content-Type': 'application/json' };
        
        const tokenData = await makeRequest(tokenUrl, 'POST', tokenHeaders, { apiKey: apiKey });
        
        if (!tokenData || tokenData.code !== 200 || !tokenData.data || !tokenData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: 'CJ API Key reject ho gayi hai ya key sahi tarike se set nahi hui.' 
            });
        }

        const accessToken = tokenData.data.accessToken;

        // Step 2: Access Token ko use kar ke SKU product list fetch karna
        const productUrl = `https://cjdropshipping.com{sku}`;
        const productHeaders = {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const productData = await makeRequest(productUrl, 'GET', productHeaders);

        if (productData && productData.code === 200 && productData.data && productData.data.list && productData.data.list.length > 0) {
            const item = productData.data.list[0]; // Pehla confirm match product uthana
            
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
        return res.status(500).json({ success: false, message: 'Backend Error: ' + error.message });
    }
};
