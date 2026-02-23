import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { cartAPI } from '../services/api';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { cart, updateTotals, removeFromCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const response = await cartAPI.getCart();
          updateTotals(response.data.data.cart);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      };
      fetchCart();
    }
  }, [user, updateTotals]);

  const handleRemoveItem = async (productId, size, color) => {
    try {
      setLoading(true);
      await cartAPI.removeFromCart({ productId, size, color });
      removeFromCart(productId, size, color);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setLoading(true);
      await cartAPI.updateItem({
        productId: item.productId._id,
        quantity: newQuantity,
        size: item.size,
        color: item.color,
      });
      item.quantity = newQuantity;
      updateTotals(cart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <p>Please <Link to="/login">login</Link> to view your cart</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h2>Your Cart is Empty</h2>
          <p>Start shopping by visiting our <Link to="/products">products page</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Shopping Cart</h1>

        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={`${item.productId._id}-${item.size}-${item.color}`} className="cart-item">
                <div className="item-image">
                  <img src={item.productId.image || 'https://via.placeholder.com/100'} alt={item.productId.name} />
                </div>

                <div className="item-details">
                  <h3>{item.productId.name}</h3>
                  <p>Size: {item.size} | Color: {item.color}</p>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                </div>

                <div className="item-quantity">
                  <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)} disabled={loading}>
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)} disabled={loading}>
                    <FiPlus />
                  </button>
                </div>

                <div className="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>

                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.productId._id, item.size, item.color)}
                  disabled={loading}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${cart.totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span className="shipping">Free</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${cart.totalPrice.toFixed(2)}</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
              Proceed to Checkout
            </button>

            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
