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

    const { orderId, status, name, email, items, total, storeName, storeEmail } = req.body;

    if (!orderId || !status || !email) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!process.env.MY_GMAIL || !process.env.MY_GMAIL_APP_PASS) {
        return res.status(500).json({ 
            success: false, 
            message: 'Email configuration missing.' 
        });
    }

    const statusMessages = {
        'shipped': '🚚 Your order has been shipped!',
        'delivered': '📦 Your order has been delivered!',
        'cancelled': '❌ Your order has been cancelled'
    };

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.MY_GMAIL_APP_PASS
        }
    });

    const mailOptions = {
        from: `"${storeName || 'Markaz Store'}" <${process.env.MY_GMAIL}>`,
        to: email,
        subject: `Order #${orderId} - ${statusMessages[status] || 'Status Updated'}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <h2 style="color: #6366f1;">Order #${orderId}</h2>
                <p>Dear ${name || 'Customer'},</p>
                <p><strong>${statusMessages[status] || 'Your order status has been updated'}</strong></p>
                <p><strong>Items:</strong> ${items}</p>
                <p><strong>Total:</strong> Rs. ${total}</p>
                <p>Track your order: <a href="https://${req.headers.host}/tracking.html?id=${orderId}" style="color: #6366f1;">Track Order</a></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Status email sent!' });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send email' });
    }
};