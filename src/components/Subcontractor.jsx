import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './design.css';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import { app } from '../firebase';
import { Link } from 'react-router-dom';
import { database } from '../firebase';
import _debounce from 'lodash/debounce';
import {
  getDatabase,
  get,
  onValue,
  push,
  ref,
  off, 
  set,// Fix: Remove the duplicated import
} from 'firebase/database';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';

const Subcontractor = () => {

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

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [subcontractorName, setSubcontractorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const projectsRef = ref(database, 'projects');

    const fetchProjects = () => {
      onValue(projectsRef, (snapshot) => {
        const projectList = [];
        snapshot.forEach((childSnapshot) => {
          const projectData = childSnapshot.val();
          projectList.push({
            id: childSnapshot.key,
            projectName: projectData.projectName,
          });
        });
        setProjects(projectList);
      });
    };

    fetchProjects();

    return () => {
      off(projectsRef);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate the form data here if needed
  
    // Push data to the Firebase database
    const invoicesRef = ref(database, 'invoices');
    const newInvoiceRef = push(invoicesRef);
  
    // Fetch the project name based on the selectedProject ID
    const projectRef = ref(database, `projects/${selectedProject}`);
    const projectSnapshot = await get(projectRef);
    const projectName = projectSnapshot.val().projectName;
  
    // Set data in the newInvoiceRef
    set(newInvoiceRef, {
      subcontractorName,
      projectName, // Use the project name here
      invoiceNumber,
      invoiceDate,
      amountDue,
      paymentDueDate,
      notes,
    });
  
    // Optionally, you can clear the form fields after submission
    setSubcontractorName('');
    setSelectedProject('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setAmountDue('');
    setPaymentDueDate('');
    setNotes('');
  };

  const formatPriceMember = (expensePrice) => {
    // Remove existing commas and then add commas to the price input
    return expensePrice.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const [invoicesData, setInvoicesData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const invoicesRef = ref(db, 'invoices'); // Replace 'invoices' with your actual database reference
      onValue(invoicesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const invoicesArray = Object.keys(data).map((key) => ({ ...data[key], _id: key }));
          setInvoicesData(invoicesArray);
        }
      });
    };

    fetchData();

    return () => {
      // Cleanup function if needed
      // e.g., off(invoicesRef, 'value', callback);
    };
  }, [location]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };



  const [activeTab, setActiveTab] = useState('#SubmitInvoice');

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
              data-tab-target="#SubmitInvoice"
              className={activeTab === "#SubmitInvoice" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#SubmitInvoice")}
            >
              Submit Invoice
            </li>

            <li
              data-tab-target="#InvoiceStatus"
              className={activeTab === "#InvoiceStatus" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#InvoiceStatus")}
            >
              Invoice Status
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
     {activeTab === "#SubmitInvoice" && (
            <div className='dashboard'>
              {/* Add your content for the Dashboard tab here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Submit Invoice</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
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
                          <form id="submitinvoice" onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="subcontractorName" className="form-label">Subcontractor Name</label>
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      className="form-control"
                                      id="subcontractorName"
                                      required
                                      value={subcontractorName}
                                      onChange={(e) => setSubcontractorName(e.target.value)}
                                    />
                                </div>
                                <hr />
                                <label htmlFor="projectSelect" className="form-label">
                                    Select Project
                                  </label>
                                  <select
                                    className="form-select"
                                    id="projectSelect"
                                    name="projectName"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                  >
                                    <option  selected>
                                      Select a Project
                                    </option>
                                    {projects.map((project) => (
                                      <option key={project.id} value={project.id}>
                                        {project.projectName}
                                      </option>
                                    ))}
                                  </select>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="invoiceNumber" className="form-label">Invoice Number</label>
                                    <input
                                      type="number"
                                      autoComplete="off"
                                      className="form-control"
                                      id="invoiceNumber"
                                      required
                                      value={invoiceNumber}
                                      onChange={(e) => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="invoiceDate" className="form-label">Invoice Date</label>
                                    <input
                                      type="date"
                                      autoComplete="off"
                                      className="form-control"
                                      id="invoiceDate"
                                      required
                                      value={invoiceDate}
                                      onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="amountDue" className="form-label">Amount Due</label>
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      className="form-control"
                                      id="amountDue"
                                      required
                                      value={amountDue}
                                      onChange={(e) => setAmountDue(formatPriceMember(e.target.value))}
                                    />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="paymentDueDate" className="form-label">Payment Due Date</label>
                                    <input
                                      type="date"
                                      autoComplete="off"
                                      className="form-control"
                                      id="paymentDueDate"
                                      required
                                      value={paymentDueDate}
                                      onChange={(e) => setPaymentDueDate(e.target.value)}
                                    />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="notes" className="form-label">Notes</label>
                                    <textarea className="form-control" id="notes" rows={3} value={notes} onChange={(e)=> setNotes(e.target.value)} />
                                </div>
                                <hr />
                                <button type="submit" className="btn btn-outline-secondary">Submit</button>
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

        {activeTab === "#InvoiceStatus" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Invoice Status</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
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
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Invoice No.</th>
                                <th>Amount Due</th>
                                <th>Payment Due</th>
                                <th>Project Name</th>
                                <th>Subcontractor</th>
                                <th>Notes</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoicesData.map((invoice) => (
                                <tr key={invoice._id}>
                                  <td>{invoice.invoiceNumber}</td>
                                  <td>{invoice.invoiceDate}</td>
                                  <td>{invoice.paymentDueDate}</td>
                                  <td>{invoice.projectName}</td>
                                  <td>{invoice.subcontractorName}</td>
                                  <td>{invoice.notes}</td>
                                  <td>{invoice.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}
  
    </div>
    </div>
  </div>
  );
};

export default Subcontractor;
