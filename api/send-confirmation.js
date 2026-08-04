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

    // Customer Confirmation Email
    const mailOptions = {
        from: `"${storeName}" <${process.env.MY_GMAIL}>`,
        to: email,
        subject: `✅ Order Confirmed #${orderId} - ${storeName}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${storeName}</h1>
                    <p style="color: #a0a0b8; font-size: 14px;">Order Confirmation</p>
                </div>
                
                <div style="padding: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="background: #10b981; color: white; padding: 8px 24px; border-radius: 100px; font-size: 14px; font-weight: 600;">
                            ✅ Order Confirmed
                        </span>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">🛍️ Order Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Order ID:</strong> ${orderId}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Product:</strong> ${title}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Category:</strong> ${category}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Price:</strong> Rs. ${price}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Status:</strong> <span style="color: #10b981;">Processing</span></p>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">👤 Customer Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Name:</strong> ${name}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Email:</strong> ${email}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Phone:</strong> ${phone}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Address:</strong> ${address}</p>
                        ${notes && notes !== 'N/A' ? `<p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Notes:</strong> ${notes}</p>` : ''}
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">📦 What's Next?</h2>
                        <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6;">
                            1. We'll process your order within 24 hours<br>
                            2. You'll receive a tracking number via SMS/Email<br>
                            3. Delivery will be made within 3-5 working days<br>
                            4. You can track your order anytime
                        </p>
                    </div>
                </div>
                
                <div style="padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="color: #6a6a82; font-size: 12px;">
                        Thank you for shopping with ${storeName}!<br>
                        For any queries, contact us at ${storeEmail}
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Confirmation email sent to customer!' });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send confirmation email' });
    }
};