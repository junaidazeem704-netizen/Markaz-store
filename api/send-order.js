const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { orderId, items, itemsHtml, total, name, email, phone, address, notes, storeName, storeEmail } = req.body;

    if (!items || !name || !email || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!process.env.MY_GMAIL || !process.env.MY_GMAIL_APP_PASS) {
        return res.status(500).json({ 
            success: false, 
            message: 'Email configuration missing. Please set MY_GMAIL and MY_GMAIL_APP_PASS in Vercel environment variables.' 
        });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.MY_GMAIL_APP_PASS
        }
    });

    const mailOptions = {
        from: `"${storeName || 'Markaz Store'}" <${process.env.MY_GMAIL}>`,
        to: process.env.MY_GMAIL,
        subject: `🛍️ New Order #${orderId}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <h2 style="color: #6366f1;">🛍️ New Order #${orderId}</h2>
                <p><strong>Customer:</strong> ${name}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Items:</strong> ${items}</p>
                <p><strong>Total:</strong> Rs. ${total}</p>
                ${notes && notes !== 'N/A' ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Order email sent!' });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send email' });
    }
};