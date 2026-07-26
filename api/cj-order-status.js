// ================= VERCEL API: /api/cj-order-status.js ================= //

export default async function handler(req, res) {
    const { orderId } = req.query; // CJ Order ID ya Store Order ID (e.g., MKZ-123456)
    const CJ_KEY = process.env.CJ_API_KEY || process.env.CJ_API_TOKEN;

    if (!orderId) {
        return res.status(400).json({ success: false, message: "Order ID zaroori hai!" });
    }

    if (!CJ_KEY) {
        return res.status(500).json({ success: false, message: "CJ_API_KEY missing hai!" });
    }

    try {
        // 1. Get Access Token
        const tokenRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: CJ_KEY })
        });
        const tokenData = await tokenRes.json();
        const token = tokenData?.data?.accessToken;

        if (!token) {
            return res.status(401).json({ success: false, message: "CJ Auth Token Failed!" });
        }

        // 2. Fetch Order Details from CJ
        const cjRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`, {
            headers: { 'CJ-Access-Token': token }
        });

        const cjData = await cjRes.json();

        if (cjData.result && cjData.data) {
            const order = cjData.data;
            return res.status(200).json({
                success: true,
                data: {
                    orderId: order.orderId,
                    orderNumber: order.orderNumber,
                    status: order.orderStatus, // e.g., UNPAID, PROCESSING, DISPATCHED, DELIVERED
                    trackingNumber: order.trackingNumber || "Not Shipped Yet",
                    trackingUrl: order.trackingUrl || "",
                    shippingCost: order.logisticPrice || 0
                }
            });
        } else {
            return res.status(404).json({ success: false, message: cjData.message || "CJ Order nahi mila!" });
        }

    } catch (error) {
        console.error("CJ Tracking Error:", error);
        return res.status(500).json({ success: false, message: "Server connection error!" });
    }
}

