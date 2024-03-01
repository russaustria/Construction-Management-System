import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './design.css';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import { app } from '../firebase';
import { Link } from 'react-router-dom';
import { database} from '../firebase';
import _debounce from 'lodash/debounce';
import {
  getDatabase,
  onValue,
  ref,
  off, // Fix: Remove the duplicated import
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ConstructionSiteSupervisor = () => {

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

  const [projectList, setProjectList] = useState([]);
  const [formData, setFormData] = useState({
    projectName: "",
    projectDescription: "",
    budget: "",
    duration: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const projectsRef = ref(getDatabase(app), 'projects');

    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const projectsData = snapshot.val();
      const projectsArray = projectsData ? Object.values(projectsData) : [];
      setProjectList(projectsArray);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [toolsData, setToolsData] = useState([]);

  useEffect(() => {
    // Assuming 'tools' is the path to your data in the Firebase database
    const toolsRef = ref(database, 'tools');

    const fetchData = async () => {
      onValue(toolsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const toolsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setToolsData(toolsArray);
        }
      });
    };

    fetchData();

    // Cleanup listener when component unmounts
    return () => off(toolsRef);
  }, []);

  const [suppliersData, setSuppliersData] = useState([]);

  useEffect(() => {
    // Assuming 'suppliers' is the path to your data in the Firebase database
    const suppliersRef = ref(database, 'suppliers');

    const fetchData = async () => {
      onValue(suppliersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const suppliersArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setSuppliersData(suppliersArray);
        }
      });
    };

    fetchData();

    // Cleanup listener when component unmounts
    return () => off(suppliersRef);
  }, []);

  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [finishedProjectsCount, setFinishedProjectsCount] = useState(0);
  const [pendingProjectsCount, setPendingProjectsCount] = useState(0);

  const [users, setUsers] = useState([]);
  const [constructionTeamMembersCount, setConstructionTeamMembersCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [subcontractorsCount, setSubcontractorsCount] = useState(0);

  const [suppliersQuotes, setSuppliersQuotes] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [approvedInvoicesCount, setApprovedInvoicesCount] = useState(0);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);

  useEffect(() => {
    // Fetch projects
    const fetchProjects = async () => {
      const db = getDatabase(app);
      const projectsRef = ref(db, 'projects');

      onValue(projectsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const projectsArray = Object.values(data);
          setProjects(projectsArray);

          // Count finished and pending projects
          const finishedCount = projectsArray.filter((project) => project.status === 'Finished').length;
          const pendingCount = projectsArray.filter((project) => project.status === 'Pending').length;
          setFinishedProjectsCount(finishedCount);
          setPendingProjectsCount(pendingCount);
        }
      });
    };

    // Fetch users
    const fetchUsers = async () => {
      const db = getDatabase(app);
      const usersRef = ref(db, 'users');

      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const usersArray = Object.values(data);
          setUsers(usersArray);

          // Count construction team members, suppliers, and subcontractors
          const constructionTeamMembers = usersArray.filter(user => user.role === 'Construction Team Member').length;
          const suppliers = usersArray.filter(user => user.role === 'Supplier').length;
          const subcontractors = usersArray.filter(user => user.role === 'Subcontractor').length;

          setConstructionTeamMembersCount(constructionTeamMembers);
          setSuppliersCount(suppliers);
          setSubcontractorsCount(subcontractors);
        }
      });
    };

    // Fetch suppliers' quotes
    const fetchSuppliersQuotes = async () => {
      const db = getDatabase(app);
      const suppliersQuotesRef = ref(db, 'suppliersquotes');

      onValue(suppliersQuotesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const suppliersQuotesArray = Object.values(data);
          setSuppliersQuotes(suppliersQuotesArray);
        }
      });
    };

    // Fetch incident reports
    const fetchIncidentReports = async () => {
      const db = getDatabase(app);
      const incidentReportsRef = ref(db, 'incidentReports');

      onValue(incidentReportsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const incidentReportsArray = Object.values(data);
          setIncidentReports(incidentReportsArray);
        }
      });
    };

    // Fetch invoices
    const fetchInvoices = async () => {
      const db = getDatabase(app);
      const invoicesRef = ref(db, 'invoices');

      onValue(invoicesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const invoicesArray = Object.values(data);
          setInvoices(invoicesArray);

          // Count approved and pending invoices
          const approvedCount = invoicesArray.filter((invoice) => invoice.status === 'Approved').length;
          const pendingCount = invoicesArray.filter((invoice) => invoice.status === 'Pending').length;
          setApprovedInvoicesCount(approvedCount);
          setPendingInvoicesCount(pendingCount);
        }
      });
    };

    // Fetch data on component mount
    fetchProjects();
    fetchUsers();
    fetchSuppliersQuotes();
    fetchIncidentReports();
    fetchInvoices();

    // Cleanup the event listeners when component unmounts
    return () => {
      const db = getDatabase(app);
      const projectsRef = ref(db, 'projects');
      const usersRef = ref(db, 'users');
      const suppliersQuotesRef = ref(db, 'suppliersquotes');
      const incidentReportsRef = ref(db, 'incidentReports');
      const invoicesRef = ref(db, 'invoices');

      off(projectsRef);
      off(usersRef);
      off(suppliersQuotesRef);
      off(incidentReportsRef);
      off(invoicesRef);
    };
  }, []); 
  
  const [scheduledProjects, setScheduledProjects] = useState([]);

  useEffect(() => {
    // Fetch scheduled projects from Firebase Realtime Database
    const scheduledProjectsRef = ref(database, 'scheduledprojects');

    onValue(scheduledProjectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the object of objects to an array of objects
        const projectsArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setScheduledProjects(projectsArray);
      }
    });
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };






  const [activeTab, setActiveTab] = useState('#dashboard');

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
              data-tab-target="#dashboard"
              className={activeTab === "#dashboard" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#dashboard")}
            >
              Dashboard
            </li>


        <li
              data-tab-target="#projects"
              className={activeTab === "#projects" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#projects")}
            >
              Projects
            </li>

        <li
              data-tab-target="#tools"
              className={activeTab === "#tools" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#tools")}
            >
              Tools
            </li>

            <li
              data-tab-target="#Supplier"
              className={activeTab === "#Supplier" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#Supplier")}
            >
              Supplier
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
     {activeTab === "#dashboard" && (
            <div className='dashboard'>
              {/* Add your content for the Dashboard tab here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Dashboard</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                  </ul>
                </div>
              </nav>

              <div className="container-fluid px-4">
                <div className="row row-cols-1 row-cols-lg-2 row-cols-xl-5">
                  <div className="col mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Projects</p>
                        <h4 className="my-1"><span id="inProgressProjectCount">{projects.length}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Projects Finished</p>
                        <h4 className="my-1"><span id="completedProjectCount">{finishedProjectsCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Pending Projects</p>
                        <h4 className="my-1"><span id="onHoldProjectCount">{pendingProjectsCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Approved Invoice</p>
                        <h4 className="my-1"><span id="approvedInvoiceCount">{approvedInvoicesCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Submitted Proposal</p>
                        <h4 className="my-1"><span id="quoteCount">{suppliersQuotes.length}</span></h4>
                      </div>
                    </div>
                  </div>
                </div>
                {/*new row*/}
                <div className="row row-cols-1 row-cols-lg-2 row-cols-xl-5">
                  <div className="col mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Pending Invoice</p>
                        <h4 className="my-1"><span id="pendingInvoiceCount">{pendingInvoicesCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Team Members</p>
                        <h4 className="my-1"><span id="constructionTeamMemberCount">{constructionTeamMembersCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Suppliers</p>
                        <h4 className="my-1"><span id="supplierCount">{suppliersCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Subcontractors</p>
                        <h4 className="my-1"><span id="subcontractorCount">{subcontractorsCount}</span></h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="p-3 bg-white shadow-sm d-flex rounded justify-content-start">
                      <div className="d-flex flex-column align-items-start">
                        <p className="mb-0 text-secondary">Incidents Reported</p>
                        <h4 className="my-1"><span id="incidentCount">{incidentReports.length}</span></h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container">
                <div className="row row-cols-1 row-cols-lg-2">
                  {/* First Column */}
                  <div className="col mb-3 d-flex">
                    <div className="card radius- w-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div>
                            <h5 className="mb-0">Upcoming Projects</h5>
                          </div>
                        </div>
                        <hr />
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Project Name</th>
                              <th>Start Date</th>
                              <th>End Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scheduledProjects.map((project) => (
                              <tr key={project.id}>
                                <td>{project.projectName}</td>
                                <td>{project.startDate}</td>
                                <td>{project.endDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  {/* Second Column */}
                  <div className="col mb-3 d-flex">
                    <div className="card radius-10 w-100">
                      <div className="card-body">
                        <h5 className="mb-0">Project Budget</h5>
                        <hr />
                        <table className="table">
                            <thead>
                              <tr>
                                <th>Project Name</th>
                                <th>Budget</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectList.map((project) => (
                                <tr>
                                  <td>{project.projectName}</td>
                                  <td>{project.budget}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Third Column */}
                <div className="row">
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                        </div>
                        <table className="table">
                            <thead>
                              <tr>
                                <th>Project Name</th>
                                <th>Budget</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectList.map((project) => (
                                <tr>
                                  <td>{project.projectName}</td>
                                  <td>{project.budget}</td>
                                  <td>{project.startDate}</td>
                                  <td>{project.endDate}</td>
                                  <td>{project.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      </div>
                    </div>
                  </div>
                </div>
                <br />
              </div>



              {/* Add your dashboard content as needed */}
            </div>
          )}
          {activeTab === "#projects" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Projects</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

                  </ul>
                </div>
              </nav>
              <div className="row">
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div >
                          <div>
                         <table className="table">
                            <thead>
                              <tr>
                              <th>Project Name</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
                                <th>Budget</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectList.map((project) => (
                                <tr>
                                  <td>{project.projectName}</td>
                                  <td>{project.startDate}</td>
                                  <td>{project.endDate}</td>
                                  <td>{project.duration}</td>
                                  <td>{project.budget}</td>
                                  <td>{project.projectDescription}</td>
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
              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}

          {activeTab === "#tools" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Tools</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

                  </ul>
                </div>
              </nav>
              <div className="row">
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div >
                          <div>
                          <table className="table">
                              <thead>
                                <tr>
                                  <th>Supplier Name</th>
                                  <th>Tool Category</th>
                                  <th>Tool Description</th>
                                  <th>Tool Name</th>
                                  <th>Tool Price</th>
                                  <th>Tool Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {toolsData.map((tool) => (
                                  <tr key={tool.id}>
                                    <td>{tool.supplierName}</td>
                                    <td>{tool.toolCategory}</td>
                                    <td>{tool.toolDescription}</td>
                                    <td>{tool.toolName}</td>
                                    <td>{tool.toolPrice}</td>
                                    <td>{tool.toolStock}</td>
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

              
              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}

          {activeTab === "#Supplier" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Supplier</b></h1>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

                  </ul>
                </div>
              </nav>
              <div className="row">
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div >
                          <div>
                          <table className='table'>
                              <thead>
                                <tr>
                                  <th>Supplier Name</th>
                                  <th>Contact Person</th>
                                  <th>Email</th>
                                  <th>Phone Number</th>
                                  <th>Address</th>
                                  <th>City</th>
                                  <th>State</th>
                                  <th>Postal Code</th>
                                </tr>
                              </thead>
                              <tbody>
                                {suppliersData.map((supplier) => (
                                  <tr key={supplier.id}>
                                    <td>{supplier.supplierName}</td>
                                    <td>{supplier.contactPerson}</td>
                                    <td>{supplier.email}</td>
                                    <td>{supplier.phoneNumber}</td>
                                    <td>{supplier.address}</td>
                                    <td>{supplier.city}</td>
                                    <td>{supplier.state}</td>
                                    <td>{supplier.postalCode}</td>
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


              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}

    </div>
    </div>
  </div>
  );
};

export default ConstructionSiteSupervisor;
