import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { cartAPI } from '../services/api';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { cart, updateTotals, removeFromCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const selectAllCheckboxRef = useRef(null);

  useEffect(() => {
    const initializeCart = async () => {
      try {
        setError(null);
        if (user) {
          console.log('Fetching cart for user:', user.id);
          const response = await cartAPI.getCart();
          console.log('Cart fetched successfully:', response.data.data.cart);
          // Always use server data as the source of truth
          updateTotals(response.data.data.cart);
          // Auto-select all items by default
          if (response.data.data.cart?.items) {
            const allItemKeys = response.data.data.cart.items.map(
              (item) => `${item.productId._id}-${item.size}-${item.color}`
            );
            setSelectedItems(allItemKeys);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        setError(error.response?.data?.message || 'Failed to load cart');
        // If there's an error, at least show the cached cart from localStorage
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user, updateTotals]);

  // Update select-all checkbox indeterminate state
  useEffect(() => {
    if (selectAllCheckboxRef.current && cart && cart.items && cart.items.length > 0) {
      const allSelected = selectedItems.length === cart.items.length;
      const someSelected = selectedItems.length > 0 && selectedItems.length < cart.items.length;
      
      selectAllCheckboxRef.current.checked = allSelected;
      selectAllCheckboxRef.current.indeterminate = someSelected && !allSelected;
      
      console.log(`Checkbox state - All: ${allSelected}, Some: ${someSelected}, Count: ${selectedItems.length}/${cart.items.length}`);
    }
  }, [selectedItems, cart?.items?.length]);

  const handleRemoveItem = async (productId, size, color) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.removeFromCart(productId, { size, color });
      // Use the fresh cart data from API response
      if (response.data.data.cart) {
        updateTotals(response.data.data.cart);
      }
      // Remove from selected items
      const key = `${productId}-${size}-${color}`;
      setSelectedItems((prev) => prev.filter((item) => item !== key));
    } catch (error) {
      console.error('Error removing item:', error);
      setError(error.response?.data?.message || 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.updateItem({
        productId: item.productId._id,
        quantity: newQuantity,
        size: item.size,
        color: item.color,
      });
      // Use the fresh cart data from API response
      if (response.data.data.cart) {
        updateTotals(response.data.data.cart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemKey) => {
    setSelectedItems((prevItems) => {
      let newItems;
      if (prevItems.includes(itemKey)) {
        // Remove if already selected
        newItems = prevItems.filter((item) => item !== itemKey);
        console.log('Deselected:', itemKey, 'New count:', newItems.length);
      } else {
        // Add if not selected
        newItems = [...prevItems, itemKey];
        console.log('Selected:', itemKey, 'New count:', newItems.length);
      }
      
      return newItems;
    });
  };

  const handleSelectAll = () => {
    if (!cart || !cart.items || cart.items.length === 0) return;
    
    const allItemKeys = cart.items.map(
      (item) => `${item.productId._id}-${item.size}-${item.color}`
    );
    
    // Toggle: If all are selected, deselect all. Otherwise, select all.
    const shouldSelectAll = selectedItems.length !== cart.items.length;
    const newItems = shouldSelectAll ? allItemKeys : [];
    
    console.log(shouldSelectAll ? 'Selecting all' : 'Deselecting all', newItems.length);
    setSelectedItems(newItems);
  };

  const getSelectedItemsData = () => {
    return cart.items.filter(
      (item) => selectedItems.includes(`${item.productId._id}-${item.size}-${item.color}`)
    );
  };

  const selectedTotal = getSelectedItemsData().reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to checkout');
      return;
    }
    // Pass selected items via state
    navigate('/checkout', { state: { selectedItems } });
  };

  if (!user) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <h2>🔐 Please Login</h2>
            <p>Please <Link to="/login">login</Link> to view your cart</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    if (loading) {
      return (
        <div className="cart-page">
          <div className="cart-container">
            <div className="empty-cart">
              <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
              <h2>Loading Cart...</h2>
              <p>Please wait</p>
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <h2>🛒 Your Cart is Empty</h2>
            <p>Start shopping by visiting our <Link to="/products">products page</Link></p>
            <Link to="/" className="continue-shopping" style={{ display: 'block', marginTop: '1rem' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Shopping Cart</h1>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="cart-content">
          <div className="cart-items">
            {/* Select All */}
            <div className="select-all-bar">
              <label className="checkbox-label">
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  checked={selectedItems.length === (cart?.items?.length || 0) && (cart?.items?.length || 0) > 0}
                  onChange={handleSelectAll}
                  title={cart && cart.items && selectedItems.length > 0 && selectedItems.length < cart.items.length ? 'Some items selected' : 'Select or deselect all items'}
                />
                <span>Select All ({cart?.items?.length || 0})</span>
              </label>
              <span className="selected-count">Selected: {selectedItems.length}</span>
            </div>

            {cart.items.map((item) => {
              const itemKey = `${item.productId._id}-${item.size}-${item.color}`;
              const isSelected = selectedItems.includes(itemKey);

              return (
                <div key={itemKey} className={`cart-item ${isSelected ? 'selected' : ''}`}>
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(itemKey)}
                      data-item-key={itemKey}
                    />
                  </div>

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
              );
            })}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>All Items:</span>
              <span>${cart.totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row selected">
              <span>Selected Items:</span>
              <span className="selected-price">${selectedTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span className="shipping">Free</span>
            </div>
            <div className="summary-row total">
              <span>Checkout Total:</span>
              <span>${selectedTotal.toFixed(2)}</span>
            </div>

            <button 
              className="checkout-btn" 
              onClick={handleCheckout} 
              disabled={loading || selectedItems.length === 0}
            >
              {selectedItems.length === 0 ? 'Select items to checkout' : `Proceed to Checkout (${selectedItems.length} items)`}
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
