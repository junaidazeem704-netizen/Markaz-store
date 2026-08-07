const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { 
        orderId, items, itemsHtml, total, 
        name, email, phone, address, notes, 
        storeName, storeEmail 
    } = req.body;

    // Validation
    if (!items || !name || !email || !phone || !address) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }

    // Check if credentials are set
    if (!process.env.MY_GMAIL || !process.env.MY_GMAIL_APP_PASS) {
        console.error('❌ Email credentials not set!');
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

    // ============================================
    // TRACKING LINK
    // ============================================
    const trackingLink = `https://${req.headers.host || 'markaz-store.vercel.app'}/tracking.html?id=${orderId}`;

    // ============================================
    // ADMIN EMAIL WITH TRACKING
    // ============================================
    const adminMailOptions = {
        from: `"${storeName || 'Markaz Store'}" <${process.env.MY_GMAIL}>`,
        to: process.env.MY_GMAIL,
        subject: `🛍️ New Order #${orderId}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${storeName || 'Markaz Store'}</h1>
                    <p style="color: #a0a0b8; font-size: 14px;">New Order Received</p>
                    <span style="background: #ef4444; color: white; padding: 4px 16px; border-radius: 100px; font-size: 12px; font-weight: 600;">NEW ORDER</span>
                </div>
                
                <div style="padding: 20px 0;">
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">🛍️ Order Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Order ID:</strong> ${orderId}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Date:</strong> ${new Date().toLocaleString()}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Total:</strong> <span style="color:#6366f1;font-size:1.2rem;font-weight:700;">Rs. ${total}</span></p>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">📦 Items</h2>
                        ${itemsHtml || items.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">👤 Customer Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Name:</strong> ${name}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Email:</strong> ${email}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Phone:</strong> ${phone}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Address:</strong> ${address}</p>
                        ${notes && notes !== 'N/A' && notes !== '' ? `<p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Notes:</strong> ${notes}</p>` : ''}
                    </div>

                    <!-- ========================================== -->
                    <!-- TRACKING LINK FOR ADMIN -->
                    <!-- ========================================== -->
                    <div style="background: linear-gradient(135deg, #1a1a2e, #2a2a4e); border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(99,102,241,0.2);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 8px;">🔍 Track Order</h2>
                        <a href="${trackingLink}" style="display: inline-block; padding: 10px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                            📦 Track Order
                        </a>
                        <p style="color: #6a6a82; font-size: 11px; margin-top: 8px;">Order ID: ${orderId}</p>
                    </div>
                </div>
                
                <div style="padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="color: #6a6a82; font-size: 12px;">This is an automated notification from ${storeName || 'Markaz Store'}<br>${storeEmail || 'info@markazstore.com'}</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(adminMailOptions);
        console.log('✅ Admin email sent with tracking link!');
        return res.status(200).json({ success: true, message: 'Order email sent to admin with tracking!' });
    } catch (error) {
        console.error('❌ Email error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to send email: ' + error.message 
        });
    }
};