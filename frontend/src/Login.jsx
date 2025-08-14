import './style.css';
import { IoMail, IoLockClosed } from "react-icons/io5";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8081';

export default function Login() {
  const navigate = useNavigate();

  const [lvalues, setLValues] = useState({
    EmailAddress: '',
    Password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', lvalues);
      if (res.data.Status === "Success") {
        console.log('Successful Login', lvalues);
        // You can store user info here if needed
        navigate('/'); // Redirect after login
      } else {
        alert(res.data.Message || "Login failed");
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error or server is down');
    }
  };

  return (
    <section>
      <div className="login-box">
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>

          <div className="input-box">
            <span className="icon">
              <IoMail />
            </span>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder=" "
              value={lvalues.EmailAddress}
              onChange={(e) => setLValues({ ...lvalues, EmailAddress: e.target.value })}
            />
            <label htmlFor="email">Email</label>
          </div>

          <div className="input-box">
            <span className="icon">
              <IoLockClosed />
            </span>
            <input
              type="password"
              id="password"
              required
              placeholder=" "
              value={lvalues.Password}
              onChange={(e) => setLValues({ ...lvalues, Password: e.target.value })}
            />
            <label htmlFor="password">Password</label>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" name="remember" /> Remember Me
            </label>
            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit">Login</button>

          <div className="register-link">
            <p>
              Don't have an account? <a href="/register">Register</a>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
