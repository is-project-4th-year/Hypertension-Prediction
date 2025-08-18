import './style.css';
import { IoMail, IoLockClosed } from "react-icons/io5";
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8081';

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState("LOGIN"); 
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [lvalues, setLValues] = useState({
    EmailAddress: '',
    Password: ''
  });

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef(null);

  // Focus OTP field on step change
  useEffect(() => {
    if ((step === "OTP" || step === "RESET_VERIFY") && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // LOGIN flow
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await axios.post('/login', lvalues);
      if (res.data.Status === "OTP_REQUIRED") {
        setMessage("OTP sent to your email");
        setStep("OTP");
        setResendIn(30);
      } else if (res.data.Status === "Success") {
        navigate('/');
      } else {
        setMessage(res.data.Message || "Login failed");
      }
    } catch {
      setMessage("Network error or server is down");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await axios.post('/verify-otp', {
        EmailAddress: lvalues.EmailAddress,
        otp
      });
      if (res.data.Status === "Success") {
        navigate('/');
      } else {
        setMessage(res.data.Message || "Invalid OTP");
      }
    } catch {
      setMessage("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await axios.post('/verify-my-otp', {
        email: lvalues.EmailAddress,
        otp
      });
      if (res.data.Status === "Success") {
        setMessage(res.data.message || "OTP verified");
        setStep("RESET_PASSWORD");
      }else {
        setMessage(res.data.Message || "Invalid OTP");
      }
    } catch {
      setMessage("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setLoading(true); setMessage("");
    try {
      const res = await axios.post('/resend-otp', { EmailAddress: lvalues.EmailAddress });
      if (res.data.Status === "OTP_REQUIRED") {
        setMessage("OTP resent to your email");
        setResendIn(30);
      } else {
        setMessage(res.data.Message || "Could not resend OTP");
      }
    } catch {
      setMessage("Error resending OTP");
    } finally {
      setLoading(false);
    }
  };

  // OTP RESET FLOW
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await axios.post('/forgot-password-otp', { email: lvalues.EmailAddress });
      setMessage(res.data.message || "OTP sent to your email");
      setStep("RESET_VERIFY");
    } catch {
      setMessage("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await axios.post('/reset-password-otp', {
        email: lvalues.EmailAddress,
        otp,
        newPassword
      });
      setMessage(res.data.message || "Password reset successful");
      setStep("LOGIN");
    } catch {
      setMessage("Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  return (
    <section>
      <div className="login-box">
        
        {/* LOGIN */}
        <form onSubmit={handleLogin} className={`form-step ${step === "LOGIN" ? "" : "hidden"}`}>
          <h2>Login</h2>

          <div className="input-box">
            <span className="icon"><IoMail /></span>
            <input type="email" required placeholder=" " 
              value={lvalues.EmailAddress}
              onChange={e => setLValues({ ...lvalues, EmailAddress: e.target.value })} />
            <label>Email</label>
          </div>

          <div className="input-box">
            <span className="icon"><IoLockClosed /></span>
            <input type="password" required placeholder=" "
              value={lvalues.Password}
              onChange={e => setLValues({ ...lvalues, Password: e.target.value })} />
            <label>Password</label>
          </div>

          <div className="remember-forgot">
            <label><input type="checkbox" /> Remember Me</label>
            <span onClick={() => setStep("RESET_REQUEST")} style={{ cursor: "pointer", color: "#0af" }}>
              Forgot password?
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Login"}
          </button>

          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>

        {/* OTP LOGIN */}
        <form onSubmit={handleVerifyOtp} className={`form-step ${step === "OTP" ? "" : "hidden"}`}>
          <h2>Enter OTP</h2>
          <div className="otp-box">
            <input ref={otpInputRef} type="text" maxLength={6}
              autoComplete="one-time-code"
              placeholder="6-digit code" value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
          </div>
          <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
          <button type="button" onClick={handleResend} disabled={resendIn > 0 || loading}>
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
          </button>
          <button type="button" onClick={() => { setStep("LOGIN"); setMessage(""); }}>Back to Login</button>
          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>

        {/* RESET REQUEST */}
        <form onSubmit={handleRequestOTP} className={`form-step ${step === "RESET_REQUEST" ? "" : "hidden"}`}>
          <h2>Request Password Reset</h2>
          <div className="input-box">
            <span className="icon"><IoMail /></span>
            <input type="email" required placeholder=" "
              value={lvalues.EmailAddress}
              onChange={e => setLValues({ ...lvalues, EmailAddress: e.target.value })} />
            <label>Email</label>
          </div>
          <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
          <button type="button" onClick={() => setStep("LOGIN")}>Back to Login</button>
          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>

        {/* RESET VERIFY */}
        <form onSubmit={handleVerifyResetOtp} className={`form-step ${step === "RESET_VERIFY" ? "" : "hidden"}`}>
          <h2>Verify OTP</h2>
            <div className="input-box">
            <span className="icon"><IoMail /></span>
            <input type="email" required placeholder=" "
              
              value={lvalues.EmailAddress}
              onChange={e => setLValues({ ...lvalues, EmailAddress: e.target.value })} />
            <label>Email</label>
          </div>
          <div className="input-box">
            <span className="icon"><IoLockClosed /></span>
            <input ref={otpInputRef} type="text" required value={otp}
              onChange={e => setOtp(e.target.value)} autoComplete="one-time-code" />
            <label>Enter OTP</label>
          </div>
          <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
          <button type="button" onClick={() => setStep("RESET_REQUEST")}>Back</button>
          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>

        {/* RESET PASSWORD */}
        <form onSubmit={handleResetPassword} className={`form-step ${step === "RESET_PASSWORD" ? "" : "hidden"}`}>
          <h2>Reset Password</h2>
          <div className="input-box">
            <span className="icon"><IoLockClosed /></span>
            <input type="password" required value={newPassword}
              onChange={e => setNewPassword(e.target.value)} />
            <label>New Password</label>
          </div>
          <button type="submit" disabled={loading}>{loading ? "Updating..." : "Reset Password"}</button>
          <button type="button" onClick={() => setStep("LOGIN")}>Back to Login</button>
          {message && <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>}
        </form>

      </div>
    </section>
  );
}
