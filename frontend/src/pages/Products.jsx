import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesRes = await categoriesAPI.getAll();
        setCategories(categoriesRes.data.data.categories);

        // Fetch products
        const params = {
          page: currentPage,
          limit: 12,
        };

        if (category) {
          params.category = category;
        }

        if (search) {
          params.search = search;
        }

        if (sortBy) {
          params.sortBy = sortBy;
        }

        const productsRes = await productsAPI.getAll(params);
        setProducts(productsRes.data.data.products);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, search, sortBy, currentPage]);

  const handleCategoryChange = (cat) => {
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    if (sort) {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('sortBy', sort);
        return params;
      });
    }
    setCurrentPage(1);
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          <div className="filter-group">
            <h4>Categories</h4>
            <button
              className={!category ? 'active' : ''}
              onClick={() => handleCategoryChange(null)}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                className={category === cat.slug ? 'active' : ''}
                onClick={() => handleCategoryChange(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h4>Sort By</h4>
            {[
              { value: 'newest', label: 'Newest' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'rating', label: 'Top Rated' },
            ].map((option) => (
              <button
                key={option.value}
                className={sortBy === option.value ? 'active' : ''}
                onClick={() => handleSortChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Products Section */}
        <main className="products-main">
          <div className="products-header">
            <h1>
              {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Products` : 'All Products'}
            </h1>
            <p>{products.length} products found</p>
          </div>

          {loading ? (
            <p className="loading">Loading products...</p>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="no-products">No products found. Try adjusting your filters.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
