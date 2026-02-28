import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Initialize Facebook SDK
  useEffect(() => {
    if (facebookAppId) {
      // Initialize Facebook SDK
      window.fbAsyncInit = function () {
        FB.init({
          appId: facebookAppId,
          xfbml: true,
          version: 'v18.0',
        });
      };

      // Load Facebook SDK script
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [facebookAppId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      setRegistrationEmail(formData.email);
      setShowOTPForm(true);
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyRegistrationOTP({ email: registrationEmail, otp });
      const { user, token } = response.data.data;
      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('OTP verification error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'OTP verification failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');

      if (!credentialResponse.credential) {
        setError('No credential received from Google');
        setLoading(false);
        return;
      }

      const jwt = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      console.log('Google JWT decoded:', { googleId: jwt.sub, email: jwt.email, firstName: jwt.given_name });

      const payload = {
        googleId: jwt.sub,
        email: jwt.email,
        firstName: jwt.given_name || email.split('@')[0],
        lastName: jwt.family_name || '',
        profileImage: jwt.picture,
      };
      console.log('Sending to server:', payload);

      const response = await authAPI.googleLogin(payload);
      console.log('Server response:', response.data);

      const { user, token } = response.data.data;
      
      if (!user || !token) {
        throw new Error('Invalid response from server - missing user or token');
      }

      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Google signup error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      const errorMsg = err.response?.data?.message || err.message || 'Google signup failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSuccess = async (response) => {
    try {
      setLoading(true);
      setError('');

      if (!response.userID) {
        setError('Could not retrieve user ID from Facebook');
        setLoading(false);
        return;
      }

      // Email may not be available if not approved by Facebook
      if (!response.email) {
        setError('⚠️ Email permission not available. Please:\n1. Go to Facebook Developer Console for your app\n2. Add "email" permission in Facebook Login settings\n3. Or use Google signup / email+password signup');
        setLoading(false);
        return;
      }

      const payload = {
        facebookId: response.userID,
        email: response.email,
        firstName: response.first_name,
        lastName: response.last_name,
        picture: response.picture?.data?.url,
      };
      console.log('Sending Facebook data to server:', payload);

      const apiResponse = await authAPI.facebookLogin(payload);
      console.log('Facebook signup server response:', apiResponse.data);

      const { user, token } = apiResponse.data.data;

      if (!user || !token) {
        throw new Error('Invalid response from server - missing user or token');
      }

      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Facebook signup error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      const errorMsg = err.response?.data?.message || err.message || 'Facebook signup failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    FB.login(
      (response) => {
        if (response.authResponse) {
          // User logged in successfully, get user details
          FB.api(
            '/me',
            { fields: 'id,name,email,first_name,last_name,picture' },
            (userResponse) => {
              handleFacebookSuccess({
                userID: response.authResponse.userID,
                email: userResponse.email,
                first_name: userResponse.first_name,
                last_name: userResponse.last_name,
                picture: userResponse.picture,
              });
            }
          );
        } else {
          setError('Facebook login failed or was cancelled');
        }
      },
      { scope: 'public_profile,email' }
    );
  };
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{showOTPForm ? 'Verify Email' : 'Create Account'}</h1>

        {error && <div className="error-message">{error}</div>}

        {showOTPForm ? (
          <form onSubmit={handleOTPSubmit} className="auth-form">
            <p style={{ marginBottom: '20px', color: '#666' }}>
              We've sent a 6-digit OTP to <strong>{registrationEmail}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setShowOTPForm(false);
                setOtp('');
                setError('');
              }}
              style={{ marginTop: '10px', background: '#6c757d' }}
            >
              Back to Registration
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            {googleClientId && (
              <>
                <div className="divider">OR</div>

                <div className="social-login">
                  <div className="google-login">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        console.error('Google signup button error - check console');
                        setError('Google signup failed. Check browser console for details.');
                      }}
                      text="signup_with"
                    />
                  </div>

                  {facebookAppId && (
                    <button 
                      type="button" 
                      className="facebook-login-button"
                      onClick={handleFacebookLogin}
                      disabled={loading}
                    >
                      <i className="fab fa-facebook-f"></i>
                      {loading ? 'Signing up...' : 'Sign up with Facebook'}
                    </button>
                  )}
                </div>
              </>
            )}

            <p className="auth-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
