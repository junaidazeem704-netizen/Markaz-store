const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST allowed' });
    }

    const { title, price, name, phone, address } = req.body || {};

    if (!name || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Details missing!' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MY_GMAIL,
                pass: process.env.MY_GMAIL_APP_PASS
            }
        });

        const mailOptions = {
            from: process.env.MY_GMAIL,
            to: process.env.MY_GMAIL,
            subject: `🛍️ New Order: ${title} - Rs. ${price}`,
            html: `
                <div style="font-family: Arial; padding: 20px; background: #0b1120; color: #fff;">
                    <h2 style="color: #10b981;">🎉 New Order Received!</h2>
                    <p><b>Product:</b> ${title}</p>
                    <p><b>Price:</b> Rs. ${price}</p>
                    <hr>
                    <h3>Customer Details:</h3>
                    <p><b>Name:</b> ${name}</p>
                    <p><b>Phone:</b> ${phone}</p>
                    <p><b>Address:</b> ${address}</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Order submitted!' });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

