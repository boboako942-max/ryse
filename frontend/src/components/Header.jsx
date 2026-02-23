import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FiLogOut, FiUser, FiShoppingCart, FiHeart } from 'react-icons/fi';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">StyleHub</Link>
        </div>

        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="header-icons">
          <Link to="/wishlist" className="icon-link">
            <FiHeart /> Wishlist
          </Link>
          <Link to="/cart" className="icon-link">
            <FiShoppingCart /> Cart ({totalItems || 0})
          </Link>

          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.firstName}</span>
              <Link to="/profile" className="icon-link">
                <FiUser /> Profile
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <FiLogOut /> Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn-secondary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
