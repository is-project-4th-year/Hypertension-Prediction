import './style.css';
import { IoMail, IoLockClosed } from "react-icons/io5";
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8081';

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState("LOGIN"); // LOGIN | OTP
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [lvalues, setLValues] = useState({
    EmailAddress: '',
    Password: ''
  });

  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0); // seconds cooldown
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (step === "OTP" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Step 1: Login -> send OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post('/login', lvalues);
      if (res.data.Status === "OTP_REQUIRED") {
        setMessage("OTP sent to your email");
        setStep("OTP");
        setResendIn(30); // 30s cooldown for resend
      } else if (res.data.Status === "Success") {
        // (Edge-case) if backend ever skips OTP
        navigate('/');
      } else {
        setMessage(res.data.Message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error or server is down");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post('/verify-otp', {
        EmailAddress: lvalues.EmailAddress,
        otp
      });
      if (res.data.Status === "Success") {
        setMessage("Login successful");
        // Store something if you want
        // localStorage.setItem('userType', res.data.userType);
        navigate('/');
      } else {
        setMessage(res.data.Message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post('/resend-otp', { EmailAddress: lvalues.EmailAddress });
      if (res.data.Status === "OTP_REQUIRED") {
        setMessage("OTP resent to your email");
        setResendIn(30);
      } else {
        setMessage(res.data.Message || "Could not resend OTP");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error resending OTP");
    } finally {
      setLoading(false);
    }
  };

  // countdown for resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  return (
    <section>
      <div className="login-box">
        {/* Step 1: Login Form */}
        <form onSubmit={handleLogin} className={`form-step ${step === "LOGIN" ? "" : "hidden"}`}>
          <h2>Login</h2>

          <div className="input-box">
            <span className="icon">
              <IoMail />
            </span>
            <input
              type="email"
              required
              placeholder=" "
              value={lvalues.EmailAddress}
              onChange={(e) => setLValues({ ...lvalues, EmailAddress: e.target.value })}
            />
            <label>Email</label>
          </div>

          <div className="input-box">
            <span className="icon">
              <IoLockClosed />
            </span>
            <input
              type="password"
              required
              placeholder=" "
              value={lvalues.Password}
              onChange={(e) => setLValues({ ...lvalues, Password: e.target.value })}
            />
            <label>Password</label>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" name="remember" /> Remember Me
            </label>
            <span />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Login"}
          </button>

          <div className="register-link">
            <p>Don't have an account? <a href="/register">Register</a></p>
          </div>

          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>

        {/* Step 2: OTP Form */}
        <form onSubmit={handleVerifyOtp} className={`form-step ${step === "OTP" ? "" : "hidden"}`}>
          <h2>Enter OTP</h2>

          <div className="otp-box">
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="register-link" style={{ marginTop: 10 }}>
            <p>
              Didn’t get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || loading}
                style={{ width: "auto", padding: "4px 10px" }}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
              </button>
            </p>
          </div>

          <div className="register-link" style={{ marginTop: 10 }}>
            <p>
              <button
                type="button"
                onClick={() => { setStep("LOGIN"); setMessage(""); setOtp(""); }}
                style={{ width: "auto", padding: "4px 10px" }}
              >
                Back to Login
              </button>
            </p>
          </div>

          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>
      </div>
    </section>
  );
}
