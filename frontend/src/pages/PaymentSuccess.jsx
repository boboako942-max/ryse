import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../services/api';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  const referenceId = searchParams.get('referenceId');
  const paymentIntentId = searchParams.get('paymentIntentId');
  const method = searchParams.get('method');

  // Verify payment immediately when component mounts
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        const response = await paymentsAPI.verifyPayMongoPayment({
          paymentIntentId,
          referenceId,
        });

        setPaymentStatus(response.data.data);
        setError(null);

        // If payment is succeeded, wait a moment then redirect to orders page
        if (response.data.data.status === 'succeeded') {
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err.response?.data?.message || 'Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    if (referenceId && paymentIntentId) {
      verifyPayment();
    }
  }, [referenceId, paymentIntentId, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', maxWidth: '500px', textAlign: 'center' }}>
        {loading ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
            <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>Processing Payment</h2>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>Please wait while we verify your {method} payment...</p>
          </>
        ) : error ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>Payment Failed</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>{error}</p>
            <button 
              onClick={() => navigate('/cart')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Back to Cart
            </button>
          </>
        ) : paymentStatus?.status === 'succeeded' ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#28a745', marginBottom: '0.5rem' }}>Payment Successful!</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Your order has been placed successfully. Redirecting to orders...</p>
            <div style={{ animation: 'pulse 1s infinite' }}>
              <p style={{ color: '#999', fontSize: '0.85rem' }}>Reference ID: {referenceId}</p>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
            <h2 style={{ color: '#ff9800', marginBottom: '0.5rem' }}>Payment Pending</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Your payment is being processed. Please wait or check your payment method.</p>
            <p style={{ color: '#999', fontSize: '0.85rem' }}>Status: {paymentStatus?.status || 'unknown'}</p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;
