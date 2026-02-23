import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { paymentsAPI, ordersAPI } from '../services/api';
import './Checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * GCash Payment Form with Real-time Conversion
 */
const GCashPaymentForm = ({ shippingData, exchangeRate = 56.5, onSuccess }) => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Calculate PHP amount using current exchange rate
  const phpAmount = (cart.totalPrice * exchangeRate).toFixed(2);

  const handleGCashPayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate shipping data
      if (!shippingData.firstName || !shippingData.lastName || !shippingData.email || !shippingData.phone || !shippingData.address) {
        setError('Please fill in all required shipping information');
        setLoading(false);
        return;
      }

      const response = await paymentsAPI.createGCashCheckoutSession({
        items: cart.items,
        shippingAddress: shippingData,
        totalAmount: cart.totalPrice,
      });

      const { checkoutUrl, referenceId, exchangeRate: usedRate } = response.data.data;

      // Store reference ID for verification
      localStorage.setItem('gcash_reference_id', referenceId);
      localStorage.setItem('gcash_exchange_rate', usedRate);

      // Redirect to PayMongo checkout page
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'GCash payment processing failed. Please try again.');
      console.error('GCash payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGCashPayment} className="checkout-form">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">✅ Order created! Redirecting...</div>}

      <div className="form-group">
        <p className="payment-info" style={{ lineHeight: '1.8', fontSize: '14px' }}>
          <strong>📱 GCash Payment via PayMongo</strong><br/>
          <small style={{color: '#666'}}>Manual payment via GCash app after order confirmation</small>
        </p>
      </div>

      {/* Currency Conversion Display */}
      <div className="currency-display" style={{
        backgroundColor: '#f0f8ff',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        fontSize: '13px',
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e8f5e9 100%)',
        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>💵 USD Amount</span>
            <strong style={{ fontSize: '1.3rem', color: '#1976D2' }}>${cart.totalPrice.toFixed(2)}</strong>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>₱ PHP Amount</span>
            <strong style={{ fontSize: '1.3rem', color: '#2196F3' }}>₱{phpAmount}</strong>
          </div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.75rem', textAlign: 'center', opacity: 0.8 }}>
          💱 Exchange Rate: 1 USD = <strong style={{color: '#1976D2'}}>₱{exchangeRate.toFixed(2)}</strong>
        </div>
      </div>

      <button type="submit" className="pay-btn gcash-btn" disabled={loading}>
        {loading ? '⏳ Processing...' : `✓ Create Order & Pay ₱${phpAmount}`}
      </button>
    </form>
  );
};

/**
 * PayMongo Payment Form (Universal - GCash, Cards, PayMaya)
 */
