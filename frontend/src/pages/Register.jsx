import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

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
      const { user, token } = response.data.data;
      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Registration failed';
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Create Account</h1>

        {error && <div className="error-message">{error}</div>}

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
                <div className="facebook-login">
                  <FacebookLogin
                    appId={facebookAppId}
                    autoLoad={false}
                    fields="name,picture,email"
                    scope="public_profile,email"
                    onClick={() => setLoading(true)}
                    callback={handleFacebookSuccess}
                    cssClass="facebook-login-button"
                    icon="fa-facebook-f"
                  />
                </div>
              )}
            </div>
          </>
        )}

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
