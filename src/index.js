import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import MobileFilter from "./MobileFilter";
import LoginPage from "./LoginPage";

const App = () => {
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [name, setName] = useState(localStorage.getItem("name"));

  const handleLogin = (uid, uname) => {
    localStorage.setItem("userID", uid);
    localStorage.setItem("name", uname);
    setUserID(uid);
    setName(uname);
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    localStorage.removeItem("name");
    setUserID(null);
    setName(null);
  };

  return userID ? (
    <>
      <div
        style={{
          padding: "10px 20px",
          background: "#f1f1f1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <span style={{ fontSize: "16px" }}>
          👋 Welcome, <b>{name || userID}</b>
        </span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Logout
        </button>
      </div>
      <MobileFilter userID={userID} />
    </>
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
