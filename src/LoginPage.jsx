import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ userID: '', password: '' });
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const res = await axios.post(`${API_BASE_URL}/register`, form);
        if (res.data.success) {
          setMessage('Account created successfully! Please log in.');
          setIsSignUp(false);
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/login`, form);
        if (res.data.success) {
          localStorage.setItem('userID', form.userID);
          onLogin(form.userID);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>User ID</label>
          <input
            type="text"
            name="userID"
            value={form.userID}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter User ID"
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter Password"
          />
          <button type="submit" style={styles.button}>
            {isSignUp ? 'Create Account' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: 10 }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            style={styles.link}
          >
            {isSignUp ? 'Login here' : 'Sign up here'}
          </span>
        </p>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #007bff, #6610f2)',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px 50px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    width: '350px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    textAlign: 'left',
    marginTop: '10px',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  link: {
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default LoginPage;
