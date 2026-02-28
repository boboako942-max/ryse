import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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
      console.log('Attempting login with:', { email: email.toLowerCase() });
      const response = await authAPI.login({ email: email.toLowerCase(), password });
      console.log('Login response:', response);
      console.log('Response data:', response.data);
      
      // The response structure is: { success: true, message: "...", data: { user: {...}, token: "..." } }
      const { data } = response.data;
      
      if (!data || !data.user || !data.token) {
        console.error('Missing user or token. Response:', response.data);
        throw new Error('Missing user or token in response');
      }
      
      const { user, token } = data;
      console.log('Login successful, user:', user);
      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Login error full details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        err
      });
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
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
  };;

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
                <button 
                  type="button" 
                  className="facebook-login-button"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                >
                  <i className="fab fa-facebook-f"></i>
                  {loading ? 'Signing in...' : 'Sign in with Facebook'}
                </button>
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
