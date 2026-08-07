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

    const { 
        orderId, items, itemsHtml, total, 
        name, email, phone, address, notes, 
        storeName, storeEmail 
    } = req.body;

    if (!items || !name || !email || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!process.env.MY_GMAIL || !process.env.MY_GMAIL_APP_PASS) {
        console.error('❌ Email credentials not set!');
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

    // ============================================
    // TRACKING LINK
    // ============================================
    const trackingLink = `https://${req.headers.host || 'markaz-store.vercel.app'}/tracking.html?id=${orderId}`;

    // ============================================
    // CUSTOMER CONFIRMATION EMAIL WITH TRACKING
    // ============================================
    const mailOptions = {
        from: `"${storeName || 'Markaz Store'}" <${process.env.MY_GMAIL}>`,
        to: email,
        subject: `✅ Order Confirmed #${orderId} - ${storeName || 'Markaz Store'}`,
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff; border-radius: 12px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${storeName || 'Markaz Store'}</h1>
                    <p style="color: #a0a0b8; font-size: 14px;">Order Confirmation</p>
                </div>
                
                <div style="padding: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="background: #10b981; color: white; padding: 8px 24px; border-radius: 100px; font-size: 14px; font-weight: 600;">
                            ✅ Order Confirmed
                        </span>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">🛍️ Order Summary</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Order ID:</strong> ${orderId}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Total:</strong> <span style="color:#6366f1;font-size:1.2rem;font-weight:700;">Rs. ${total}</span></p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Status:</strong> <span style="color:#10b981;">Processing</span></p>
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">📦 Your Items</h2>
                        ${itemsHtml || items.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">📦 Delivery Details</h2>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Name:</strong> ${name}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Phone:</strong> ${phone}</p>
                        <p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Address:</strong> ${address}</p>
                        ${notes && notes !== 'N/A' && notes !== '' ? `<p style="margin: 4px 0; color: #a0a0b8;"><strong style="color: #fff;">Notes:</strong> ${notes}</p>` : ''}
                    </div>

                    <!-- ========================================== -->
                    <!-- TRACKING LINK - CUSTOMER -->
                    <!-- ========================================== -->
                    <div style="background: linear-gradient(135deg, #1a1a2e, #2a2a4e); border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(99,102,241,0.2);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 8px;">🔍 Track Your Order</h2>
                        <p style="color: #a0a0b8; font-size: 14px; margin-bottom: 12px;">
                            Click the button below to track your order status
                        </p>
                        <a href="${trackingLink}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                            📦 Track Order
                        </a>
                        <p style="color: #6a6a82; font-size: 11px; margin-top: 8px;">
                            Order ID: ${orderId}
                        </p>
                    </div>

                    <!-- ========================================== -->
                    <!-- WHAT'S NEXT -->
                    <!-- ========================================== -->
                    <div style="background: #1a1a2e; border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.06);">
                        <h2 style="font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px;">📦 What's Next?</h2>
                        <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6;">
                            1️⃣ We'll process your order within 24 hours<br>
                            2️⃣ You'll receive a tracking number via SMS/Email<br>
                            3️⃣ Delivery will be made within 3-5 working days<br>
                            🔗 <strong>Track your order anytime using the link above</strong>
                        </p>
                    </div>
                </div>
                
                <div style="padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="color: #6a6a82; font-size: 12px;">
                        Thank you for shopping with ${storeName || 'Markaz Store'}!<br>
                        For any queries, contact us at ${storeEmail || 'info@markazstore.com'}
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Customer confirmation email sent with tracking link!');
        return res.status(200).json({ success: true, message: 'Confirmation email sent to customer with tracking!' });
    } catch (error) {
        console.error('❌ Email error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to send confirmation email: ' + error.message 
        });
    }
};