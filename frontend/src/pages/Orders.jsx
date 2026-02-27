import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import './Orders.css';

const Orders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await ordersAPI.getAll();
        setOrders(response.data.data.orders || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1>My Orders</h1>

        {loading ? (
          <div className="loading-state">
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>📦 You haven't placed any orders yet.</p>
            <button onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.orderId}</h3>
                    <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${order.orderStatus}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">Total Amount:</span>
                    <span className="value">${order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Payment Status:</span>
                    <span className="value">{order.paymentStatus}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Payment Method:</span>
                    <span className="value">{order.paymentMethod || 'N/A'}</span>
                  </div>
                  {order.trackingNumber && (
                    <div className="detail-row">
                      <span className="label">Tracking Number:</span>
                      <span className="value">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>

                <div className="order-items">
                  <h4>Items ({order.items.length})</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <span>{item.productId?.name || 'Product'}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-address">
                  <h4>Shipping Address</h4>
                  <p>
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="orders-footer">
          <button onClick={() => navigate('/products')} className="continue-shopping-btn">
            ← Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orders;
