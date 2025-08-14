import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaInfoCircle } from "react-icons/fa";
import './Register.css';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { DropdownButton, Dropdown } from 'react-bootstrap';


const Register = () => {
    return (
        <div className="wrapper">
            <div className="form-box Register">
                <Registration />
                <div className="register-link">
                    <p>Already have an account? <a href="/login">Login</a></p>
                </div>
                <div className='Guidelines'>
                <a>Password Guidelines</a>
                <ul>
                    <li>8 or more characters long</li>
                    <li>Contain at least one uppercase letter</li>
                <li>Contain at least one lowercase letter</li> 
                <li>Contain at least a special characters: @ # \ /</li>
                </ul>
                </div>
            </div>
        </div>
    );
}

function Registration() {
    const [rvalues, setRValues] = useState({
        EmailAddress: '',
        Password: '',
        RepeatPassword: ''
    });
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleDropdown = () => {
        setShowDropdown(prevState => !prevState); // Toggle the state
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      // Check if passwords match
      if (rvalues.Password.trim() !== rvalues.RepeatPassword.trim()) {
          setMessage('Passwords do not match');
          return;
      }
  
      // Check if password is at least eight characters long
      if (rvalues.Password.trim().length < 8) {
        setMessage('Password should be at least 8 characters ');
        return;
    }
  
    //   Check if email already exists
      axios.post('http://localhost:8081/check-email', { EmailAddress: rvalues.EmailAddress })
          .then(res => {
              if (res.data.exists) {
                  setMessage('Email already exists');
              } else {
                //   Proceed with registration
                  axios.post('http://localhost:8081/register', rvalues)
                      .then(res => {
                          if (res.data.Status === "Success") {
                              setSuccess(true);
                              setMessage('Registration successful! Please check your email to activate your account.');
                              setTimeout(() => {
                                  navigate('/login');
                              }, 3000); // Redirect after 3 seconds
                          } else {
                              setMessage('Client not registered!');
                          }
                      })
                      .catch(err => {
                          console.error(err);
                          setMessage('Error registering user. Please try again later.');
                      });
              }
          })
          .catch(err => {
              console.error(err);
              setMessage('Error checking email.');
          });
  };
  
  
  

    return (
        <div>
            {success ? (
                <div className="success-message">
                    <h1>{message}</h1>
                    <button onClick={() => navigate('/login')}>Go to Login</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <h1 style={{color:'white'}} className='Title'>Registration</h1>
                    <div className="input-box">
                        <input
                            type="email"
                            placeholder="Email"
                            value={rvalues.EmailAddress}
                            onChange={(e) => setRValues({ ...rvalues, EmailAddress: e.target.value })}
                            required
                        />
                        <FaEnvelope className="icon" />
                    </div>
                    <div className="input-box">
            <input
                type="password"
                placeholder="Password"
                value={rvalues.Password}
                onChange={(e) => setRValues({ ...rvalues, Password: e.target.value })}
                required
            />
            <FaLock className="password-icon" onClick={toggleDropdown} />
            {showDropdown && (
                <DropdownButton
                    id="dropdown-basic-button"
                    title={<FaInfoCircle />}
                    variant="info"
                    className="password-dropdown"
                >
                    <Dropdown.Item>Password guidelines:</Dropdown.Item>
                    <Dropdown.Item>8 or more characters long</Dropdown.Item>
                    <Dropdown.Item>Contain at least one uppercase letter</Dropdown.Item>
                    <Dropdown.Item>Contain at least one lowercase letter</Dropdown.Item>
                    <Dropdown.Item>Contain at least one of the following special characters: @ # \ /</Dropdown.Item>
                </DropdownButton>
            )}
        </div>
                    <div className="input-box">
                        <input
                            type="password"
                            placeholder="Repeat Password"
                            value={rvalues.RepeatPassword}
                            onChange={(e) => setRValues({ ...rvalues, RepeatPassword: e.target.value })}
                            required
                        />
                        <FaLock className="icon" />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" required />
                            I agree to the terms & conditions
                        </label>
                    </div>
                        
                    <button  type="submit">Submit</button>
                    {message && <div className="error-message">{message}</div>}
                </form>
            )}
        </div>
    );
}

export default Register;