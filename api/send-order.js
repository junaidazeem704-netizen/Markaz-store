const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { type, order } = req.body;

    // SMTP Credentials from Vercel Environment Variables
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const itemsHtml = (order.items || []).map(item => `
        <tr style="border-bottom:1px solid #333;">
            <td style="padding:10px;"><img src="${item.image}" width="50" height="50" style="border-radius:6px; object-fit:cover;"></td>
            <td style="padding:10px; color:#fff;">${item.title}<br><small style="color:#aaa;">Color: ${item.color} | Size: ${item.size}</small></td>
            <td style="padding:10px; color:#fff;">x${item.quantity}</td>
            <td style="padding:10px; color:#10b981;">Rs. ${item.price * item.quantity}</td>
        </tr>
    `).join('');

    const htmlTemplate = `
        <div style="background:#0b0f19; color:#fff; padding:30px; font-family:sans-serif; border-radius:12px;">
            <h1 style="color:#6366f1;">MARKAZ STORE</h1>
            <h2>${type === 'NEW_ORDER' ? 'Order Confirmation' : 'Order Status Update'}</h2>
            <p>Hi <strong>${order.name}</strong>,</p>
            <p>${type === 'NEW_ORDER' ? 'Thank you for shopping with us! Here are your order details:' : `Your order status has been updated to: <strong style="color:#f59e0b; text-transform:uppercase;">${order.status}</strong>`}</p>

            <div style="background:#111827; padding:15px; border-radius:8px; margin:20px 0;">
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Shipping Address:</strong> ${order.address}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="color:#aaa; text-align:left; border-bottom:1px solid #444;">
                        <th>Item</th>
                        <th>Details</th>
                        <th>Qty</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>

            <h3 style="color:#10b981;">Total Amount: Rs. ${order.total}</h3>
            
            <div style="margin-top:30px;">
                <a href="https://${req.headers.host}/track-order.html?id=${order.order_id}" style="background:#6366f1; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; display:inline-block;">Track Your Order Live</a>
            </div>
        </div>
    `;

    try {
        // Send Email to Customer
        await transporter.sendMail({
            from: `"Markaz Store" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: type === 'NEW_ORDER' ? `Order Confirmed #${order.order_id}` : `Order Status Update #${order.order_id}`,
            html: htmlTemplate
        });

        // Send Notification Email to Admin
        await transporter.sendMail({
            from: `"Markaz Alerts" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `🚨 Admin Alert: ${type} #${order.order_id}`,
            html: htmlTemplate
        });

        res.status(200).json({ success: true, message: 'Emails sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};
