const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { title, price, name, phone, address } = req.body;

    if (!title || !name || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.MY_GMAIL_APP_PASS
        }
    });

    const mailOptions = {
        from: `"Markaz Store" <${process.env.MY_GMAIL}>`,
        to: process.env.MY_GMAIL,
        subject: `🛍️ New Order: ${title} - Rs. ${price}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb;">🛍️ New Order Received!</h2>
                <p><b>Product:</b> ${title}</p>
                <p><b>Price:</b> Rs. ${price}</p>
                <hr style="border: 0.5px solid #eee;">
                <h3>Customer Details:</h3>
                <p><b>Name:</b> ${name}</p>
                <p><b>Phone:</b> ${phone}</p>
                <p><b>Address:</b> ${address}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Order email sent successfully!' });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send email' });
    }
};
