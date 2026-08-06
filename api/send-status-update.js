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
        console.error('Email credentials not set!');
        return res.status(500).json({ 
            success: false, 
            message: 'Email configuration missing.' 
        });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.MY_GMAIL_APP_PASS
        }
    });

    // Status icons and messages
    const statusMap = {
        'processing': { icon: '⏳', color: '#f59e0b', message: 'Your order is being processed' },
        'shipped': { icon: '🚚', color: '#6366f1', message: 'Your order has been shipped!' },
        'delivered': { icon: '📦', color: '#10b981', message: 'Your order has been delivered!' },
        'cancelled': { icon: '❌', color: '#ef4444', message: 'Your order has been cancelled' }
    };

    const statusInfo = statusMap[status] || statusMap['processing'];
    const trackingLink = `https://${req.headers.host || 'yourdomain.com'}/tracking.html?id=${orderId}`;

    const mailOptions = {
        from: `"${storeName || 'Markaz Store'}" <${process.env.MY_GMAIL}>`,
        to: email,
        subject: `${statusInfo.icon} Order #${orderId} - ${statusInfo.message}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${storeName || 'Markaz Store'}</h1>
                    <p style="color: #a0a0b8; font-size: 14px;">Order Status Update</p>
                </div>
                
                <div style="padding: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="background: ${statusInfo.color}; color: white; padding: 8px 24px; border-radius: 100px; font-size: 14px; font-weight: 600;">
                            ${statusInfo.icon} ${statusInfo.message}
                        </span>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">🛍️ Order Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Order ID:</strong> ${orderId}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Status:</strong> <span style="color:${statusInfo.color};">${statusInfo.message}</span></p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Items:</strong> ${items || 'N/A'}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Total:</strong> Rs. ${total}</p>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">👤 Customer Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Name:</strong> ${name || 'N/A'}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Email:</strong> ${email}</p>
                    </div>
                    
                    <!-- Tracking Link -->
                    <div style="background: linear-gradient(135deg, #1a1a2e, #2a2a4e); border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(99,102,241,0.2);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 8px;">🔍 Track Your Order</h2>
                        <a href="${trackingLink}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                            📦 Track Order
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="color: #6a6a82; font-size: 12px;">
                        Thank you for shopping with ${storeName || 'Markaz Store'}!<br>
                        ${storeEmail || 'info@markazstore.com'}
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Status update email sent!' });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to send email: ' + error.message 
        });
    }
};