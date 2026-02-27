import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize from localStorage if available
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('stylehub_cart');
      return savedCart ? JSON.parse(savedCart) : null;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return null;
    }
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      try {
        localStorage.setItem('stylehub_cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart]);

  const updateTotals = (cartData) => {
    if (cartData) {
      setCart(cartData);
      setTotalItems(cartData.totalItems || 0);
      setTotalPrice(cartData.totalPrice || 0);
    }
  };

  const addToCart = (item) => {
    if (cart) {
      // Create a new cart object to trigger re-render
      const updatedCart = { ...cart };
      const existingItem = updatedCart.items.find(
        (i) => i.productId._id === item.productId && i.size === item.size && i.color === item.color
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        updatedCart.items = [...updatedCart.items, item];
      }

      // Recalculate totals
      updatedCart.totalPrice = updatedCart.items.reduce( (sum, i) => sum + i.price * i.quantity, 0);
      updatedCart.totalItems = updatedCart.items.reduce((sum, i) => sum + i.quantity, 0);

      updateTotals(updatedCart);
    }
  };

  const removeFromCart = (productId, size, color) => {
    if (cart) {
      // Create a new cart object to trigger re-render
      const updatedCart = {
        ...cart,
        items: cart.items.filter(
          (item) => !(item.productId._id === productId && item.size === size && item.color === color)
        ),
      };

      // Recalculate totals
      updatedCart.totalPrice = updatedCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      updatedCart.totalItems = updatedCart.items.reduce((sum, i) => sum + i.quantity, 0);

      updateTotals(updatedCart);
    }
  };

  const clearCart = () => {
    setCart({ items: [], totalPrice: 0, totalItems: 0 });
    setTotalItems(0);
    setTotalPrice(0);
    try {
      localStorage.removeItem('stylehub_cart');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, totalItems, totalPrice, updateTotals, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