const PayMongoPaymentForm = ({ shippingData, exchangeRate = 56.5, paymentMethod = 'gcash', onSuccess }) => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Calculate PHP amount using current exchange rate
  const phpAmount = (cart.totalPrice * exchangeRate).toFixed(2);

  const methodLabels = {
    gcash: 'GCash',
    card: 'Credit/Debit Card',
    paymaya: 'PayMaya',
  };

  const handlePayMongoPayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate shipping data
      if (!shippingData.firstName || !shippingData.lastName || !shippingData.email || !shippingData.phone || !shippingData.address) {
        setError('Please fill in all required shipping information');
        setLoading(false);
        return;
      }

      console.log('Creating PayMongo payment intent for:', paymentMethod);

      const response = await paymentsAPI.createPayMongoPaymentIntent({
        items: cart.items,
        shippingAddress: shippingData,
        totalAmount: cart.totalPrice,
        paymentMethod: paymentMethod,
      });

      const { paymentIntentId, clientKey, referenceId, nextAction, redirectUrl, status } = response.data.data;

      console.log('PayMongo payment intent created:', {
        paymentIntentId,
        status,
        nextAction,
        redirectUrl,
        fullResponse: response.data.data,
      });

      // Store payment info in localStorage
      localStorage.setItem('paymongo_payment_intent_id', paymentIntentId);
      localStorage.setItem('paymongo_client_key', clientKey);
      localStorage.setItem('paymongo_reference_id', referenceId);
      localStorage.setItem('paymongo_payment_method', paymentMethod);

      // Show success message
      const successMsg = `✅ Order created! Opening ${methodLabels[paymentMethod]} payment...`;
      document.querySelector('.payment-form-container')?.insertAdjacentHTML(
        'beforeend',
        `<div class="success-message" style="margin: 1rem 0; padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; color: #155724;">${successMsg}</div>`
      );

      // Redirect to payment
      let targetUrl = null;

      // Priority 1: Direct redirect URL from backend
      if (redirectUrl) {
        targetUrl = redirectUrl;
        console.log('Using backend redirectUrl:', targetUrl);
      }
      // Priority 2: NextAction redirect URL from PayMongo
      else if (nextAction && nextAction.redirect_url) {
        targetUrl = nextAction.redirect_url;
        console.log('Using nextAction.redirect_url:', targetUrl);
      }
      // Priority 3: NextAction URL
      else if (nextAction && nextAction.url) {
        targetUrl = nextAction.url;
        console.log('Using nextAction.url:', targetUrl);
      }
      // Fallback: Success page
      else {
        targetUrl = `/checkout/success?paymentIntentId=${paymentIntentId}&referenceId=${referenceId}&method=${paymentMethod}`;
        console.log('Using fallback success URL:', targetUrl);
      }

      // Redirect to target URL
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || `${methodLabels[paymentMethod]} payment processing failed. Please try again.`);
      console.error('PayMongo payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayMongoPayment} className="checkout-form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <p className="payment-info" style={{ lineHeight: '1.8', fontSize: '14px' }}>
          <strong>🔒 Secure payment via PayMongo</strong><br/>
          <small style={{color: '#666'}}>Payment method: {methodLabels[paymentMethod]}</small>
        </p>
      </div>

      {/* Currency Conversion Display */}
      <div className="currency-display" style={{
        backgroundColor: '#f0f8ff',
        border: '2px solid #FF5126',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        fontSize: '13px',
        background: 'linear-gradient(135deg, #fff8f5 0%, #ffe8e0 100%)',
        boxShadow: '0 2px 8px rgba(255, 81, 38, 0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>💵 USD Amount</span>
            <strong style={{ fontSize: '1.3rem', color: '#FF5126' }}>${cart.totalPrice.toFixed(2)}</strong>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>₱ PHP Amount</span>
            <strong style={{ fontSize: '1.3rem', color: '#FF5126' }}>₱{phpAmount}</strong>
          </div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.75rem', textAlign: 'center', opacity: 0.8 }}>
          💱 Exchange Rate: 1 USD = <strong style={{color: '#FF5126'}}>₱{exchangeRate.toFixed(2)}</strong>
        </div>
      </div>

      <button type="submit" className="pay-btn paymongo-btn" disabled={loading}>
        {loading ? '⏳ Processing...' : `✓ Pay with ${methodLabels[paymentMethod]} - ₱${phpAmount}`}
      </button>
    </form>
  );
};

/**
 * Stripe Checkout Form
 */
const CheckoutForm = ({ shippingData, exchangeRate = 56.5, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Calculate PHP amount for reference
  const phpAmount = (cart.totalPrice * exchangeRate).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements) {
      setError('Stripe is not loaded. Please refresh the page.');
      return;
    }

    // Validate shipping data
    if (!shippingData.firstName || !shippingData.lastName || !shippingData.email || !shippingData.phone || !shippingData.address) {
      setError('Please fill in all required shipping information');
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const sessionResponse = await paymentsAPI.createCheckoutSession({
        items: cart.items,
        shippingAddress: shippingData,
      });

      // Redirect to Stripe checkout
      const { sessionId } = sessionResponse.data.data;
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
      console.error('Stripe payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {/* Currency Display for Stripe */}
      <div className="currency-display" style={{
        backgroundColor: '#f0f8ff',
        border: '2px solid #2196F3',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        fontSize: '13px',
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%)',
        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>💳 USD Amount</span>
            <strong style={{ fontSize: '1.3rem', color: '#1976D2' }}>${cart.totalPrice.toFixed(2)}</strong>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>📊 Reference (PHP)</span>
            <strong style={{ fontSize: '1.1rem', color: '#999' }}>≈ ₱{phpAmount}</strong>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#1565c0', textAlign: 'center', fontWeight: '500' }}>
          🔒 Secure Stripe Payment | 💱 Exchange: 1 USD = ₱{exchangeRate.toFixed(2)}
        </div>
      </div>

      <button type="submit" className="pay-btn stripe-btn" disabled={!stripe || loading}>
        {loading ? '⏳ Processing...' : `✓ Pay $${cart.totalPrice.toFixed(2)}`}
      </button>
    </form>
  );
};

/**
 * Main Checkout Page
 */
const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [exchangeRate, setExchangeRate] = useState(56.5);
  const [loadingRate, setLoadingRate] = useState(true);
  const [rateError, setRateError] = useState('');
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines',
  });

  // Fetch real-time exchange rate on component load
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        setLoadingRate(true);
        const response = await paymentsAPI.getExchangeRate();
        const rate = response.data.data.rate;
        setExchangeRate(rate);
        setRateError('');
        console.log('Exchange rate fetched successfully:', rate);
      } catch (err) {
        console.warn('Failed to fetch live exchange rate, using default:', err);
        setExchangeRate(56.5); // Default fallback
        setRateError('Using default exchange rate (1 USD = ₱56.50)');
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, []);

  // Auto-fill form with user data
  useEffect(() => {
    if (user) {
      setShippingData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || 'Philippines',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseProfileInfo = () => {
    if (user) {
      setShippingData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || 'Philippines',
      });
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  console.log('Rendering Checkout - User:', user.email, 'Cart items:', cart.items.length, 'Selected payment method:', paymentMethod);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Checkout</h1>

        <div className="checkout-content">
          {/* Shipping Information */}
          <div className="shipping-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Shipping Address</h2>
              <button 
                type="button" 
                onClick={handleUseProfileInfo}
                className="use-profile-btn"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.3s'
                }}
              >
                ✓ Use My Profile
              </button>
            </div>
            <form className="shipping-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={shippingData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={shippingData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={shippingData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={shippingData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={shippingData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={shippingData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={shippingData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Payment Section */}
          <div className="payment-section">
            <h2>Payment Method</h2>

            {/* Exchange Rate Display */}
            <div style={{
              backgroundColor: loadingRate ? '#fff3cd' : '#d4edda',
              border: loadingRate ? '2px solid #ffc107' : '2px solid #28a745',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              boxShadow: loadingRate ? '0 2px 8px rgba(255, 193, 7, 0.1)' : '0 2px 8px rgba(40, 167, 69, 0.1)'
            }}>
              {loadingRate ? (
                <div style={{ color: '#856404', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⏳</span> Loading live exchange rate...
                </div>
              ) : (
                <>
                  <div style={{ color: '#155724', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span>✓ Live Exchange Rate:</span> <strong style={{ fontSize: '1.1rem' }}>1 USD = ₱{exchangeRate.toFixed(2)}</strong>
                  </div>
                  {rateError && <div style={{color: '#ff9800', marginTop: '0.25rem', fontSize: '0.85rem'}}>⚠️ {rateError}</div>}
                </>
              )}
            </div>
            
            {/* Payment Method Selection  - Simple and Clear */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1rem', fontWeight: '600' }}>🔒 Select Payment Method</h3>
              
              {/* Option 1: Stripe */}
              <div 
                onClick={() => setPaymentMethod('stripe')}
                style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: paymentMethod === 'stripe' ? '2px solid #635bff' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === 'stripe' ? '#f0f4ff' : '#fff',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: paymentMethod === 'stripe' ? '#635bff' : '#ddd', backgroundColor: paymentMethod === 'stripe' ? '#635bff' : 'transparent' }}>
                      {paymentMethod === 'stripe' && <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333', fontSize: '1rem' }}>💳 Stripe Payment</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Credit/Debit Card (Visa, Mastercard, Amex)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: GCash */}
              <div 
                onClick={() => setPaymentMethod('gcash')}
                style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: paymentMethod === 'gcash' ? '2px solid #0066cc' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === 'gcash' ? '#f0f8ff' : '#fff',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: paymentMethod === 'gcash' ? '#0066cc' : '#ddd', backgroundColor: paymentMethod === 'gcash' ? '#0066cc' : 'transparent' }}>
                      {paymentMethod === 'gcash' && <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333', fontSize: '1rem' }}>📱 GCash Wallet</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Philippine e-wallet (Powered by PayMongo)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: PayMaya */}
              <div 
                onClick={() => setPaymentMethod('paymaya')}
                style={{
                  padding: '1rem',
                  border: paymentMethod === 'paymaya' ? '2px solid #FF5126' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === 'paymaya' ? '#fff5f0' : '#fff',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: paymentMethod === 'paymaya' ? '#FF5126' : '#ddd', backgroundColor: paymentMethod === 'paymaya' ? '#FF5126' : 'transparent' }}>
                      {paymentMethod === 'paymaya' && <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333', fontSize: '1rem' }}>🔐 PayMaya</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Digital Wallet Payment (Powered by PayMongo)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Forms */}
            <div className="payment-form-container">
              {/* Stripe Payment Form */}
              {paymentMethod === 'stripe' && stripePromise && (
                <Elements stripe={stripePromise}>
                  <CheckoutForm shippingData={shippingData} exchangeRate={exchangeRate} onSuccess={() => navigate('/orders')} />
                </Elements>
              )}

              {/* PayMongo Payment Form (GCash) */}
              {paymentMethod === 'gcash' && (
                <PayMongoPaymentForm 
                  shippingData={shippingData} 
                  exchangeRate={exchangeRate} 
                  paymentMethod="gcash"
                  onSuccess={() => navigate('/orders')} 
                />
              )}

              {/* PayMongo Payment Form (PayMaya) */}
              {paymentMethod === 'paymaya' && (
                <PayMongoPaymentForm 
                  shippingData={shippingData} 
                  exchangeRate={exchangeRate} 
                  paymentMethod="paymaya"
                  onSuccess={() => navigate('/orders')} 
                />
              )}

              {/* Fallback if no payment method is selected */}
              {!paymentMethod && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  color: '#856404',
                  textAlign: 'center'
                }}>
                  <p>⏳ Please select a payment method above to continue</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cart.items.map((item) => (
              <div key={`${item.productId._id}-${item.size}-${item.color}`} className="summary-item">
                <img 
                  src={item.productId.image || 'https://via.placeholder.com/80'} 
                  alt={item.productId.name}
                  className="summary-item-image"
                />
                <div className="summary-item-details">
                  <span className="summary-item-name">{item.productId.name}</span>
                  <span className="summary-item-specs">Size: {item.size} | Color: {item.color}</span>
                  <span className="summary-item-qty">Qty: {item.quantity}</span>
                </div>
                <span className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${cart.totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="summary-row">
              <span>Exchange Rate:</span>
              <span>1 USD = ₱{exchangeRate.toFixed(2)}</span>
            </div>
            <div className="summary-row" style={{ backgroundColor: '#f0f8ff', padding: '8px', borderRadius: '4px' }}>
              <span>PHP Equivalent:</span>
              <span style={{ color: '#2196F3', fontWeight: '600' }}>₱{(cart.totalPrice * exchangeRate).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total (USD):</span>
              <span>${cart.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
