import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import MobileFilter from './MobileFilter';
import LoginPage from './LoginPage';

const App = () => {
  const [userID, setUserID] = useState(localStorage.getItem('userID'));

  const handleLogout = () => {
    localStorage.removeItem('userID');
    setUserID(null);
  };

  return userID ? (
    <>
      <div style={{ padding: '10px 20px', background: '#f1f1f1', textAlign: 'right' }}>
        <span style={{ marginRight: '10px' }}>Welcome, <b>{userID}</b></span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
      <MobileFilter userID={userID} />
    </>
  ) : (
    <LoginPage onLogin={setUserID} />
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
