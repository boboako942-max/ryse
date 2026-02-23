import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await productsAPI.getAll({ limit: 8, sortBy: 'newest' });
        setFeaturedProducts(response.data.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to StyleHub</h1>
          <p>Discover the latest fashion trends and styles</p>
          <Link to="/products" className="hero-btn">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <h2>Shop by Category</h2>
        <div className="category-grid">
          <Link to="/products?category=men" className="category-card">
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1552062407-c551eeda4bbb?w=400&q=80" alt="Men" />
            </div>
            <h3>Men</h3>
          </Link>
          <Link to="/products?category=women" className="category-card">
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1595777712802-4d3d9a8f2bf9?w=400&q=80" alt="Women" />
            </div>
            <h3>Women</h3>
          </Link>
          <Link to="/products?category=kids" className="category-card">
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1586793676295-14a1fb23ba5b?w=400&q=80" alt="Kids" />
            </div>
            <h3>Kids</h3>
          </Link>
          <Link to="/products?category=accessories" className="category-card">
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80" alt="Accessories" />
            </div>
            <h3>Accessories</h3>
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <h2>Featured Products</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        <div className="view-all">
          <Link to="/products" className="view-all-btn">
            View All Products
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature">
          <span className="feature-icon">🚚</span>
          <h3>Free Shipping</h3>
          <p>On orders over $50</p>
        </div>
        <div className="feature">
          <span className="feature-icon">🔄</span>
          <h3>Easy Returns</h3>
          <p>30-day return policy</p>
        </div>
        <div className="feature">
          <span className="feature-icon">🔒</span>
          <h3>Secure Payment</h3>
          <p>100% secure transactions</p>
        </div>
        <div className="feature">
          <span className="feature-icon">👥</span>
          <h3>24/7 Support</h3>
          <p>Dedicated customer service</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
