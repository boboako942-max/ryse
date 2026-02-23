import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login({ email: email.toLowerCase(), password });
      const { user, token } = response.data.data;
      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Login failed';
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

      // Decode JWT to get user info (in production, verify on backend)
      const jwt = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      console.log('Google JWT decoded:', { googleId: jwt.sub, email: jwt.email, firstName: jwt.given_name });

      const payload = {
        googleId: jwt.sub,
        email: jwt.email,
        firstName: jwt.given_name,
        lastName: jwt.family_name,
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
      console.error('Google login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      const errorMsg = err.response?.data?.message || err.message || 'Google login failed';
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
        setError('⚠️ Email permission not available. Please:\n1. Go to Facebook Developer Console for your app\n2. Add "email" permission in Facebook Login settings\n3. Or use Google login / email+password login');
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
      console.log('Facebook login server response:', apiResponse.data);

      const { user, token } = apiResponse.data.data;

      if (!user || !token) {
        throw new Error('Invalid response from server - missing user or token');
      }

      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Facebook login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      const errorMsg = err.response?.data?.message || err.message || 'Facebook login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Login to StyleHub</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
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
                    console.error('Google login button error - check console');
                    setError('Google login failed. Check browser console for details.');
                  }}
                  text="signin_with"
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
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
