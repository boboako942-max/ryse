import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { cartAPI } from '../services/api';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { updateTotals } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      setLoading(true);
      const response = await cartAPI.addToCart({
        productId: product._id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      });
      
      updateTotals(response.data.data.cart);
      alert('Item added to cart!');
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image || 'https://via.placeholder.com/250'} alt={product.name} />
        <button className="wishlist-btn" title="Add to Wishlist">
          <FiHeart />
        </button>
      </div>

      <div className="product-info">
        <Link to={`/products/${product._id}`} className="product-name">
          {product.name}
        </Link>

        <div className="product-rating">
          <span className="stars">
            {'★'.repeat(Math.round(product.rating))}
            {'☆'.repeat(5 - Math.round(product.rating))}
          </span>
          <span className="rating-value">({product.rating})</span>
        </div>

        <div className="product-price">
          <span className="current-price">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        <div className="product-options">
          <div className="option-group">
            <label>Size:</label>
            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
              <option value="">Select Size</option>
              {product.sizes.map((size) => (
                <option key={size.size} value={size.size}>
                  {size.size}
                </option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label>Color:</label>
            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
              <option value="">Select Color</option>
              {product.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={loading}>
          <FiShoppingCart /> {loading ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
