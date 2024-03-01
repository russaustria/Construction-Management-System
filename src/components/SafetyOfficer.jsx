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
  getDatabase,
  onValue,
  push,
  update,
  ref,
  off, // Fix: Remove the duplicated import
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
const SafetyOfficer = () => {

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
  
  
  const [incidentFormData, setIncidentFormData] = useState({
    reporterName: '',
    reporterContact: '',
    witnesses: '',
    location: '',
    description: '',
    incidentDate: '',
    actionsTaken: '',
  });

  const handleIncidentReportInputChange = (e) => {
    setIncidentFormData({ ...incidentFormData, [e.target.name]: e.target.value });
  };

  const handleIncidentReportSubmit = (e) => {
    e.preventDefault();
  
    // Replace 'incidentReports' with the appropriate path in your Firebase Realtime Database
    const reportsRef = ref(database, 'incidentReports');
  
    // Prepare data to push to Firebase
    const newReportData = {
      reporterName: incidentFormData.reporterName,
      reporterContact: incidentFormData.reporterContact,
      witnesses: incidentFormData.witnesses,
      location: incidentFormData.location,
      description: incidentFormData.description,
      incidentDate: incidentFormData.incidentDate,
      actionsTaken: incidentFormData.actionsTaken,
    };
  
    // Push data to Firebase
    push(reportsRef, newReportData)
      .then(() => {
        alert('Incident report submitted successfully!');
        // Optionally, reset the form after successful submission
        setIncidentFormData({
          reporterName: '',
          reporterContact: '',
          witnesses: '',
          location: '',
          description: '',
          incidentDate: '',
          actionsTaken: '',
        });
  
        // Corrected form reset: Added parentheses to the reset function
        document.getElementById("incidentForm").reset();
      })
      .catch((error) => {
        console.error('Error submitting incident report:', error);
      });
  };

  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionLocation, setInspectionLocation] = useState('');
  const [inspectionInspector, setInspectionInspector] = useState('');
  const [inspectionPhotos, setInspectionPhotos] = useState([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionSignature, setInspectionSignature] = useState('');

  const handleInspectionPhotosChange = (event) => {
    const selectedPhotos = Array.from(event.target.files);
    setInspectionPhotos(selectedPhotos);
  };

  const handleInspectionFormSubmit = async (event) => {
    event.preventDefault();

    const InspectiondatabaseRef = ref(database, 'inspections');

    const newInspectionRef = push(InspectiondatabaseRef, {
      date: inspectionDate,
      location: inspectionLocation,
      inspector: inspectionInspector,
      notes: inspectionNotes,
      signature: inspectionSignature,
    });

    const inspectionId = newInspectionRef.key;

    if (inspectionPhotos.length > 0) {
      await Promise.all(
        inspectionPhotos.map(async (photo, index) => {
          const storageReference = storageRef(
            storage,
            `inspections/${inspectionId}/photo${index + 1}.jpg`
          );
          await uploadBytes(storageReference, photo);
          const downloadURL = await getDownloadURL(storageReference);

          update(newInspectionRef, { [`photo${index + 1}URL`]: downloadURL });
        })
      );
      alert("Inspection Made Successfully!");
    }

    setInspectionDate('');
    setInspectionLocation('');
    setInspectionInspector('');
    setInspectionPhotos([]);
    setInspectionNotes('');
    setInspectionSignature('');
    document.getElementById('inspectionform').reset();
  };

  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inspectionsRef = ref(getDatabase(), 'inspections');
  
        // Set up a real-time listener for changes in the inspections node
        onValue(inspectionsRef, (snapshot) => {
          const data = [];
          snapshot.forEach((childSnapshot) => {
            data.push({ id: childSnapshot.key, ...childSnapshot.val() });
          });
          setInspections(data);
        });
      } catch (error) {
        console.error('Error fetching inspections:', error);
      }
    };
  
    fetchData();
  
    // Clean up the listener when the component is unmounted
    return () => {
      const inspectionsRef = ref(getDatabase(), 'inspections');
      off(inspectionsRef);
    };
  }, []);
  
  
  const [incidentReports, setIncidentReports] = useState([]);

  useEffect(() => {
    // Fetch incident reports from Firebase Realtime Database
    const incidentReportsRef = ref(database, 'incidentReports');

    onValue(incidentReportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the object of objects to an array of objects
        const reportsArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setIncidentReports(reportsArray);
      }
    });
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
  }, []); // Dependency array should be adjusted based on your specific dependencies

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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
            data-tab-target="#Projects"
            className={activeTab === "#Projects" ? "active tab" : "tab"}
            onClick={() => handleTabClick("#Projects")}
            >
            Projects
            </li>


            <li
            data-tab-target="#IncidentReporting"
            className={activeTab === "#IncidentReporting" ? "active tab" : "tab"}
            onClick={() => handleTabClick("#IncidentReporting")}
            >
            Incident Reporting
            </li>

            <li
              data-tab-target="#CreateInspection"
              className={activeTab === "#CreateInspection" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#CreateInspection")}
            >
              Create Inspections
            </li>

            <li className="tab">
                <div className="dropdown">
                    <button className="dropbtn">Reports</button>
                    <div className="dropdown-content">

                    <li
                    data-tab-target="#InspectionReports"
                    className={activeTab === "#InspectionReports" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#InspectionReports")}
                    >
                    Inspection Reports
                    </li>

                    <li
                    data-tab-target="#IncidentReports"
                    className={activeTab === "#IncidentReports" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#IncidentReports")}
                    >
                    Incident Reports
                    </li>
                </div>
             </div>
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

        {activeTab === "#Projects" && (
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
                <div className='adj'>
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div >
                          <div>
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
                  </div>
                </div>
              </div>

              
              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}

          {activeTab === "#IncidentReporting" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Incident Reporting</b></h1>
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
                          <form id="incidentForm" onSubmit={handleIncidentReportSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="reporterName" className="form-label">Reporter's Name</label>
                                    <input type="text" className="form-control" 
                                    autoComplete="off" id="reporterName" 
                                    onChange={handleIncidentReportInputChange}
                                    name="reporterName" required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="reporterContact" className="form-label">Reporter's Contact Information</label>
                                    <input type="text" className="form-control" onChange={handleIncidentReportInputChange} autoComplete="off" id="reporterContact" name="reporterContact" required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="witnesses" className="form-label">Witnesses (if any)</label>
                                    <input type="text" className="form-control" onChange={handleIncidentReportInputChange} autoComplete="off" id="witnesses" name="witnesses" />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="location" className="form-label">Location</label>
                                    <input type="text" className="form-control"  onChange={handleIncidentReportInputChange} autoComplete="off" id="location" name="location" required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description of Incident</label>
                                    <textarea className="form-control" id="description" onChange={handleIncidentReportInputChange} name="description" rows={4} required defaultValue={""} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="incidentDate" className="form-label">Incident Date</label>
                                    <input type="date" className="form-control" onChange={handleIncidentReportInputChange} autoComplete="off" id="incidentDate" name="incidentDate" required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="actionsTaken" className="form-label">Actions Taken</label>
                                    <textarea className="form-control" id="actionsTaken" onChange={handleIncidentReportInputChange} name="actionsTaken" rows={4} required defaultValue={""} />
                                </div>
                                <hr />
                                <button type="submit" className="btn btn-outline-secondary">Submit Report</button>
                            </form>
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

        {activeTab === "#CreateInspection" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Create Inspection</b></h1>
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
                          <form id="inspectionform" className="inspection" onSubmit={handleInspectionFormSubmit}>
                            <div className="mb-3">
                              <label htmlFor="date" className="form-label">
                                Date:
                              </label>
                              <input
                                type="date"
                                id="date"
                                name="date"
                                className="form-control"
                                required
                                value={inspectionDate}
                                onChange={(e) => setInspectionDate(e.target.value)}
                              />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="location" className="form-label">
                                Location:
                              </label>
                              <input
                                type="text"
                                id="location"
                                autoComplete="off"
                                name="location"
                                className="form-control"
                                required
                                value={inspectionLocation}
                                onChange={(e) => setInspectionLocation(e.target.value)}
                              />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="inspector" className="form-label">
                                Inspector:
                              </label>
                              <input
                                type="text"
                                id="inspector"
                                autoComplete="off"
                                name="inspector"
                                className="form-control"
                                required
                                value={inspectionInspector}
                                onChange={(e) => setInspectionInspector(e.target.value)}
                              />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="photos" className="form-label">
                                Photos:
                              </label>
                              <input
                                type="file"
                                id="photos"
                                name="photos"
                                className="form-control"
                                accept="image/*"
                                multiple
                                onChange={handleInspectionPhotosChange}
                              />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="notes" className="form-label">
                                Notes:
                              </label>
                              <textarea
                                id="notes"
                                name="notes"
                                className="form-control"
                                rows={4}
                                cols={50}
                                value={inspectionNotes}
                                onChange={(e) => setInspectionNotes(e.target.value)}
                              />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="signature" className="form-label">
                                Inspector Signature:
                              </label>
                              <input
                                type="text"
                                id="signature"
                                autoComplete="off"
                                name="signature"
                                className="form-control"
                                required
                                value={inspectionSignature}
                                onChange={(e) => setInspectionSignature(e.target.value)}
                              />
                            </div>
                            <button type="submit" className="btn btn-outline-secondary">
                              Save Inspection
                            </button>
                          </form>
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



        {activeTab === "#InspectionReports" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Inspection Reports</b></h1>
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
                                <th>Date</th>
                                <th>Inspector</th>
                                <th>Location</th>
                                <th>Notes</th>
                                <th>Photo</th>
                                <th>Signature</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inspections.map((inspection, index) => (
                                <tr key={index}>
                                  <td>{inspection.date}</td>
                                  <td>{inspection.inspector}</td>
                                  <td>{inspection.location}</td>
                                  <td>{inspection.notes}</td>
                                  <td>
                                    <a href={inspection.photo1URL} target="_blank" rel="noopener noreferrer">
                                      <img src={inspection.photo1URL} alt={`Photo ${index + 1}`} style={{ width: '50px', height: '50px' }} />
                                    </a>
                                  </td>
                                  <td>{inspection.signature}</td>
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

        {activeTab === "#IncidentReports" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Incident Reports</b></h1>
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
                          <div>
                          <table className="table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Location</th>
                                  <th>Reporter</th>
                                  <th>Contact No.</th>
                                  <th>Description</th>
                                  <th>Actions Taken</th>
                                  <th>Witness</th>
                                </tr>
                              </thead>
                              <tbody>
                                {incidentReports.map((report) => (
                                  <tr key={report.id}>
                                    <td>{report.incidentDate}</td>
                                    <td>{report.location}</td>
                                    <td>{report.reporterName}</td>
                                    <td>{report.reporterContact}</td>
                                    <td>{report.description}</td>
                                    <td>{report.actionsTaken}</td>
                                    <td>{report.witnesses}</td>
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
              </div>
              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}  
    </div>
    </div>
  </div>
  );
};

export default SafetyOfficer;
