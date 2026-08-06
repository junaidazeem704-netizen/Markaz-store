module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Order ID required' 
        });
    }

    // Get orders from localStorage or database
    // For Vercel, we'll use a simple approach - read from a JSON file or environment
    // In production, use a database
    
    // For demo, we'll check if the order exists in our orders list
    // You can replace this with database query
    
    try {
        // This is a simplified version - in production, use a database
        const orders = JSON.parse(process.env.ORDERS || '[]');
        const order = orders.find(o => o.orderId === id);
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        return res.status(200).json({
            success: true,
            order: {
                orderId: order.orderId,
                status: order.status || 'processing',
                items: order.items,
                total: order.total,
                name: order.name,
                email: order.email,
                phone: order.phone,
                address: order.address,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt || order.createdAt
            }
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Error tracking order: ' + error.message 
        });
    }
};