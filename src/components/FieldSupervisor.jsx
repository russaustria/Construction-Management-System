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
  push,
  ref,
  off, // Fix: Remove the duplicated import
} from 'firebase/database';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
const FieldSupervisor = () => {

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


  const [selectedProject, setSelectedProject] = useState('');

  const handleProjectChange = (projectName) => {
    // Find the selected project in the projectList
    const selectedProjectData = projectList.find((project) => project.projectName === projectName);

  };

  const [workLocation, setWorkLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [materials, setMaterials] = useState('');

  const handleWorkOrderSubmit = async (e) => {
    e.preventDefault();

    // Get a reference to the database
    const db = getDatabase();

    // Push form data to the 'workorders' node in the database
    const workordersRef = ref(db, 'workorders');
    const newWorkorderRef = push(workordersRef, {
      project: selectedProject,
      workLocation: workLocation,
      description: description,
      startDate: startDate,
      endDate: endDate,
      assignedTo: assignedTo,
      materials: materials,
    });

    // Optionally, you can get the key of the newly created work order
    const workorderId = newWorkorderRef.key;

    alert("Work Order Made Successfully!");
    // Reset the form after submission
    setSelectedProject('');
    setWorkLocation('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setAssignedTo([]);
    setMaterials('');
  };
 

  const [item, setItem] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handlePunchListFormSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields here if needed

    try {
      const db = getDatabase(app);
      const punchlistRef = ref(db, 'punchlists'); // 'punchlists' is the path to your data in the database

      // Push data to the database
      const newPunchlistRef = push(punchlistRef, {
        project: selectedProject,
        item: item,
        description: description,
        status: status,
        assignedTo: assignedTo,
        dueDate: dueDate,
      });

      console.log('Punchlist added with key:', newPunchlistRef.key);
      alert("Punchlist Made Successfully!");
      // Reset form fields after submission
      setSelectedProject('');
      setItem('');
      setDescription('');
      setStatus('');
      setAssignedTo([]);
      setDueDate('');
    } catch (error) {
      console.error('Error adding punchlist:', error.message);
    }
  };

  const [fieldactivity, setfieldactivity] = useState('');
  const [FieldLocation, setFieldLocaton] = useState('');

  const handleFieldActivityFormSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields here if needed

    try {
      const db = getDatabase(app);
      const punchlistRef = ref(db, 'fieldactivity'); // 'punchlists' is the path to your data in the database

      // Push data to the database
      const newFieldActivityRef = push(punchlistRef, {
        project: selectedProject,
        fieldactivity: fieldactivity,
        description: description,
        dueDate: dueDate,
        FieldLocation: FieldLocation,
      });

      console.log('Field Activity added with key:', newFieldActivityRef.key);
      alert("Field Activity Created Successfully!");
      // Reset form fields after submission
      setSelectedProject('');
      setfieldactivity('');
      setDescription('');
      setDueDate('');
      setFieldLocaton('');
    } catch (error) {
      console.error('Error adding Field Activity:', error.message);
    }
  };

  const [fieldActivities, setFieldActivities] = useState([]);

  useEffect(() => {
    // Load field activities when the component mounts
    loadFieldActivities();
  }, []);

  const loadFieldActivities = async () => {
    const db = getDatabase(app);
    const punchlistRef = ref(db, 'fieldactivity');

    // Listen for changes to the field activities
    onValue(punchlistRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fieldActivitiesArray = Object.values(data);
        setFieldActivities(fieldActivitiesArray);
      } else {
        setFieldActivities([]);
      }
    });
  };

  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    // Load inspections when the component mounts
    loadInspections();
  }, []);

  const loadInspections = async () => {
    const db = getDatabase(app);
    const inspectionsRef = ref(db, 'inspections'); // Adjust the path as needed

    // Listen for changes to the inspections
    onValue(inspectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const inspectionsArray = Object.values(data);
        setInspections(inspectionsArray);
      } else {
        setInspections([]);
      }
    });
  };
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
              data-tab-target="#projects"
              className={activeTab === "#projects" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#projects")}
            >
              Projects
            </li>

            <li
              data-tab-target="#CreateWorkOrder"
              className={activeTab === "#CreateWorkOrder" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#CreateWorkOrder")}
            >
              Create Work Order
            </li>

            <li
              data-tab-target="#CreatePunchList"
              className={activeTab === "#CreatePunchList" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#CreatePunchList")}
            >
              Create Punch List
            </li>

            <li className="tab">
                <div className="dropdown">
                    <button className="dropbtn">Field Activity</button>
                    <div className="dropdown-content">

                    <li
                    data-tab-target="#CreateFieldActivity"
                    className={activeTab === "#CreateFieldActivity" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#CreateFieldActivity")}
                    >
                    Create Field Activity
                    </li>

                    <li
                    data-tab-target="#FieldActivities"
                    className={activeTab === "#FieldActivities" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#FieldActivities")}
                    >
                    Field Activities
                    </li>
                </div>
             </div>
          </li>

          <li
              data-tab-target="#Inspections"
              className={activeTab === "#Inspections" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#Inspections")}
            >
              Inspections
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

          {activeTab === "#CreateWorkOrder" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Create Work Order</b></h1>
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
                          <form id="createworkorderform" onSubmit={handleWorkOrderSubmit}>
                          <div className="mb-3">
                                <label htmlFor="projectSelect" className="form-label">
                                  Select a Project
                                </label>
                                <select
                                  className="form-select"
                                  id="projectSelect"
                                  name="projectName"
                                  value={selectedProject}
                                  onChange={(e) => {
                                    setSelectedProject(e.target.value);
                                    handleProjectChange(e.target.value);
                                  }}
                                >
                                  <option value="">
                                    Select a Project
                                  </option>
                                  {projectList.map((project) => (
                                    <option key={project.id} value={project.projectName}>
                                      {project.projectName}
                                    </option>
                                  ))}
                                </select>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="location" className="form-label">Location</label>
                                    <input type="text" className="form-control"                                   
                                    onChange={(e) => {
                                    setWorkLocation(e.target.value);
                                  }}  autoComplete="off" id="location" name="location" 
                                    value={workLocation}
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Project Description</label>
                                    <textarea className="form-control"               
                                    onChange={(e) => {
                                    setDescription(e.target.value);
                                  }}  id="description" name="description" rows={4} required value={description} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="startDate" className="form-label">Start Date</label>
                                    <input type="date" 
                                    className="form-control" id="startDate" name="startDate" 
                                    onChange={(e) => {
                                      setStartDate(e.target.value);
                                    }} 
                                    value={startDate}
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="endDate" className="form-label">End Date</label>
                                    <input type="date"                                     onChange={(e) => {
                                      setEndDate(e.target.value);
                                    }} className="form-control" id="endDate" name="endDate" 
                                    value={endDate}
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="assignedto" className="form-label">Assigned To: <br/> (To select multiple resources hold the ctrl and click the desired resources.)</label>
                                    <select           
                                                          
                                    onChange={(e) => {
                                      setAssignedTo(e.target.value);
                                    }}  className="form-select" id="assignedto" required multiple>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Construction Site Supervisor">Construction Site Supervisor</option>
                                    <option value="Procurement Manager">Procurement Manager</option>
                                    <option value="Construction Team Member">Construction Team Member</option>
                                    <option value="Project Stakeholder">Project Stakeholder</option>
                                    <option value="Supplier">Supplier</option>
                                    <option value="Construction Site Inspector">Construction Site Inspector</option>
                                    <option value="Project Accountant">Project Accountant</option>
                                    <option value="Subcontractor">Subcontractor</option>
                                    <option value="Project Scheduler">Project Scheduler</option>
                                    <option value="Quality Control Manager">Quality Control Manager</option>
                                    <option value="Project Owner">Project Owner</option>
                                    <option value="Field Supervisor">Field Supervisor</option>
                                    <option value="Materials Manager">Materials Manager</option>
                                    <option value="Safety Officer">Safety Officer</option>
                                    <option value="Executive">Executive</option>
                                    {/* Add other options here */}
                                    </select>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="materials" className="form-label">Materials Required</label>
                                    <textarea className="form-control"  
                                    value={materials}                      
                                      onChange={(e) => {
                                      setMaterials(e.target.value);
                                    }} id="materials" name="materials" rows={3} defaultValue={""} />
                                </div>
                                <button type="submit" className="btn btn-outline-secondary">Submit</button>
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

        {activeTab === "#CreatePunchList" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Create Punch Lists</b></h1>
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
                          <form id="punchlist" onSubmit={handlePunchListFormSubmit}>
                          <div className="mb-3">
                                <label htmlFor="projectSelect" className="form-label">
                                  Select a Project
                                </label>
                                <select
                                  className="form-select"
                                  id="projectSelect"
                                  name="projectName"
                                  value={selectedProject}
                                  onChange={(e) => {
                                    setSelectedProject(e.target.value);
                                    handleProjectChange(e.target.value);
                                  }}
                                >
                                  <option value="">
                                    Select a Project
                                  </option>
                                  {projectList.map((project) => (
                                    <option key={project.id} value={project.projectName}>
                                      {project.projectName}
                                    </option>
                                  ))}
                                </select>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="item" className="form-label">Item:</label>
                                    <input type="text"                                   
                                    onChange={(e) => {
                                    setItem(e.target.value);
                                  }}id="item" name="item" className="form-control" 
                                  value={item}
                                  required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Project Description</label>
                                    <textarea className="form-control"               
                                    onChange={(e) => {
                                    setDescription(e.target.value);
                                  }}  id="description" name="description" rows={4} required value={description} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="status" className="form-label">Status:</label>
                                    <select id="status" name="status" className="form-select" 
                                    onChange={(e) => {
                                      setStatus(e.target.value);
                                    }} required>
                                    <option value disabled selected>Select Status</option>
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="assignedto" className="form-label">Assigned To: <br/> (To select multiple resources hold the ctrl and click the desired resources.)</label>
                                    <select           
                                                          
                                    onChange={(e) => {
                                      setAssignedTo(e.target.value);
                                    }}  className="form-select" id="assignedto" required multiple>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Construction Site Supervisor">Construction Site Supervisor</option>
                                    <option value="Procurement Manager">Procurement Manager</option>
                                    <option value="Construction Team Member">Construction Team Member</option>
                                    <option value="Project Stakeholder">Project Stakeholder</option>
                                    <option value="Supplier">Supplier</option>
                                    <option value="Construction Site Inspector">Construction Site Inspector</option>
                                    <option value="Project Accountant">Project Accountant</option>
                                    <option value="Subcontractor">Subcontractor</option>
                                    <option value="Project Scheduler">Project Scheduler</option>
                                    <option value="Quality Control Manager">Quality Control Manager</option>
                                    <option value="Project Owner">Project Owner</option>
                                    <option value="Field Supervisor">Field Supervisor</option>
                                    <option value="Materials Manager">Materials Manager</option>
                                    <option value="Safety Officer">Safety Officer</option>
                                    <option value="Executive">Executive</option>
                                    {/* Add other options here */}
                                    </select>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="due_date" className="form-label">Due Date:</label>
                                    <input type="date" id="due_date" name="due_date" 
                                     onChange={(e) => {
                                      setDueDate(e.target.value);
                                    }}                                    
                                    className="form-control"
                                    value={dueDate} 
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <input type="submit" defaultValue="Submit" className="btn btn-outline-secondary" />
                                </div>
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

        {activeTab === "#CreateFieldActivity" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Create Field Activity</b></h1>
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
                          <form id="createfieldactivityform" onSubmit={handleFieldActivityFormSubmit}>
                          <div className="mb-3">
                                <label htmlFor="projectSelect" className="form-label">
                                  Select a Project
                                </label>
                                <select
                                  className="form-select"
                                  id="projectSelect"
                                  name="projectName"
                                  value={selectedProject}
                                  onChange={(e) => {
                                    setSelectedProject(e.target.value);
                                    handleProjectChange(e.target.value);
                                  }}
                                >
                                  <option value="">
                                    Select a Project
                                  </option>
                                  {projectList.map((project) => (
                                    <option key={project.id} value={project.projectName}>
                                      {project.projectName}
                                    </option>
                                  ))}
                                </select>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="createactivityname" className="form-label">Activity Name:</label>
                                    <input type="text" id="createactivityname" 
                                    value={fieldactivity}
                                    onChange={(e) => {
                                      setfieldactivity(e.target.value);
                                    }}                                   
                                    autoComplete="off" name="createactivityname" 
                                    className="form-control" 
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="createdescription" className="form-label">Description:</label>
                                    <textarea id="createdescription" autoComplete="off" 
                                    name="createdescription" 
                                    value={description}
                                    onChange={(e) => {
                                      setDescription(e.target.value);
                                    }}    
                                    className="form-control" rows={4} cols={50} 
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="createdate" className="form-label">Date:</label>
                                    <input type="date" id="createdate" 
                                     value={dueDate}
                                     onChange={(e) => {
                                       setDueDate(e.target.value);
                                     }}                                       
                                    autoComplete="off" name="date" 
                                    className="form-control" 
                                    required />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="createlocation" className="form-label">Location:</label>
                                    <input type="text" id="createlocation" 
                                      value={FieldLocation}
                                      onChange={(e) => {
                                        setFieldLocaton(e.target.value);
                                      }}                                    
                                    autoComplete="off" name="createlocation" 
                                    className="form-control" 
                                    required />
                                </div>
                                <button type="submit" className="btn btn-outline-secondary">Submit</button>
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

        {activeTab === "#FieldActivities" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Field Activities</b></h1>
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
                                <th>Project</th>
                                <th>Field Activity</th>
                                <th>Description</th>
                                <th>Due Date</th>
                                <th>Field Location</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fieldActivities.map((activity, index) => (
                                <tr key={index}>
                                  <td>{activity.project}</td>
                                  <td>{activity.fieldactivity}</td>
                                  <td>{activity.description}</td>
                                  <td>{activity.dueDate}</td>
                                  <td>{activity.FieldLocation}</td>
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

         {activeTab === "#Inspections" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Inspections</b></h1>
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
                                      {inspection.photo1URL && (
                                        <a href={inspection.photo1URL} target="_blank" rel="noopener noreferrer">
                                          View Photo
                                        </a>
                                      )}
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
    </div>
    </div>
  </div>
  );
};

export default FieldSupervisor;
