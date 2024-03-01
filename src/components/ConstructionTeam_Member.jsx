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
  get,
  onValue,
  remove,
  push,
  update,
  ref,
  off, // Fix: Remove the duplicated import
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ConstructionTeamMember = () => {

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

  const [formAttendanceData, setformAttendanceData] = useState({
    fullName: '',
    timeIn: '',
    timeOut: '',
    dateToday: '',
  });

  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    setformAttendanceData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTimeInClick = () => {
    const currentTime = new Date().toLocaleTimeString();
    setformAttendanceData((prevData) => ({
      ...prevData,
      timeIn: currentTime,
    }));
  };

  const handleTimeOutClick = () => {
    const currentTime = new Date().toLocaleTimeString();
    setformAttendanceData((prevData) => ({
      ...prevData,
      timeOut: currentTime,
    }));
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    const attendanceData = {
      fullName: formAttendanceData.fullName,
      timeIn: formAttendanceData.timeIn,
      timeOut: formAttendanceData.timeOut,
      dateToday: formAttendanceData.dateToday,
    };

    // Assuming you have a 'attendance' node in your Firebase Realtime Database
    const attendanceRef = ref(database, 'attendanceLogs');

    try {
      // Push the attendance data to the database
      await push(attendanceRef, attendanceData);

      // Clear the form after successful submission
      setformAttendanceData({
        fullName: '',
        timeIn: '',
        timeOut: '',
      });

      console.log('Attendance data submitted successfully.');
    } catch (error) {
      console.error('Error submitting attendance data:', error);
    }
  };

  useEffect(() => {
    const currentDate = new Date().toLocaleDateString();
    setformAttendanceData((prevData) => ({
      ...prevData,
      dateToday: currentDate,
    }));
  }, []);

  const handleAttendanceClear = () => {
    setformAttendanceData({
      fullName: '',
      timeIn: '',
      timeOut: '',
    });
  };

  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    const projectsRef = ref(database, 'projects');
  
    // Fetch projects from the database
    onValue(projectsRef, (snapshot) => {
      const projectsData = snapshot.val();
  
      // Convert projects data to an array
      const projectsArray = projectsData ? Object.values(projectsData) : [];
  
      setProjects(projectsArray);
      console.log('Projects Array:', projectsArray);
    });
  
    // Clean up the event listener when the component unmounts
    return () => {
      off(projectsRef);
    };
  }, []);

  const formatPriceMember = (price) => {
    // Remove existing commas and then add commas to the price input
    return price.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const purchasesRef = ref(db, 'purchase');

      // Fetch data from the database
      onValue(purchasesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const purchaseList = Object.values(data);
          setPurchases(purchaseList);
        }
      });

      // Clean up the event listener when the component unmounts
      return () => off(purchasesRef, 'value');
    };

    fetchData();
  }, [location]);

  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const suppliersRef = ref(db, 'suppliers');

      // Fetch data from the database
      onValue(suppliersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const suppliersList = Object.values(data);
          setSuppliers(suppliersList);
        }
      });

      // Clean up the event listener when the component unmounts
      return () => off(suppliersRef, 'value');
    };

    fetchData();
  }, [location]);
  
  const [tools, setTools] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const toolsRef = ref(db, 'tools');

      // Fetch data from the database
      onValue(toolsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const toolsList = Object.values(data);
          setTools(toolsList);
        }
      });

      // Clean up the event listener when the component unmounts
      return () => off(toolsRef, 'value');
    };

    fetchData();
  }, [location]);

  const [expenseType, setExpenseType] = useState('Food'); // Set a default value
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePrice, setExpensePrice] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  const handleMemberSubmit = (e) => {
    e.preventDefault();

    // Push data to Firebase Realtime Database
    const memberdb = getDatabase();
    const expensesRef = ref(memberdb, 'expenses');

    // You can structure your data according to your needs
    const newExpense = {
      projectName: selectedProject,
      expenseType,
      expenseDescription,
      expensePrice,
      expenseDate,
    };

    // Push the new expense data to the 'expenses' node
    push(expensesRef, newExpense);
    alert("Expenses created successfully!")

    // Reset the form values
    setSelectedProject('');
    setExpenseType('Food');
    setExpenseDescription('');
    setExpensePrice('');
    setExpenseDate('');
  };

  const [selectedFile, setSelectedFile] = useState(null);

  const [documents, setDocuments] = useState([]);

  const handleBlueprintFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleBlueprintUpload = async (event) => {
    event.preventDefault();

    // Validate form data
    if (!selectedProject || !selectedFile) {
      alert('Please fill in all fields.');
      return;
    }

    // Get a reference to the 'documents' node in the database
    const blueprintdatabaseRef = ref(database, 'blueprints');

    // Push data to the database
    const newDocumentRef = push(blueprintdatabaseRef, { projectName: selectedProject });

    // Get the newly generated document ID
    const documentId = newDocumentRef.key;

    // Upload the file to Firebase Storage
    const storageReference = storageRef(storage, `blueprints/${documentId}/${selectedFile.name}`);
    await uploadBytes(storageReference, selectedFile);

    // Get the download URL of the uploaded file
    const downloadURL = await getDownloadURL(storageReference);

    // Update the database with the file URL
    update(newDocumentRef, { fileURL: downloadURL });

    // Reset form fields
    setSelectedProject('');
    setSelectedFile(null);
    document.getElementById('uploadFormBlueprints').reset();

    alert('Document Uploaded Successfully!');
  };

  const handleDesignSpecFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleDesignSpecUpload = async (event) => {
    event.preventDefault();

    // Validate form data
    if (!selectedProject || !selectedFile) {
      alert('Please fill in all fields.');
      return;
    }

    // Get a reference to the 'documents' node in the database
    const designspecdatabaseRef = ref(database, 'designspecification');

    // Push data to the database
    const newDocumentRef = push(designspecdatabaseRef, { projectName: selectedProject });

    // Get the newly generated document ID
    const documentId = newDocumentRef.key;

    // Upload the file to Firebase Storage
    const storageReference = storageRef(storage, `designspecification/${documentId}/${selectedFile.name}`);
    await uploadBytes(storageReference, selectedFile);

    // Get the download URL of the uploaded file
    const downloadURL = await getDownloadURL(storageReference);

    // Update the database with the file URL
    update(newDocumentRef, { fileURL: downloadURL });

    // Reset form fields
    setSelectedProject('');
    setSelectedFile(null);
    document.getElementById('uploadFormDesignSpec').reset();

    alert('Design Specification Uploaded Successfully!');
  };

  const handlepermitFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handlepermitUpload = async (event) => {
    event.preventDefault();

    // Validate form data
    if (!selectedProject || !selectedFile) {
      alert('Please fill in all fields.');
      return;
    }

    // Get a reference to the 'documents' node in the database
    const permitdatabaseRef = ref(database, 'permit');

    // Push data to the database
    const newDocumentRef = push(permitdatabaseRef, { projectName: selectedProject });

    // Get the newly generated document ID
    const documentId = newDocumentRef.key;

    // Upload the file to Firebase Storage
    const storageReference = storageRef(storage, `permits/${documentId}/${selectedFile.name}`);
    await uploadBytes(storageReference, selectedFile);

    // Get the download URL of the uploaded file
    const downloadURL = await getDownloadURL(storageReference);

    // Update the database with the file URL
    update(newDocumentRef, { fileURL: downloadURL });

    // Reset form fields
    setSelectedProject('');
    setSelectedFile(null);
    document.getElementById('uploadformpermit').reset();

    alert('Permit Uploaded Successfully!');
  };

  const handleformFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleformUpload = async (event) => {
    event.preventDefault();

    // Validate form data
    if (!selectedProject || !selectedFile) {
      alert('Please fill in all fields.');
      return;
    }

    // Get a reference to the 'documents' node in the database
    const formdatabaseRef = ref(database, 'form');

    // Push data to the database
    const newDocumentRef = push(formdatabaseRef, { projectName: selectedProject });

    // Get the newly generated document ID
    const documentId = newDocumentRef.key;

    // Upload the file to Firebase Storage
    const storageReference = storageRef(storage, `forms/${documentId}/${selectedFile.name}`);
    await uploadBytes(storageReference, selectedFile);

    // Get the download URL of the uploaded file
    const downloadURL = await getDownloadURL(storageReference);

    // Update the database with the file URL
    update(newDocumentRef, { fileURL: downloadURL });

    // Reset form fields
    setSelectedProject('');
    setSelectedFile(null);
    document.getElementById('uploadformform').reset();

    alert('Form Uploaded Successfully!');
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
              data-tab-target="#Attendance"
              className={activeTab === "#Attendance" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#Attendance")}
            >
              Attendance
            </li>

            <li
              data-tab-target="#Expenses"
              className={activeTab === "#Expenses" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#Expenses")}
            >
              Expenses
            </li>

            <li className="tab">
                <div className="dropdown">
                    <button className="dropbtn">Reports</button>
                    <div className="dropdown-content">

                    <li
                    data-tab-target="#Projects"
                    className={activeTab === "#Projects" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#Projects")}
                    >
                    Projects
                    </li>

                    <li
                    data-tab-target="#PurchaseOrder"
                    className={activeTab === "#PurchaseOrder" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#PurchaseOrder")}
                    >
                    Purchase Order
                    </li>

                    <li
                    data-tab-target="#Suppliers"
                    className={activeTab === "#Suppliers" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#Suppliers")}
                    >
                    Suppliers
                    </li>

                    <li
                    data-tab-target="#Tools"
                    className={activeTab === "#Tools" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#Tools")}
                    >
                    Tools
                    </li>
                </div>
             </div>
          </li>

          <li className="tab">
                <div className="dropdown">
                    <button className="dropbtn">Upload Repository</button>
                    <div className="dropdown-content">

                    <li
                    data-tab-target="#UploadBluePrint"
                    className={activeTab === "#UploadBluePrint" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#UploadBluePrint")}
                    >
                    Upload Blueprint
                    </li>

                    <li
                    data-tab-target="#UploadDesignSpecifications"
                    className={activeTab === "#UploadDesignSpecifications" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#UploadDesignSpecifications")}
                    >
                    Upload Design Specification
                    </li>

                    <li
                    data-tab-target="#UploadPermit"
                    className={activeTab === "#UploadPermit" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#UploadPermit")}
                    >
                    Upload Permit
                    </li>

                    <li
                    data-tab-target="#UploadForms"
                    className={activeTab === "#UploadForms" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#UploadForms")}
                    >
                    Upload Forms
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

          {activeTab === "#Attendance" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Attendance</b></h1>
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
                          <form id="attendanceForm" onSubmit={handleAttendanceSubmit}>
                            <div className="mb-3">
                              <label htmlFor="fullName" className="form-label">
                                Full Name:
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                autoComplete="off"
                                id="fullName"
                                name="fullName"
                                readOnly
                                value={fullName}
                              />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="timeIn" className="form-label">
                                Time In:
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                id="timeIn"
                                name="timeIn"
                                readOnly
                                value={formAttendanceData.timeIn}
                              />
                              <br />
                              <button type="button" className="btn btn-outline-secondary" onClick={handleTimeInClick}>
                                Time In
                              </button>
                            </div>
                            <div className="mb-3">
                              <label htmlFor="timeOut" className="form-label">
                                Time Out:
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                id="timeOut"
                                name="timeOut"
                                readOnly
                                value={formAttendanceData.timeOut}
                              />
                              <br />
                              <button type="button" className="btn btn-outline-secondary" onClick={handleTimeOutClick}>
                                Time Out
                              </button>
                            </div>
                            <div className="mb-3">
                              <label htmlFor="dateToday" className="form-label">
                                Date:
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                disabled
                                id="dateToday"
                                value={formAttendanceData.dateToday}
                              />
                            </div>
                            <div className="mb-3">
                              <button type="submit" className="btn btn-outline-secondary">
                                Submit
                              </button>
                              <br/><br/>
                              <button type="button" className="btn btn-outline-secondary" onClick={handleAttendanceClear}>
                                Clear
                              </button>
                            </div>
                          </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/* Add form, input fields, or any other content as needed */}
            </div>
          </div>
          )}

          {activeTab === "#Expenses" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Expenses</b></h1>
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
                          <form id="expenseForm" onSubmit={handleMemberSubmit}>
                              <div className="mb-3">
                                <label htmlFor="projectDropdown" className="form-label">
                                  Project:
                                </label>
                                <select
                                  id="projectDropdown"
                                  className="form-select"
                                  value={selectedProject}
                                  onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                  <option value="">Select a Project</option>
                                  {projects.map((project) => (
                                    <option key={project.projectName} value={project.projectName}>
                                      {project.projectName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="expenseType" className="form-label">
                                  Expense Type:
                                </label>
                                <select
                                  id="expenseType"
                                  className="form-select"
                                  value={expenseType}
                                  onChange={(e) => setExpenseType(e.target.value)}
                                >
                                  <option value="Food">Food</option>
                                  <option value="Labor">Labor</option>
                                  <option value="Communication">Communication</option>
                                  <option value="Accommodation">Accommodation</option>
                                  <option value="Transportation">Transportation</option>
                                  <option value="ProjectMaterials">Project Materials</option>
                                </select>
                              </div>

                              <hr />
                              <div className="mb-3">
                                <label htmlFor="expenseDescription" className="form-label">
                                  Expense Description:
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  id="expenseDescription"
                                  className="form-control"
                                  required
                                  value={expenseDescription}
                                  onChange={(e) => setExpenseDescription(e.target.value)}
                                />
                              </div>

                              <hr />
                              <div className="mb-3">
                                <label htmlFor="expensePrice" className="form-label">
                                  Amount:
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  id="expensePrice"
                                  className="form-control"
                                  required
                                  value={expensePrice}
                                  onChange={(e) => setExpensePrice(formatPriceMember(e.target.value))}
                                />
                              </div>

                              <hr />
                              <div className="mb-3">
                                <label htmlFor="expenseDate" className="form-label">
                                  Date:
                                </label>
                                <input
                                  type="date"
                                  id="expenseDate"
                                  className="form-control"
                                  required
                                  value={expenseDate}
                                  onChange={(e) => setExpenseDate(e.target.value)}
                                />
                              </div>
                              <hr />
                              <button className="btn btn-outline-secondary" type="submit">
                                Add Expense
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

        {activeTab === "#PurchaseOrder" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Purchase Order</b></h1>
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
                                  <th>Description</th>
                                  <th>Price</th>
                                  <th>Product</th>
                                  <th>Quantity</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {purchases.map((purchase) => (
                                  <tr key={purchase.purchaseId}>
                                    <td>{purchase.description}</td>
                                    <td>{purchase.price}</td>
                                    <td>{purchase.product}</td>
                                    <td>{purchase.quantity}</td>
                                    <td>{purchase.total}</td>
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

        {activeTab === "#Suppliers" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Suppliers</b></h1>
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
                                <th>Supplier</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Phone No.</th>
                                <th>Address</th>
                                <th>City</th>
                              </tr>
                            </thead>
                            <tbody>
                              {suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                  <td>{supplier.supplierName}</td>
                                  <td>{supplier.contactPerson}</td>
                                  <td>{supplier.email}</td>
                                  <td>{supplier.phoneNumber}</td>
                                  <td>{supplier.address}</td>
                                  <td>{supplier.city}</td>
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

         {activeTab === "#Tools" && (
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
                <div className='adj'>
                  <div className="col-lg-12">
                    <div className="card radius-10">
                      <div className="card-body">
                        <div >
                          <div>
                          <table className="table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Category</th>
                                  <th>Description</th>
                                  <th>Price</th>
                                  <th>Stocks</th>
                                  <th>Supplier</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tools.map((tool) => (
                                  <tr key={tool.id}>
                                    <td>{tool.toolName}</td>
                                    <td>{tool.toolCategory}</td>
                                    <td>{tool.toolDescription}</td>
                                    <td>{tool.toolPrice}</td>
                                    <td>{tool.toolStock}</td>
                                    <td>{tool.supplierName}</td>
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

         {activeTab === "#UploadBluePrint" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Upload Blueprint</b></h1>
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
                          <form id="uploadFormBlueprints" onSubmit={handleBlueprintUpload}>
                            <label htmlFor="projectName" className="form-label">
                              Project Name:
                            </label>
                            <select
                                id="projectDropdown"
                                className="form-select"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                              >
                                <option value="">Select a Project</option>
                                {projects.map((project) => (
                                  <option key={project.projectName} value={project.projectName}>
                                    {project.projectName}
                                  </option>
                                ))}
                              </select>
                              <hr />
                            <label htmlFor="blueprints" className="form-label">
                              Blueprints:
                            </label>
                            <input
                              type="file"
                              id="blueprints"
                              name="blueprints"
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                              className="form-control"
                              onChange={handleBlueprintFileChange}
                              required
                            />
                            <br />
                            <button type="submit" className="btn btn-outline-secondary">
                              Upload Blueprints
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

          {activeTab === "#UploadDesignSpecifications" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Upload Design Specification</b></h1>
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
                          <form id="uploadFormDesignSpec" onSubmit={handleDesignSpecUpload}>
                              <label htmlFor="projectName" className="form-label">
                                Project Name:
                              </label>
                              <select
                                id="projectDropdown"
                                className="form-select"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                              >
                                <option value="">Select a Project</option>
                                {projects.map((project) => (
                                  <option key={project.projectName} value={project.projectName}>
                                    {project.projectName}
                                  </option>
                                ))}
                              </select>
                              <hr />
                              <label htmlFor="designspec" className="form-label">
                                Design Specification:
                              </label>
                              <input
                                type="file"
                                id="designspec"
                                name="designspec"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="form-control"
                                onChange={handleDesignSpecFileChange}
                                required
                              />
                              <br />
                              <button type="submit" className="btn btn-outline-secondary">
                                Upload Design Specification
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

          {activeTab === "#UploadPermit" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Upload Permit</b></h1>
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
                          <form id="uploadformpermit" onSubmit={handlepermitUpload}>
                              <label htmlFor="projectName" className="form-label">
                                Project Name:
                              </label>
                              <select
                                id="projectDropdown"
                                className="form-select"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                              >
                                <option value="">Select a Project</option>
                                {projects.map((project) => (
                                  <option key={project.projectName} value={project.projectName}>
                                    {project.projectName}
                                  </option>
                                ))}
                              </select>
                              <hr />
                              <label htmlFor="permit" className="form-label">
                                Permit:
                              </label>
                              <input
                                type="file"
                                id="permit"
                                name="permit"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="form-control"
                                onChange={handlepermitFileChange}
                                required
                              />
                              <br />
                              <button type="submit" className="btn btn-outline-secondary">
                                Upload Permit
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

          {activeTab === "#UploadForms" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Upload Forms</b></h1>
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
                          <form id="uploadformform" onSubmit={handleformUpload}>
                              <label htmlFor="projectName" className="form-label">
                                Project Name:
                              </label>
                              <select
                                id="projectDropdown"
                                className="form-select"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                              >
                                <option value="">Select a Project</option>
                                {projects.map((project) => (
                                  <option key={project.projectName} value={project.projectName}>
                                    {project.projectName}
                                  </option>
                                ))}
                              </select>
                              <hr />
                              <label htmlFor="form" className="form-label">
                                form:
                              </label>
                              <input
                                type="file"
                                id="form"
                                name="form"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="form-control"
                                onChange={handleformFileChange}
                                required
                              />
                              <br />
                              <button type="submit" className="btn btn-outline-secondary">
                                Upload Form
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
    </div>
    </div>
  </div>
  );
};

export default ConstructionTeamMember;
