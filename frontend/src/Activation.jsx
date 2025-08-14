import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Activation.css';

function Activation() {
    const { activationHash } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('activating');
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:8081/activate/${activationHash}`)
            .then(response => {
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('Your account has been successfully activated. You can now log in.');
                }
            })
            .catch(error => {
                setStatus('error');
                if (error.response && error.response.status === 404) {
                    setMessage('Activation link is invalid or has already been used.');
                } else {
                    setMessage('An error occurred while activating your account. Please try again later.');
                }
            });
    }, [activationHash]);

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    return (
        <div className="activation-container">
            <h1>Account Activation</h1>
            {status === 'activating' && <p>Activating your account...</p>}
            {status === 'success' && (
                <>
                    <p>{message}</p>
                    <button onClick={handleLoginRedirect}>Go to Login</button>
                </>
            )}
            {status === 'error' && <p>{message}</p>}
        </div>
    );
}

export default Activation;
