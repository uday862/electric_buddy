import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import ToastContainer from '../Common/ToastContainer';
import { useToast } from '../../hooks/useToast';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);

    if (result.success) {
      showSuccess('Login successful!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      setError(result.message);
      showError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Left Side - Animated Graphic */}
      <div className="login-graphic-section">
        <div className="graphic-container">
          {/* Code snippets in background */}
          <div className="code-snippet code-snippet-1">
            <span className="code-keyword">const</span> work = [<span className="code-string">"Wiring"</span>, <span className="code-string">"Installation"</span>, <span className="code-string">"Repair"</span>];
          </div>
          <div className="code-snippet code-snippet-2">
            <span className="code-keyword">function</span> manageElectrical() {'{'}
            <br />
            &nbsp;&nbsp;<span className="code-keyword">return</span> quality;
            <br />
            {'}'}
          </div>

          {/* Dashed orbit paths */}
          <svg className="orbit-paths" width="600" height="600" viewBox="0 0 600 600">
            <circle cx="300" cy="300" r="220" fill="none" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
            <circle cx="300" cy="300" r="180" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
          </svg>

          {/* Rotating electrical icons around the person */}
          <div className="rotating-items">
            {/* Lightbulb Icon */}
            <div className="rotating-item item-1">
              <svg width="50" height="60" viewBox="0 0 50 60" className="tech-icon lightbulb">
                <path d="M25 5 C15 5, 7 13, 7 23 C7 28, 9 32, 12 35 L12 42 C12 44, 13 45, 15 45 L20 45 L20 50 C20 52, 21 53, 23 53 L27 53 C29 53, 30 52, 30 50 L30 45 L35 45 C37 45, 38 44, 38 42 L38 35 C41 32, 43 28, 43 23 C43 13, 35 5, 25 5 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
                <line x1="25" y1="35" x2="25" y2="42" stroke="#1f2937" strokeWidth="2" />
                <rect x="23" y="42" width="4" height="3" fill="#1f2937" />
              </svg>
            </div>

            {/* Electrical Plug Icon */}
            <div className="rotating-item item-2">
              <svg width="50" height="60" viewBox="0 0 50 60" className="tech-icon plug">
                <rect x="15" y="10" width="20" height="35" rx="3" fill="#3b82f6" stroke="#2563eb" strokeWidth="2" />
                <rect x="18" y="5" width="14" height="8" rx="2" fill="#3b82f6" stroke="#2563eb" strokeWidth="2" />
                <line x1="22" y1="25" x2="22" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="28" y1="25" x2="28" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="30" r="3" fill="#ef4444" />
                <circle cx="38" cy="30" r="3" fill="#ef4444" />
                <line x1="12" y1="30" x2="15" y2="30" stroke="#ef4444" strokeWidth="2" />
                <line x1="35" y1="30" x2="38" y2="30" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </div>

            {/* Wire/Cable Icon */}
            <div className="rotating-item item-3">
              <svg width="60" height="50" viewBox="0 0 60 50" className="tech-icon wire">
                <path d="M5 25 Q15 15, 25 25 T45 25" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M5 25 Q15 35, 25 25 T45 25" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" />
                <circle cx="5" cy="25" r="4" fill="#10b981" />
                <circle cx="55" cy="25" r="4" fill="#10b981" />
                <line x1="1" y1="25" x2="5" y2="25" stroke="#10b981" strokeWidth="3" />
                <line x1="55" y1="25" x2="59" y2="25" stroke="#10b981" strokeWidth="3" />
              </svg>
            </div>

            {/* Electrical Panel/Switchboard */}
            <div className="rotating-item item-4">
              <svg width="55" height="55" viewBox="0 0 55 55" className="tech-icon panel">
                <rect x="5" y="5" width="45" height="45" rx="3" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" />
                <rect x="10" y="10" width="12" height="8" rx="1" fill="#3b82f6" />
                <rect x="25" y="10" width="12" height="8" rx="1" fill="#3b82f6" />
                <rect x="10" y="22" width="12" height="8" rx="1" fill="#3b82f6" />
                <rect x="25" y="22" width="12" height="8" rx="1" fill="#3b82f6" />
                <rect x="10" y="34" width="12" height="8" rx="1" fill="#fbbf24" />
                <rect x="25" y="34" width="12" height="8" rx="1" fill="#3b82f6" />
                <circle cx="42" cy="14" r="2" fill="#10b981" />
                <circle cx="42" cy="26" r="2" fill="#10b981" />
                <circle cx="42" cy="38" r="2" fill="#ef4444" />
              </svg>
            </div>

            {/* Voltage/Energy Symbol */}
            <div className="rotating-item item-5">
              <svg width="50" height="50" viewBox="0 0 50 50" className="tech-icon voltage">
                <path d="M25 5 L35 25 L28 25 L32 45 L15 25 L22 25 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="25" cy="25" r="18" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
              </svg>
            </div>

            {/* Circuit/Wiring Diagram */}
            <div className="rotating-item item-6">
              <svg width="60" height="60" viewBox="0 0 60 60" className="tech-icon circuit">
                <circle cx="15" cy="15" r="5" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" />
                <circle cx="45" cy="15" r="5" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" />
                <circle cx="15" cy="45" r="5" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" />
                <circle cx="45" cy="45" r="5" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" />
                <circle cx="30" cy="30" r="6" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
                <line x1="20" y1="15" x2="24" y2="26" stroke="#8b5cf6" strokeWidth="2" />
                <line x1="36" y1="26" x2="40" y2="15" stroke="#8b5cf6" strokeWidth="2" />
                <line x1="20" y1="45" x2="24" y2="34" stroke="#8b5cf6" strokeWidth="2" />
                <line x1="36" y1="34" x2="40" y2="45" stroke="#8b5cf6" strokeWidth="2" />
                <line x1="15" y1="20" x2="15" y2="40" stroke="#8b5cf6" strokeWidth="2" />
                <line x1="45" y1="20" x2="45" y2="40" stroke="#8b5cf6" strokeWidth="2" />
              </svg>
            </div>

            {/* Switch/Toggle Icon */}
            <div className="rotating-item item-7">
              <svg width="45" height="50" viewBox="0 0 45 50" className="tech-icon switch">
                <rect x="5" y="15" width="35" height="20" rx="10" fill="#6366f1" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="15" cy="25" r="7" fill="white" />
                <line x1="5" y1="10" x2="5" y2="15" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <line x1="40" y1="10" x2="40" y2="15" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <line x1="5" y1="35" x2="5" y2="40" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <line x1="40" y1="35" x2="40" y2="40" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Central Electrician Illustration */}
          <div className="person-container">
            <svg width="280" height="320" viewBox="0 0 280 320" className="electrician-svg">
              {/* Head */}
              <circle cx="140" cy="80" r="50" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
              
              {/* Safety Helmet */}
              <ellipse cx="140" cy="65" rx="52" ry="25" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
              <ellipse cx="140" cy="60" rx="48" ry="20" fill="#fbbf24" opacity="0.3" />
              
              {/* Glasses */}
              <rect x="115" y="75" width="20" height="12" rx="2" fill="none" stroke="#1f2937" strokeWidth="2" />
              <rect x="145" y="75" width="20" height="12" rx="2" fill="none" stroke="#1f2937" strokeWidth="2" />
              <line x1="135" y1="81" x2="145" y2="81" stroke="#1f2937" strokeWidth="2" />
              
              {/* Smile */}
              <path d="M 120 95 Q 140 105, 160 95" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              
              {/* Body/Shirt */}
              <rect x="90" y="130" width="100" height="120" rx="15" fill="#1f2937" stroke="#3b82f6" strokeWidth="3" />
              
              {/* Tool Belt */}
              <rect x="85" y="230" width="110" height="20" rx="5" fill="#4b5563" stroke="#6b7280" strokeWidth="2" />
              <rect x="95" y="235" width="15" height="10" rx="2" fill="#fbbf24" />
              <rect x="115" y="235" width="15" height="10" rx="2" fill="#fbbf24" />
              <rect x="135" y="235" width="15" height="10" rx="2" fill="#fbbf24" />
              <rect x="170" y="235" width="15" height="10" rx="2" fill="#fbbf24" />
              
              {/* Electric Logo on Shirt */}
              <g transform="translate(140, 190)">
                <circle cx="0" cy="0" r="25" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <path d="M -15 -10 L 0 10 L 15 -10 M -10 -5 L 10 -5" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="-12" cy="-8" r="2" fill="#ef4444" />
                <circle cx="12" cy="-8" r="2" fill="#10b981" />
              </g>
              
              {/* Left Arm */}
              <ellipse cx="75" cy="180" rx="12" ry="50" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" transform="rotate(-25 75 180)" />
              {/* Left Hand holding tool */}
              <circle cx="60" cy="220" r="8" fill="#fbbf24" />
              <rect x="55" y="225" width="10" height="20" rx="2" fill="#3b82f6" transform="rotate(-25 60 235)" />
              
              {/* Right Arm */}
              <ellipse cx="205" cy="180" rx="12" ry="50" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" transform="rotate(25 205 180)" />
              {/* Right Hand holding wire */}
              <circle cx="220" cy="220" r="8" fill="#fbbf24" />
              <line x1="225" y1="220" x2="245" y2="210" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <circle cx="245" cy="210" r="5" fill="#ef4444" />
              
              {/* Legs */}
              <rect x="105" y="250" width="25" height="60" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="2" />
              <rect x="150" y="250" width="25" height="60" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="2" />
              
              {/* Boots */}
              <ellipse cx="117" cy="315" rx="18" ry="8" fill="#000000" />
              <ellipse cx="163" cy="315" rx="18" ry="8" fill="#000000" />
            </svg>
          </div>
        </div>

        {/* Electric Work Features */}
        <div className="course-features">
          <div className="feature-card">
            <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Professional Work</span>
          </div>
          <div className="feature-card">
            <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Quality Service</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-header">
            <div className="logo-container">
              <svg className="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h1 className="logo-text">Electric Buddy</h1>
            </div>
            <h2 className="login-title">Welcome Back!</h2>
            <p className="login-subtitle">Sign in to manage your electrical work</p>
        </div>

          <form className="login-form" onSubmit={handleSubmit}>
          {error && (
              <div className="error-message">
                <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              {error}
            </div>
          )}

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="form-input"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="icon" />
                  ) : (
                    <EyeIcon className="icon" />
                  )}
                </button>
            </div>
          </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <>
                  <svg className="spinner" fill="none" viewBox="0 0 24 24">
                    <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="login-footer">
              <p className="register-link-text">
                Admin registration only.{' '}
                <Link to="/register" className="register-link">
                  Register as Admin
                </Link>
              </p>
              <p className="register-link-text" style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                Customer accounts are created by administrators.
              </p>
            </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
