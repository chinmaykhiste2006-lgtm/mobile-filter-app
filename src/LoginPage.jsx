import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

const LoginPage = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ name: "", userID: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remember, setRemember] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isSignUp && form.password !== form.confirm) {
      return setError("Passwords do not match");
    }

    try {
      if (isSignUp) {
        const res = await axios.post(`${API_BASE_URL}/register`, {
          name: form.name,
          userID: form.userID,
          password: form.password,
        });
        if (res.data.success) {
          setMessage("Account created successfully! Please log in.");
          setIsSignUp(false);
          setForm({ name: "", userID: "", password: "", confirm: "" });
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/login`, {
          userID: form.userID,
          password: form.password,
        });
        if (res.data.success) {
          localStorage.setItem("userID", form.userID);
          localStorage.setItem("name", res.data.name);
          onLogin(form.userID, res.data.name);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Tab Buttons */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setIsSignUp(false)}
            style={{
              ...styles.tabButton,
              backgroundColor: !isSignUp ? "#fff" : "transparent",
              fontWeight: !isSignUp ? "bold" : "normal",
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            style={{
              ...styles.tabButton,
              backgroundColor: isSignUp ? "#fff" : "transparent",
              fontWeight: isSignUp ? "bold" : "normal",
            }}
          >
            Sign Up
          </button>
        </div>

        <h3 style={styles.heading}>
          {isSignUp ? "Create an account" : "Welcome back"}
        </h3>
        <p style={styles.subtext}>
          {isSignUp
            ? "Enter your information to get started"
            : "Enter your credentials to access your account"}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </>
          )}

          <label style={styles.label}>User ID</label>
          <input
            type="text"
            name="userID"
            placeholder="you@example.com"
            value={form.userID}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            required
          />

          {isSignUp && (
            <>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirm"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </>
          )}

          {!isSignUp && (
            <div style={styles.row}>
              <label style={styles.remember}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{" "}
                Remember me
              </label>
              <a href="#" style={styles.forgot}>
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" style={styles.submitButton}>
            {isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={styles.divider}>
          <span>Or continue with</span>
        </div>

        <div style={styles.socialContainer}>
          <button style={styles.socialButton}>Google</button>
          <button style={styles.socialButton}>GitHub</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    width: "100%",
    background:
      "linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    padding: "40px 50px",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    width: "360px",
    textAlign: "center",
  },
  tabContainer: {
    display: "flex",
    backgroundColor: "#f2f2f2",
    borderRadius: "9999px",
    padding: "4px",
    marginBottom: "20px",
  },
  tabButton: {
    flex: 1,
    border: "none",
    padding: "10px 0",
    borderRadius: "9999px",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
  },
  heading: { margin: "10px 0 5px", fontSize: "20px" },
  subtext: { color: "#6c757d", fontSize: "13px", marginBottom: "15px" },
  label: {
    display: "block",
    textAlign: "left",
    marginTop: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginTop: "5px",
    marginBottom: "10px",
    fontSize: "14px",
    outline: "none",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#555",
  },
  remember: { cursor: "pointer" },
  forgot: { color: "#007bff", textDecoration: "none" },
  submitButton: {
    width: "100%",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "15px",
    fontWeight: "600",
  },
  divider: {
    marginTop: "20px",
    marginBottom: "10px",
    borderTop: "1px solid #e9ecef",
    fontSize: "12px",
    color: "#6c757d",
  },
  socialContainer: { display: "flex", justifyContent: "space-between", marginTop: "10px" },
  socialButton: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "8px 0",
    margin: "0 5px",
    cursor: "pointer",
    backgroundColor: "#fff",
  },
  error: { color: "#dc3545", marginTop: "10px", fontSize: "13px" },
  success: { color: "#28a745", marginTop: "10px", fontSize: "13px" },
};

export default LoginPage;
