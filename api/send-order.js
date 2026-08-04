const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { orderId, title, price, category, name, email, phone, address, notes, storeName, storeEmail } = req.body;

    if (!title || !name || !email || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.MY_GMAIL_APP_PASS
        }
    });

    // Admin Email
    const mailOptions = {
        from: `"${storeName}" <${process.env.MY_GMAIL}>`,
        to: process.env.MY_GMAIL,
        subject: `🛍️ New Order #${orderId} - ${title}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${storeName}</h1>
                    <p style="color: #a0a0b8; font-size: 14px;">New Order Received</p>
                </div>
                
                <div style="padding: 20px 0;">
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">🛍️ Order Details</h2>
                        <p style