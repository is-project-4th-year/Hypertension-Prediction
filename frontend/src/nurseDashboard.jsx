// src/components/NurseDashboard.js
import React, { useState, useEffect } from 'react';
import PatientList from './patientList';
import VitalSignsModal from './vitalSignsModal';
//import MedicationSchedule from './MedicationSchedule';
import QuickActions from './QuickActions';
import StatsCards from './StatsCards';
import './NurseDashboard.css';
  import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NurseDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);


axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8081';

  useEffect(() => {
    fetchPatients();
    fetchTodaysTasks();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/viewPatients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };
const handleLogout = () => {
  axios.post('/logout', {}, { withCredentials: true })
    .then(() => {
      console.log('Logged out successfully');
      window.location.href = '/login';
    })
    .catch(error => {
      console.error('Logout error:', error);
      // Still redirect to login
      window.location.href = '/login';
    });
};
  const fetchTodaysTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/nurse/tasks');
      const data = await response.json();
      // Handle tasks data
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleVitalSigns = (patient) => {
    setSelectedPatient(patient);
    setShowVitalSignsModal(true);
  };

  const handleUpdateVitalSigns = async (vitalData) => {
    try {
      const response = await fetch('http://localhost:5000/api/nurse/vital-signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.patient_id,
          ...vitalData
        }),
      });

      if (response.ok) {
        alert('Vital signs updated successfully!');
        setShowVitalSignsModal(false);
        fetchPatients(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating vital signs:', error);
      alert('Error updating vital signs');
    }
  };

  const handleMedicationAdministered = async (medicationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/nurse/medications/${medicationId}/administer`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Medication marked as administered!');
        fetchTodaysTasks();
      }
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  return (
    <div className="nurse-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <i className="fas fa-user-nurse"></i>
          <h1>Shinikizua</h1>
        </div>
        <ul className="nav-links">
          <li>
            <a 
              href="#overview" 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </a>
          </li>
          <li>
            <a 
              href="#patients" 
              className={activeTab === 'patients' ? 'active' : ''}
              onClick={() => setActiveTab('patients')}
            >
              <i className="fas fa-user-injured"></i>
              <span>Patients</span>
            </a>
          </li>
          {/* <li>
            <a 
              href="#medications" 
              className={activeTab === 'medications' ? 'active' : ''}
              onClick={() => setActiveTab('medications')}
            >
              <i className="fas fa-pills"></i>
              <span>Medications</span>
            </a>
          </li> */}
          {/* <li>
            <a 
              href="#tasks" 
              className={activeTab === 'tasks' ? 'active' : ''}
              onClick={() => setActiveTab('tasks')}
            >
              <i className="fas fa-tasks"></i>
              <span>Tasks</span>
            </a>
          </li> */}
           <li>
            <a href="#inpatients" className={activeTab === 'inpatients' ? 'active' : ''}
               onClick={() => setActiveTab('inpatients')}>
              <i className="fas fa-procedures"></i>
              <span>In-Patients</span>
            </a>
          </li>
          <li>
            <a href="#vitals" className={activeTab === 'vitals' ? 'active' : ''}
               onClick={() => setActiveTab('vitals')}>
              <i className="fas fa-heartbeat"></i>
              <span>Vital Signs</span>
            </a>
          </li>
           <li>
            <a 
              href="#logout" 
              className={activeTab === 'patients' ? 'active' : ''}
              onClick={() => handleLogout()}
            >
              <i className="fas fa-right-to-bracket"></i> 
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </div>

      
      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div className="welcome-section">
            <h2>Welcome, Nurse!</h2>
            <p>Ready for your shift?</p>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user-nurse"></i>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="card">
                <div className="card-header">
                  <h3>Recent Patients</h3>
                </div>
                {/* PatientList now handles its own data fetching */}
                <PatientList compact={false} showActions={true} />
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="patients-tab">
              {/* Full patient list - self-contained */}
              <PatientList compact={false} showActions={true} />
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="vitals-tab">
              <div className="card">
                <div className="card-header">
                  <h3>Vital Signs Recording</h3>
                </div>
                <div className="card-body">
                  <p>Select a patient from the Patients tab to record vital signs.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;