import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const updateTotals = (cartData) => {
    if (cartData) {
      setCart(cartData);
      setTotalItems(cartData.totalItems || 0);
      setTotalPrice(cartData.totalPrice || 0);
    }
  };

  const addToCart = (item) => {
    if (cart) {
      const existingItem = cart.items.find(
        (i) => i.productId._id === item.productId && i.size === item.size && i.color === item.color
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.items.push(item);
      }

      updateTotals(cart);
    }
  };

  const removeFromCart = (productId, size, color) => {
    if (cart) {
      cart.items = cart.items.filter(
        (item) => !(item.productId._id === productId && item.size === size && item.color === color)
      );
      updateTotals(cart);
    }
  };

  const clearCart = () => {
    setCart(null);
    setTotalItems(0);
    setTotalPrice(0);
  };

  return (
    <CartContext.Provider value={{ cart, totalItems, totalPrice, updateTotals, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
