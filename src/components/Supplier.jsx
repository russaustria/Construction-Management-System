import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './design.css';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import { app } from '../firebase';
import { Link } from 'react-router-dom';
import { database, storage } from '../firebase';
import _debounce from 'lodash/debounce';
import {
  push,
  ref,
} from 'firebase/database';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';

const Supplier = () => {

  const sidebarItemsRef = useRef([]);
  const openCloseBtnsRef = useRef([]);
  const sidebarRef = useRef(null);

  useEffect(() => {
    sidebarItemsRef.current = document.querySelectorAll('.sidebar ul li, .dropdown-content a');
    openCloseBtnsRef.current = document.querySelectorAll('.open-btn, .close-btn');
    sidebarRef.current = document.querySelector('.sidebar');

    const handleClick = _debounce((event) => {
      const target = event.target;
      const isTab = target.matches('.sidebar ul li') || target.matches('.dropdown-content a');

      if (isTab) {
        const activeItem = document.querySelector('.sidebar ul li.active, .dropdown-content a.active');

        if (activeItem) {
          activeItem.classList.remove('active');
        }

        target.classList.add('active');

        // Close the sidebar when a tab is selected
        sidebarRef.current.classList.remove('active');
      }

      if (target.matches('.open-btn, .close-btn')) {
        sidebarRef.current.classList.toggle('active');
      }
    }, 200); // Adjust the delay as needed

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const location = useLocation();
  const { userId, email, fullName, role } = location.state || {};

  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(logout, 30 * 60 * 1000); // 30 minutes in milliseconds
      setTimeoutId(newTimeoutId);
    };

    const logout = () => {
      // Implement logout logic here, e.g., redirect to the login page
      console.log('Session timeout. Logging out...');
    };

    // Attach event listeners to reset the timeout on user interaction
    const resetTimeoutOnUserInteraction = () => {
      resetTimeout();
      document.addEventListener('mousemove', resetTimeout);
      document.addEventListener('keypress', resetTimeout);
    };

    resetTimeoutOnUserInteraction();

    // Clear event listeners when the component is unmounted
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('mousemove', resetTimeout);
      document.removeEventListener('keypress', resetTimeout);
    };
  }, [timeoutId]);
  
  const [formData, setFormData] = useState({
    companyName: '',
    projectName: '',
    materials: '',
    equipment: '',
    price: '',
    services: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Push form data to the Firebase Realtime Database
    const databaseRef = ref(database, 'suppliersquotes');
    push(databaseRef, formData);

    // Clear the form after submission
    setFormData({
      companyName: '',
      projectName: '',
      materials: '',
      equipment: '',
      price: '',
      services: '',
    });
  };

  const formatPrice = (price) => {
    // Remove existing commas and then add commas to the price input
    return price.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    // If the input is the "price" field, format it with commas using the formatPriceMember function
    const formattedValue = name === 'price' ? formatPrice(value) : value;
  
    setFormData((prevData) => ({
      ...prevData,
      [name]: formattedValue,
    }));
  };
  
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };



  const [activeTab, setActiveTab] = useState('#Supplier');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
  

  return (
  <div className="d-flex" id="wrapper">

    <div className="sidebar" id="side_nav">
      <div className="header-box px-2 pt-3 pb-4 d-flex justify-content-between">
        <h1 className="logo-icon">
        <img src={logoImage} alt="" style={{ width: 200 }} />
        </h1>
        <button className="btn d-md-none d-block close-btn px-1 py-0 text-black">
          X
        </button>
      </div>
      <div className="list-group-item text-center bg-transparent">                    
        <h4>{fullName}</h4>
        <p>{role}</p>
      </div>

      <ul className="tabs">
      <li
              data-tab-target="#Supplier"
              className={activeTab === "#Supplier" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#Supplier")}
            >
              Submit Proposal
            </li>

            <li
            className="tablog logout-button"
            onClick={handleLogout} // Replace handleLogout with your actual logout function
            >
                <a className="nav-link second-text fw-bold" href="/Login" onclick={handleLogout}>
                    Logout
                </a>
            </li>
    </ul>

      {/* Close button for smaller screens */}
      <div className="close-btn-container d-md-none d-block">
      </div>
    </div>
    
    <div className="content">
     <div className="tab-content">
     {activeTab === "#Supplier" && (
            <div>
              {/* Add your content for the Dashboard tab here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Supplier</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                  <li className="nav-item dropdown">
                      <a className="nav-link second-text fw-bold" href="/Login" onclick={handleLogout}>
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </nav>

              <div className="row">
                <div className='adj'>
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div >
                          <div>
                          <form id="quoteForm" onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="companyName" className="form-label">Company Name:</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        className="form-control" 
                                        onChange={handleInputChange}
                                        // Other attributes...
                                      />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="projectName" className="form-label">Project Name:</label>
                                    <input
                                        type="text"
                                        name="projectName"
                                        value={formData.projectName}
                                        className="form-control" 
                                        onChange={handleInputChange}
                                        // Other attributes...
                                      />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="materials" className="form-label">Materials:</label>
                                    <textarea className="form-control" id="materials" autoComplete="off" name="materials" rows={3} required value={formData.materials} onChange={handleInputChange} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="equipment" className="form-label">Equipment:</label>
                                    <textarea className="form-control" id="equipment" autoComplete="off" name="equipment" rows={3} required value={formData.equipment} onChange={handleInputChange} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="price" className="form-label">Price:</label>
                                    <input type="text" className="form-control" autoComplete="off" id="price" name="price" required value={formData.price} onChange={handleInputChange} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="services" className="form-label">Services:</label>
                                    <textarea className="form-control" id="services" autoComplete="off" name="services" rows={3} required value={formData.services} onChange={handleInputChange} />
                                </div>
                                <hr />
                                <button type="submit" className="btn btn-outline-secondary">Submit Quote/Proposal</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Add your dashboard content as needed */}
            </div>
          )}
  
    </div>
    </div>
  </div>
  );
};

export default Supplier;
