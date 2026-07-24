const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Only POST allowed' });

    const { title, price, name, phone, address, selectedColor, selectedSize, cjSku, isCjProduct } = req.body || {};

    if (!name || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Details missing!' });
    }

    const gmailUser = process.env.MY_GMAIL;
    const gmailPass = process.env.MY_GMAIL_APP_PASS;
    const cjApiKey = process.env.CJ_API_KEY;

    let cjOrderStatus = "N/A (Markaz Local Product)";

    // 1. If product is from CJ Dropshipping, push order to CJ API
    if (isCjProduct && cjSku && cjApiKey) {
        try {
            // Get Access Token
            const tokenRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: cjApiKey })
            });
            const tokenData = await tokenRes.json();

            if (tokenData.result && tokenData.data) {
                const token = tokenData.data.accessToken;

                // Create Order on CJ
                const cjOrderRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CJ-Access-Token': token
                    },
                    body: JSON.stringify({
                        orderNumber: "MKZ-" + Date.now(),
                        shippingCustomerName: name,
                        shippingAddress: address,
                        shippingPhone: phone,
                        shippingCountryCode: "PK",
                        products: [
                            {
                                sku: cjSku,
                                quantity: 1
                            }
                        ]
                    })
                });
                const cjResJson = await cjOrderRes.json();
                cjOrderStatus = cjResJson.result ? "✅ Order Pushed to CJ Successfully" : `⚠️ CJ Error: ${cjResJson.message}`;
            }
        } catch (err) {
            console.error("CJ Order Push Failed:", err);
            cjOrderStatus = "⚠️ Failed to auto-push to CJ: " + err.message;
        }
    }

    // 2. Send Gmail Email Notification
    try {
        if (gmailUser && gmailPass) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: gmailUser, pass: gmailPass }
            });

            const mailOptions = {
                from: gmailUser,
                to: gmailUser,
                subject: `🛍️ New Order: ${title} - Rs. ${price}`,
                html: `
                    <div style="font-family: Arial; padding: 20px; background: #0b1120; color: #fff; border-radius: 8px;">
                        <h2 style="color: #10b981;">🎉 New Order Received!</h2>
                        <p><b>Product:</b> ${title}</p>
                        <p><b>Price:</b> Rs. ${price}</p>
                        ${selectedColor ? `<p><b>Color:</b> ${selectedColor}</p>` : ''}
                        ${selectedSize ? `<p><b>Size:</b> ${selectedSize}</p>` : ''}
                        ${cjSku ? `<p><b>CJ SKU:</b> ${cjSku}</p>` : ''}
                        <p><b>Source:</b> ${isCjProduct ? 'CJ Dropshipping' : 'Markaz Local Store'}</p>
                        <p><b>CJ Auto Status:</b> ${cjOrderStatus}</p>
                        <hr style="border-color: #1e293b;">
                        <h3 style="color: #38bdf8;">👤 Customer Info:</h3>
                        <p><b>Name:</b> ${name}</p>
                        <p><b>Phone:</b> ${phone}</p>
                        <p><b>Address:</b> ${address}</p>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
        }

        return res.status(200).json({
            success: true,
            message: 'Order placed successfully!',
            cjStatus: cjOrderStatus
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
