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

const ProjectManager = () => {

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


  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [resources, setResources] = useState([]);
  const [milestone, setMilestone] = useState('');
  const [milestoneList, setMilestoneList] = useState([]);



  const handleBudgetChange = (e) => {
    const formattedBudget = e.target.value.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setBudget(formattedBudget);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    updateDuration(e.target.value, endDate);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    updateDuration(startDate, e.target.value);
  };

  const updateDuration = (start, end) => {
    const startDateObject = new Date(start);
    const endDateObject = new Date(end);

    const timeDifference = endDateObject - startDateObject;
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    setDuration(daysDifference > 0 ? `${daysDifference} days` : '');
  };

  const handleMilestoneChange = (e) => {
    setMilestone(e.target.value);
  };

  const handleAddMilestone = () => {
    if (milestone.trim() !== '') {
      setMilestoneList([...milestoneList, milestone]);
      setMilestone('');
    }
  };

  const location = useLocation();
  let { fullName, role } = location.state || {};

  // Check if state is undefined (e.g., on page refresh)
  if (!fullName || !role) {
    // If state is undefined, try to get values from localStorage
    fullName = localStorage.getItem('fullName') || '';
    role = localStorage.getItem('role') || '';
  } else {
    // If state is defined, save values to localStorage
    localStorage.setItem('fullName', fullName);
    localStorage.setItem('role', role);
  }
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
      console.log('Session timeout. Logging out...');
    };

    const resetTimeoutOnUserInteraction = () => {
      resetTimeout();
      document.addEventListener('mousemove', resetTimeout);
      document.addEventListener('keypress', resetTimeout);
    };

    resetTimeoutOnUserInteraction();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('mousemove', resetTimeout);
      document.removeEventListener('keypress', resetTimeout);
    };
  }, [timeoutId]);

  const handleSubmit = (event) => {
    event.preventDefault();
  
    const newProject = {
      projectName,
      projectDescription,
      startDate,
      endDate,
      duration,
      budget,
      resources,
      milestones: milestoneList,
    };
  
    const projectsRef = ref(getDatabase(app), 'projects');
    push(projectsRef, newProject);
  
    clearFormFields();
  
    alert("Project Created Successfully!")
    // Reset the whole page
    window.location.reload();
  };
  

  const clearFormFields = () => {
    setProjectName('');
    setProjectDescription('');
    setStartDate('');
    setEndDate('');
    setBudget('');
    setDuration('');
    setResources([]);
    setMilestone('');
    setMilestoneList([]);
  };

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

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [project, setProject] = useState({
    budget: '',
    duration: '',
    endDate: '',
    milestones: [],
    projectDescription: '',
    projectName: '',
    startDate: '',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsSnapshot = await get(ref(database, 'projects'));
        const projectsData = projectsSnapshot.val();
        const projectsList = Object.keys(projectsData || {}).map((projectId) => ({
          id: projectId,
          name: projectsData[projectId].projectName,
        }));
        setProjects(projectsList);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectSnapshot = await get(ref(database, `projects/${selectedProjectId}`));
        const projectData = projectSnapshot.val();
        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    if (selectedProjectId) {
      fetchProjectData();
    }
  }, [selectedProjectId]);

const handleProjectChange = (e) => {
  const projectId = e.target.value;
  setSelectedProjectId(projectId);

  const projectRef = ref(database, `projects/${projectId}`);

  try {
    onValue(projectRef, (snapshot) => {
      const projectData = snapshot.val();
      setProject(projectData || {});
    });
  } catch (error) {
    console.error('Error fetching project data:', error);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    // If the input being changed is 'budget', format the value with commas
    if (name === 'budget') {
      const formattedValue = value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setProject((prevProject) => ({ ...prevProject, [name]: formattedValue }));
    } else {
      // Update other fields as usual
      setProject((prevProject) => ({ ...prevProject, [name]: value }));
    }
  
    // If the input being changed is either 'startDate' or 'endDate', calculate and update 'duration'
    if (name === 'startDate' || name === 'endDate') {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
  
      // Calculate the difference in days
      const timeDifference = endDate.getTime() - startDate.getTime();
      const durationInDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  
      // Update the 'duration' field
      setProject((prevProject) => ({ ...prevProject, duration: `${durationInDays} days` }));
    }
  };


  const handleProjectStatusChange = (status) => {
    // Update the status in the local state
    setProject({
      ...project,
      status: status,
    });
  };
  
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Ensure the `status` property is in the `project` object
      const updatedProject = { ...project, status: project.status };
  
      await update(ref(database, `projects/${selectedProjectId}`), updatedProject);
      alert('Project updated successfully!');
      window.location.reload();
      
      setProject({
        duration: '',
        endDate: '',
        projectDescription: '',
        startDate: '',
        projectName: '', // Corrected property name
        budget: '',
        status: '', // Reset the status to an empty string or your default value
      });
      setSelectedProjectId('');
  
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };
  

  const ResetManage = async (e) => {
    e.preventDefault();
      setProject({
        ...project,
        duration: '',
        endDate: '',
        projectDescription: '',
        startDate: '',
        projectName: '', // Corrected property name
        budget: '',
        status: '', // Reset the status to an empty string or your default value
      });
      setSelectedProjectId(''); 
  };
  const DeleteProject = async (e) => {
    e.preventDefault();
  
    if (!selectedProjectId) {
      console.error('No project selected to delete.');
      return;
    }
  
    try {
      // Get a reference to the projects node in your Firebase database
      const projectsRef = ref(getDatabase(app), `projects/${selectedProjectId}`);
  
      // Use the reference to remove the selected project by ID
      await remove(projectsRef);
  
      // Clear the selected project and reset its properties
      setProject({
        duration: '',
        endDate: '',
        projectDescription: '',
        startDate: '',
        projectName: '', // Corrected property name
        budget: '',
        status: '', // Reset the status to an empty string or your default value
      });
      setSelectedProjectId('');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting project:', error.message);
    }
  };
  
  const handleNewSupplierSubmit = async (event) => {
    event.preventDefault();

    const formData = {
      supplierName: event.target.suppliername.value,
      contactPerson: event.target.contactperson.value,
      email: event.target.email.value,
      phoneNumber: event.target.phonenumber.value,
      address: event.target.address.value,
      city: event.target.city.value,
      state: event.target.state.value,
      postalCode: event.target.postalcode.value,
    };

    const suppliersRef = ref(getDatabase(app), 'suppliers');

    try {
      await push(suppliersRef, formData);
      alert('Supplier added successfully');
      clearNewSupplierFormFields();
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const clearNewSupplierFormFields = () => {
    // Reset form fields here
    document.getElementById('newsupplier').reset();
  };
  
  const [toolName, setToolName] = useState('');
  const [toolStock, setToolStock] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [toolPrice, setToolPrice] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolCategory, setToolCategory] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const suppliersRef = ref(getDatabase(app), 'suppliers');
  
    const unsubscribe = onValue(suppliersRef, (snapshot) => {
      const suppliersData = snapshot.val();
      const suppliersArray = suppliersData ? Object.values(suppliersData) : [];
  
      // Log the suppliers array for debugging
      console.log('Suppliers Array:', suppliersArray);
  
      setSuppliers(suppliersArray);
    });
  
    return () => {
      unsubscribe();
    };
  }, []);

  const handleNewToolSubmit = async (event) => {
    event.preventDefault();
  
    // Remove commas before parsing
    const parsedStock = parseInt(toolStock.replace(/,/g, ''), 10);
    const parsedPrice = parseFloat(toolPrice.replace(/,/g, ''));
  
    // Use the supplierName directly from the selected option
    const supplierName = event.target.newtoolsupplierselect.value;
  
    const newTool = {
      toolName,
      toolStock: parsedStock.toLocaleString(),
      supplierName,
      toolPrice: parsedPrice.toLocaleString(),
      toolDescription,
      toolCategory,
    };
  
    const toolsRef = ref(getDatabase(app), 'tools');
  
    try {
      await push(toolsRef, newTool);
      alert('Tool added successfully');
      
      // Reset form fields after successful submission
      clearNewToolFormFields();
    } catch (error) {
      console.error('Error adding tool:', error);
    }
  };
  
  const clearNewToolFormFields = () => {
    console.log('Clearing form fields...');
    document.getElementById('newtool').reset();
    setToolPrice(''); // Clear the state for toolPrice
    setToolStock(''); // Clear the state for toolStock
  };
  
  const formatPrice = (input) => {
    // Remove existing commas and convert to a number
    const numberValue = parseFloat(input.replace(/,/g, ''));
  
    // Format the number with commas and set the state
    setToolPrice(numberValue.toLocaleString('en-US', { style: 'decimal' }));
  };
  
  const formatStock = (input) => {
    // Remove existing commas and convert to a number
    const numberValue = parseFloat(input.replace(/,/g, ''));
  
    // Format the number with commas and set the state
    setToolStock(numberValue.toLocaleString('en-US', { style: 'decimal' }));
  };

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [updateForm, setUpdateForm] = useState({
    supplierName: '',
    contactPerson: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    email: '',
    phoneNumber: '',
    // Add more fields as needed
  });

  useEffect(() => {
    const fetchData = async () => {
      const suppliersRef = ref(database, 'suppliers');
    
      try {
        onValue(suppliersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setSuppliers(Object.entries(data).map(([id, supplier]) => ({ id, ...supplier })));
          }
        });
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      }
    };

    fetchData();
  }, []);

  const handleSelectChange = (event) => {
    const selectedId = event.target.value;
    setSelectedSupplierId(selectedId);

    // Load existing data into update form fields
    const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedId);
    setUpdateForm(selectedSupplier || { supplierName: '', contactPerson: '', address: '', city: '', state: '', postalCode: '', email: '', phoneNumber: '', });
  };

  const handleUpdateSupplierChange = (event) => {
    const { name, value } = event.target;
    setUpdateForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSupplierUpdate = async () => {
    try {
      const updateRef = ref(database, `suppliers/${selectedSupplierId}`);
      await update(updateRef, updateForm);
      alert('Supplier information updated successfully!');
      clearSupplierUpdate();
    } catch (error) {
      console.error('Error updating supplier information:', error);
    }
  };

  
  // Function to handle form submission
  const clearSupplierUpdate = () => {
    // Your logic for updating the supplier goes here
    
    // After successfully updating, reset the form
    setUpdateForm({
      contactPerson: '',
      email: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
    });
  };

    // Function to handle form submission
    const DeleteSupplier = async () => {
      // Assuming you have a selected supplier ID
      if (!selectedSupplierId) {
        console.error('No supplier selected to delete.');
        return;
      }
    
      try {
        // Get a reference to the suppliers node in your Firebase database
        const suppliersRef = ref(getDatabase(app), `suppliers/${selectedSupplierId}`);
    
        // Use the reference to remove the selected supplier by ID
        await remove(suppliersRef);
    
        // After successfully updating, reset the form
        setUpdateForm({
          contactPerson: '',
          email: '',
          phoneNumber: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
        });
    
        // Optionally, you might want to clear the selected supplier ID
        setSelectedSupplierId('');
      } catch (error) {
        console.error('Error deleting supplier:', error.message);
      }
    };
    
    

  const [tools, setTools] = useState([]);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [updateToolForm, setUpdateToolForm] = useState({
    toolName: '',
    toolCategory: '',
    toolDescription: '',
    toolPrice: '',
    toolStock: '',
    supplierName: '',
    // Add more fields as needed
  });

  useEffect(() => {
    const fetchData = async () => {
      const toolsRef = ref(database, 'tools');

      try {
        onValue(toolsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setTools(Object.entries(data).map(([id, tool]) => ({ id, ...tool })));
          }
        });
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      }
    };

    fetchData();
  }, []);

  const handleToolSelectChange = (event) => {
    const selectedId = event.target.value;
    setSelectedToolId(selectedId);

    // Load existing data into update form fields
    const selectedTool = tools.find((tool) => tool.id === selectedId);
    setUpdateToolForm(selectedTool || { toolName: '', toolCategory: '' });
  };

  const handleToolInputChange = (event) => {
    const { name, value } = event.target;

    // Format price and stock fields with commas
    const formattedValue = name === 'toolPrice' || name === 'toolStock' ? ToolformatNumber(value) : value;

    setUpdateToolForm((prevForm) => ({ ...prevForm, [name]: formattedValue }));
  };

  const ToolformatNumber = (value) => {
    // Remove existing commas and format the number
    const number = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(number)) {
      return number.toLocaleString(); // Format the number with commas
    }
    return value;
  };

  const handleToolUpdate = async () => {
    try {
      const updateRef = ref(database, `tools/${selectedToolId}`);
      await update(updateRef, updateToolForm);
      
      console.log('Tool information updated successfully!');
  
      // Clear the form data after successful submission
      setUpdateToolForm({
        toolStock: '',
        supplierName: '', // If needed, reset the supplierName as well
        toolPrice: '',
        toolDescription: '',
        toolCategory: '',
      });
  
      // You might also want to reset the selectedToolId if needed
      // setSelectedToolId(null);
    } catch (error) {
      console.error('Error updating tool information:', error);
    }
  };

  const [documentType, setDocumentType] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [documents, setDocuments] = useState([]);

  const DeleteTool = async () => {
    // Assuming you have a selected tool ID
    if (!selectedToolId) {
      console.error('No tool selected to delete.');
      return;
    }
  
    try {
      // Get a reference to the tools node in your Firebase database
      const toolsRef = ref(getDatabase(app), `tools/${selectedToolId}`);
  
      // Use the reference to remove the selected tool by ID
      await remove(toolsRef);
  
      // After successfully updating, reset the form
      setUpdateForm({
        toolStock: '',
        supplierName: '',
        toolPrice: '',
        toolDescription: '',
        toolCategory: '',
      });
  
      // Optionally, you might want to clear the selected tool ID
      setSelectedToolId('');
    } catch (error) {
      console.error('Error deleting tool:', error.message);
    }
  };
  

  useEffect(() => {
    // Get a reference to the 'documents' node in the database
    const databaseRef = ref(database, 'documents');

    // Listen for changes in the database
    onValue(databaseRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const documentsArray = Object.entries(data).map(([key, value]) => ({ key, ...value }));
        setDocuments(documentsArray);
      }
    });
  }, []);

  const handleUploadDocsFileChange = (event) => {
    // Handle file selection
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUploadDocsFormSubmit = async (event) => {
    event.preventDefault();

    // Get a reference to the 'documents' node in the database
    const databaseRef = ref(database, 'documents');

    // Push data to the database
    const newDocumentRef = push(databaseRef, {
      documentType,
      documentTitle,
      documentContent,
    });

    // Get the newly generated document ID
    const documentId = newDocumentRef.key;

    // Upload the file to Firebase Storage
    if (selectedFile) {
      const storageReference = storageRef(storage, `documents/${documentId}/${selectedFile.name}`);
      await uploadBytes(storageReference, selectedFile);
      alert("Document Uploaded Successfully!")
      // Get the download URL of the uploaded file
      const downloadURL = await getDownloadURL(storageReference);

      // Update the database with the file URL
      update(newDocumentRef, { fileURL: downloadURL });
    }

    // Reset form fields
    setDocumentType('');
    setDocumentTitle('');
    setDocumentContent('');
    setSelectedFile('');
  };


  const handleDelete = async (document) => {
    // Remove the document from the database
    await remove(ref(database, `documents/${document.key}`));

    // After deleting, update the state to trigger a re-render
    setDocuments((prevDocuments) => prevDocuments.filter((doc) => doc.key !== document.key));
  };



  const [inspections, setInspections] = useState([]);

  // Assume inspectionsData is fetched from your database
  useEffect(() => {
    // Fetch inspections data from your database
    // Replace the following with your actual database fetching logic
    const fetchData = async () => {
      try {
        // Assuming you have a 'inspections' node in your database
        const inspectionsRef = ref(getDatabase(), 'inspections');
        const snapshot = await get(inspectionsRef);
        const data = [];
        snapshot.forEach((childSnapshot) => {
          data.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setInspections(data);
      } catch (error) {
        console.error('Error fetching inspections:', error);
      }
    };

    fetchData();
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

  const [reports, setReports] = useState([]);
  
  useEffect(() => {
    const reportsRef = ref(database, 'qualityControlReports');

    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const reportsData = snapshot.val();
      const reportsArray = reportsData ? Object.values(reportsData) : [];
      setReports(reportsArray);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [attendanceLogs, setAttendanceLogs] = useState([]);

  useEffect(() => {
    // Fetch attendance logs from Firebase Realtime Database
    const attendanceLogsRef = ref(database, 'attendanceLogs');

    onValue(attendanceLogsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the object of objects to an array of objects
        const logsArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setAttendanceLogs(logsArray);
      }
    });
  }, []);

  const [workOrders, setWorkOrders] = useState([]);

  useEffect(() => {
    // Fetch work orders from Firebase Realtime Database
    const workOrdersRef = ref(database, 'workorders');

    onValue(workOrdersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the object of objects to an array of objects
        const ordersArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setWorkOrders(ordersArray);
      }
    });
  }, []);


  useEffect(() => {
    // Fetch invoices from Firebase Realtime Database
    const invoicesRef = ref(database, 'invoices');

    onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the object of objects to an array of objects
        const invoicesArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setInvoices(invoicesArray);
      }
    });
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
      <Link to="/Login" className="nav__link">
      Login
      </Link>
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  

  const navigate = useNavigate();

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


  const updateStatus = (invoiceId, newStatus) => {
    const invoicesRef = ref(database, 'invoices');
    update(invoicesRef, { [invoiceId + '/status']: newStatus });
  };

  useEffect(() => {
    const invoicesRef = ref(database, 'invoices');

    const onDataChange = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const invoicesArray = Object.entries(data).map(([key, value]) => ({ id: key, ...value }));
        setInvoices(invoicesArray);
      }
    };

    onValue(invoicesRef, onDataChange);

    return () => {
      off(invoicesRef, 'value', onDataChange);
    };
  }, []);

  const [activeTab, setActiveTab] = useState('#dashboard');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
  
  



  const [blueprints, setBlueprints] = useState([]);

  useEffect(() => {
    // Fetch blueprints from Firebase Realtime Database
    const db = getDatabase();
    const blueprintsRef = ref(db, 'blueprints');

    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const blueprintsData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setBlueprints(blueprintsData);
      }
    };

    onValue(blueprintsRef, handleData);

    // Cleanup function to unsubscribe from the database when the component unmounts
    return () => {
      onValue(blueprintsRef, handleData);
    };
  }, []);

  const handleDeleteBlueprint = async (blueprintId) => {
    // Delete blueprint from Firebase Realtime Database
    const db = getDatabase();
    const blueprintRef = ref(db, 'blueprints/' + blueprintId);
    await remove(blueprintRef);

    // Update the state to reflect the deletion
    setBlueprints((prevBlueprints) =>
      prevBlueprints.filter((blueprint) => blueprint.id !== blueprintId)
    );
  };

  const [designSpecifications, setDesignSpecifications] = useState([]);

  useEffect(() => {
    // Fetch design specifications from Firebase Realtime Database
    const db = getDatabase();
    const designSpecsRef = ref(db, 'designspecification');

    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const designSpecsData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setDesignSpecifications(designSpecsData);
      }
    };

    onValue(designSpecsRef, handleData);

    // Cleanup function to unsubscribe from the database when the component unmounts
    return () => {
      onValue(designSpecsRef, handleData);
    };
  }, []);

  const handleDeleteDesignSpec = async (designSpecId) => {
    // Delete design specification from Firebase Realtime Database
    const db = getDatabase();
    const designSpecRef = ref(db, 'designspecification/' + designSpecId);
    await remove(designSpecRef);

    // Update the state to reflect the deletion
    setDesignSpecifications((prevDesignSpecs) =>
      prevDesignSpecs.filter((designSpec) => designSpec.id !== designSpecId)
    );
  };

  const [forms, setForms] = useState([]);

  useEffect(() => {
    // Fetch forms from Firebase Realtime Database
    const db = getDatabase();
    const formsRef = ref(db, 'form');

    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formsData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setForms(formsData);
      }
    };

    onValue(formsRef, handleData);

    // Cleanup function to unsubscribe from the database when the component unmounts
    return () => {
      onValue(formsRef, handleData);
    };
  }, []);

  const handleDeleteForm = async (formId) => {
    // Delete form from Firebase Realtime Database
    const db = getDatabase();
    const formRef = ref(db, 'form/' + formId);
    await remove(formRef);

    // Update the state to reflect the deletion
    setForms((prevForms) =>
      prevForms.filter((form) => form.id !== formId)
    );
  };

  const [permits, setPermits] = useState([]);

  useEffect(() => {
    // Fetch permits from Firebase Realtime Database
    const db = getDatabase();
    const permitsRef = ref(db, 'permit');

    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const permitsData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setPermits(permitsData);
      }
    };

    onValue(permitsRef, handleData);

    // Cleanup function to unsubscribe from the database when the component unmounts
    return () => {
      onValue(permitsRef, handleData);
    };
  }, []);

  const handleDeletePermit = async (permitId) => {
    // Delete permit from Firebase Realtime Database
    const db = getDatabase();
    const permitRef = ref(db, 'permit/' + permitId);
    await remove(permitRef);

    // Update the state to reflect the deletion
    setPermits((prevPermits) =>
      prevPermits.filter((permit) => permit.id !== permitId)
    );
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
        onClick={() => handleTabClick('#dashboard')}
        className={activeTab === '#dashboard' ? 'active tab' : 'tab'}
        data-tab-target="#dashboard"
      >
        Dashboard
      </li>
      <li className="tab">
        <div className="dropdown">
          <button className="dropbtn">Projects</button>
          <div className="dropdown-content">
            <a
              id="createProjectTab"
              onClick={() => handleTabClick('#createprojects')}
              className={activeTab === '#createprojects' ? 'tab active' : 'tab'}
              data-tab-target="#createprojects"
            >
              Create Projects
            </a>
            <a
              onClick={() => handleTabClick('#manageprojects')}
              className={activeTab === '#manageprojects' ? 'tab active' : 'tab'}
              data-tab-target="#manageprojects"
            >
              Manage Projects
            </a>
            <a
              onClick={() => handleTabClick('#projectschedule')}
              className={activeTab === '#projectschedule' ? 'tab active' : 'tab'}
              data-tab-target="#projectschedule"
            >
              Project Schedule
            </a>
          </div>
        </div>
      </li>
      <li className="tab">
        <div className="dropdown">
          <button className="dropbtn">Supplies Management</button>
          <div className="dropdown-content">
            <a onClick={() => handleTabClick('#addnewsupplier')} data-tab-target="#addnewsupplier">
              Add New Supplier
            </a>
            <a onClick={() => handleTabClick('#addnewtool')} data-tab-target="#addnewtool">
              Add New Tool
            </a>
            <a onClick={() => handleTabClick('#editsupplier')} data-tab-target="#editsupplier">
              Edit Supplier
            </a>
            <a onClick={() => handleTabClick('#edittools')} data-tab-target="#edittools">
              Edit Tool
            </a>
            <a onClick={() => handleTabClick('#inventory')} data-tab-target="#inventory">
              Inventory
            </a>
          </div>
        </div>
      </li>
      <li className="tab">
        <div className="dropdown">
          <button className="dropbtn">Document Management</button>
          <div className="dropdown-content">
            <a onClick={() => handleTabClick('#createdocuments')} data-tab-target="#createdocuments">
              Create Documents
            </a>
            <a onClick={() => handleTabClick('#managedocuments')} data-tab-target="#managedocuments">
              Manage Documents
            </a>
          </div>
        </div>
      </li>
      <li className="tab">
        <div className="dropdown">
          <button className="dropbtn">Repository</button>
          <div className="dropdown-content">
            <a onClick={() => handleTabClick('#blueprints')} data-tab-target="#createdocuments">
              Blueprints
            </a>
            <a onClick={() => handleTabClick('#designspecification')} data-tab-target="#managedocuments">
              Design Specification
            </a>
            <a onClick={() => handleTabClick('#permit')} data-tab-target="#managedocuments">
              Permits
            </a>
            <a onClick={() => handleTabClick('#forms')} data-tab-target="#managedocuments">
              Forms
            </a>
          </div>
        </div>
      </li>
      <li
        onClick={() => handleTabClick('#invoiceapproval')}
        className={activeTab === '#invoiceapproval' ? 'active tab' : 'tab'}
        data-tab-target="#invoiceapproval"
      >
        Invoice Approval
      </li>
      <li
        onClick={() => handleTabClick('#workorder')}
        className={activeTab === '#workorder' ? 'active tab' : 'tab'}
        data-tab-target="#workorder"
      >
        Work Order
      </li>
      <li className="tab">
        <div className="dropdown">
          <button className="dropbtn">Reports</button>
          <div className="dropdown-content">
            <a onClick={() => handleTabClick('#inspectionreports')} data-tab-target="#inspectionreports">
              Inspection Reports
            </a>
            <a onClick={() => handleTabClick('#incidentreports')} data-tab-target="#incidentreports">
              Incident Reports
            </a>
            <a onClick={() => handleTabClick('#qualitycontrolplan')} data-tab-target="#qualitycontrolplan">
              Quality Control Reports
            </a>
            <a onClick={() => handleTabClick('#teammemberreports')} data-tab-target="#teammemberreports">
              Team Member Reports
            </a>
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

        {activeTab === '#dashboard' &&  (      
        
        <div id="dashboard" data-tab-content className="active">
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
                                  <th>Start Date</th>
                                  <th>End Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {projectList.map((project) => (
                                  <tr>
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
                  </div>
                  <br />
                </div>
            </div> 
            )}

      </div>

      
      {activeTab === "#createprojects" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Create Project</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form id="createproject" onSubmit={handleSubmit}>
                          <div className="mb-3">
                            <label htmlFor="projectName" className="form-label">Project Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="projectName"
                              autoComplete="off"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              required
                            />
                          </div>
                          <hr/>
                          <div className="mb-3">
                            <label htmlFor="projectDescription" className="form-label">Project Description</label>
                            <textarea
                              className="form-control"
                              id="projectDescription"
                              value={projectDescription}
                              onChange={(e) => setProjectDescription(e.target.value)}
                              required
                            />
                          </div>
                          <hr/>
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label htmlFor="startDate" className="form-label">
                                Start Date
                              </label>
                              <input
                                type="date"
                                className="form-control"
                                id="startDate"
                                value={startDate}
                                onChange={handleStartDateChange}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label htmlFor="endDate" className="form-label">
                                End Date
                              </label>
                              <input
                                type="date"
                                className="form-control"
                                id="endDate"
                                value={endDate}
                                onChange={handleEndDateChange}
                                required
                              />
                            </div>
                            <hr/>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="budget" className="form-label">Budget</label>
                            <input
                              type="text"
                              className="form-control"
                              id="budget"
                              autoComplete="off"
                              value={budget}
                              onChange={handleBudgetChange}
                              required
                            />
                          </div>
                          <hr/>
                          <div className="mb-3">
                            <label htmlFor="duration" className="form-label">
                              Duration
                            </label>
                            <input type="text" className="form-control" id="duration" value={duration} readOnly />
                          </div>
                          <hr/>
                          <div className="mb-3">
                            <label htmlFor="milestones" className="form-label">
                              Milestones
                            </label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                id="milestones"
                                autoComplete="off"
                                value={milestone}
                                onChange={handleMilestoneChange}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                id="addMilestone"
                                onClick={handleAddMilestone}
                              >
                                Add Milestone
                              </button>
                            </div>
                            <div id="milestoneList" className="mt-2">
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {milestoneList.map((item, index) => (
                                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="resources" className="form-label">Resources <br/> (To select multiple resources hold the ctrl and click the desired resources.)</label>
                            <select className="form-select" id="resources" required multiple>
                              {/* List of options */}
                              <option disabled value="Select Resources">Select Resources</option>
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
                            </select>
                          </div>
                          <hr/>
                          <button type="submit" className="btn btn-outline-secondary">Create Project</button>
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

      {activeTab === "#manageprojects" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Manage Project</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">
                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form onSubmit={handleUpdateSubmit}>
                              <div className="mb-3">
                                  <label className="form-label" >
                                      Select Project:
                                  </label>
                                  <select 
                                      className="form-select" 
                                      value={selectedProjectId} 
                                      onChange={handleProjectChange}>
                                      <option value="">
                                          Select a project
                                      </option>
                                      {projects.map((p) => (
                                          <option key={p.id} value={p.id}>
                                          {p.name}
                                          </option>
                                      ))}
                                      </select>
                              </div>
                              <hr/>
                              <div className="mb-3">      
                            <label className="form-label">
                            Project Description:
                            </label>
                              <textarea
                                className="form-control"
                                name="projectDescription"
                                value={project.projectDescription}
                                onChange={handleInputChange}
                              />
                            </div>
                            <hr/>
                              <div className="mb-3">
                              <label className="form-label">
                              Budget:
                            </label>
                            <input
                                type="text"
                                name="budget"
                                className="form-control" 
                                value={project.budget}
                                onChange={handleInputChange}
                              />
                              </div>
                              <hr/>
                          <div className="mb-3">
                          <label>
                              Duration:
                            </label>
                            <input
                                type="text"
                                name="duration"
                                className="form-control" 
                                value={project.duration}
                                onChange={handleInputChange}
                                disabled
                              />
                            </div>     
                          <hr/>            
                            <div className="mb-3"> 
                            <label>
                              Start Date:
                            </label>
                            <input
                              className="form-control"
                                type="date"
                                name="startDate"
                                value={project.startDate}
                                onChange={handleInputChange}
                              />
                            </div>    
                          <hr/>
                            <div className="mb-3">
                            <label>
                              End Date:
                            </label>
                            <input
                                type="date"
                                className="form-control" 
                                name="endDate"
                                value={project.endDate}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="mb-3">
                                  <label className="form-label" >
                                      Select Status:
                                  </label>
                                  <select 
                                    className="form-select" 
                                    value={project.status}
                                    onChange={(e) => handleProjectStatusChange(e.target.value)} // Assuming you have a function to handle status change
                                  >
                                    <option value="">Select Status</option>
                                    <option value="Finished">Finished</option>
                                    <option value="Pending">Pending</option>
                                  </select>
                              </div>
                              <button type="submit" className="btn btn-outline-secondary" disabled={!selectedProjectId}>
                                Update Project
                              </button>

                              <br/><br/>

                              <button type="submit" className="btn btn-outline-secondary" onClick={ResetManage}>
                                Reset
                              </button>

                              <br/><br/>

                              <button type="submit" className="btn btn-outline-secondary" onClick={DeleteProject}>
                                Delete
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

    {activeTab === "#projectschedule" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Project Schedule</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Project Name</th>
                              <th>Duration</th>
                              <th>Start Date</th>
                              <th>End Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectList.map((project) => (
                              <tr>
                                <td>{project.projectName}</td>
                                <td>{project.duration}</td>
                                <td>{project.startDate}</td>
                                <td>{project.endDate}</td>
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

        {activeTab === "#addnewsupplier" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Add New Supplier</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form id="newsupplier" onSubmit={handleNewSupplierSubmit}>
                        <div className="mb-3">
                          <label htmlFor="suppliername" className="form-label">Supplier Name:</label>
                          <input type="text" className="form-control" autoComplete="off" id="suppliername" name="suppliername" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="contactperson" className="form-label">Contact Person:</label>
                          <input type="text" className="form-control" autoComplete="off" id="contactperson" name="contactperson" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">Email:</label>
                          <input type="email" className="form-control" autoComplete="off" id="email" name="email" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="phonenumber" className="form-label">Phone Number:</label>
                          <input type="tel" className="form-control" autoComplete="off" id="phonenumber" name="phonenumber" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="address" className="form-label">Address:</label>
                          <input type="text" className="form-control" autoComplete="off" id="address" name="address" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="city" className="form-label">City:</label>
                          <input type="text" className="form-control" autoComplete="off" id="city" name="city" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="state" className="form-label">State:</label>
                          <input type="text" className="form-control" autoComplete="off" id="state" name="state" required />
                        </div>
                        <hr/>
                        <div className="mb-3">
                          <label htmlFor="postalcode" className="form-label">Postal Code:</label>
                          <input type="text" className="form-control" autoComplete="off" id="postalcode" name="postalcode" required />
                        </div>
                        <hr/>

                        <button type="submit" className="btn btn-outline-secondary">Add Supplier</button>
                        <br/><br/>
                        <button type="submit" className="btn btn-outline-secondary" onClick={clearNewSupplierFormFields}>Reset</button>
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

        {activeTab === "#addnewtool" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Add New Tool</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form id="newtool" onSubmit={handleNewToolSubmit}>
                            <div className="mb-3">
                              <label htmlFor="toolname" className="form-label">Tool Name:</label>
                              <input type="text" className="form-control" autoComplete="off" id="toolname" name="toolname" required onChange={(e) => setToolName(e.target.value)} />
                            </div>
                            <hr/>
                            <div className="mb-3">
                              <label htmlFor="toolstock" className="form-label">Stock:</label>
                              <input
                                type="text"
                                className="form-control"
                                autoComplete="off"
                                id="toolstock"
                                onChange={(e) => formatStock(e.target.value)}
                                value={toolStock}
                              />
                            </div>
                            <hr/>
                            <div className="mb-3">
                              <label htmlFor="newtoolsupplierselect" className="form-label">Select Supplier:</label>
                              <select
                                  id="newtoolsupplierselect"
                                  className="form-select"
                                  onChange={(e) => {
                                    console.log('Selected Supplier ID:', e.target.value);
                                    setSelectedSupplier(e.target.value);
                                  }}
                                >
                                  <option value="" disabled>Select a supplier</option>
                                  {suppliers.map((supplier) => (
                                    <option  key={supplier.supplierId} value={supplier.supplierId}>
                                      {supplier.supplierName} 
                                    </option>
                                  ))}
                                </select>
                            </div>
                            <hr/>
                            <div className="mb-3">
                              <label htmlFor="toolprice">Price:</label>
                              <input
                                type="text"
                                className="form-control"
                                autoComplete="off"
                                id="toolprice"
                                onChange={(e) => formatPrice(e.target.value)}
                                value={toolPrice}
                                />
                            </div>
                            <hr/>
                            <div className="mb-3">
                              <label htmlFor="tooldescription" className="form-label">Description:</label>
                              <textarea className="form-control" id="tooldescription" autoComplete="off" name="tooldescription" rows={3} required defaultValue={""} onChange={(e) => setToolDescription(e.target.value)} />
                            </div>
                            <hr/>
                            <div className="mb-3">
                              <label htmlFor="toolcategory" className="form-label">Category:</label>
                              <input type="text" className="form-control" autoComplete="off" id="toolcategory" name="toolcategory" required onChange={(e) => setToolCategory(e.target.value)} />
                            </div>
                            <hr/>
                            <button className="btn btn-outline-secondary" type="submit">Add Tool</button>
                            <br/><br/>
                            <button type="submit" className="btn btn-outline-secondary" onClick={clearNewToolFormFields}>Reset</button>
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

        {activeTab === "#editsupplier" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Edit Supplier</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form id="editsupplierform">
                              <div className="mb-3">
                                <label htmlFor="newtoolsupplierselect" className="form-label">
                                  Supplier Name:
                                </label>
                                <select
                                  className="form-select"
                                  id="supplierSelect"
                                  onChange={handleSelectChange}
                                  value={selectedSupplierId}
                                >
                                  <option value="">Select a supplier</option>
                                  {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                      {supplier.supplierName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <hr />
                              {/* Add other form fields as you have in your existing code */}
                              <div className="mb-3">
                                <label htmlFor="editsuppliercontactperson" className="form-label">
                                  Contact Person:
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  id="updateContactPerson"
                                  name="contactPerson"
                                  value={updateForm.contactPerson}
                                  onChange={handleUpdateSupplierChange}
                                />
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="editsupplieremail" className="form-label">
                                  Email:
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  id="updateEmail"
                                  name="email"
                                  value={updateForm.email}
                                  onChange={handleUpdateSupplierChange}
                                />
                              </div>
                              <hr />
                          <div className="mb-3">
                            <label htmlFor="editsupplierphonenumber" className="form-label">Phone Number:</label>
                            <input 
                            type="tel" 
                            className="form-control" 
                            id="updatePhoneNumber"
                            name="phoneNumber"
                            value={updateForm.phoneNumber}
                            onChange={handleUpdateSupplierChange}
                          />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="editsupplieraddress" className="form-label">Address:</label>
                            <input 
                            type="text" 
                            className="form-control" 
                            id="updateAddress"
                            name="address"
                            value={updateForm.address}
                            onChange={handleUpdateSupplierChange}
                          />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="editsuppliercity" className="form-label">City:</label>
                            <input 
                            type="text" 
                            className="form-control" 
                            id="updateCity"
                            name="city"
                            value={updateForm.city}
                            onChange={handleUpdateSupplierChange}
                          />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="editsupplierstate" className="form-label">State:</label>
                            <input 
                            type="text" 
                            className="form-control" 
                            id="updateState"
                            name="state"
                            value={updateForm.state}
                            onChange={handleUpdateSupplierChange}
                          />
                          </div>
                          <hr/>
                          <div className="mb-3">
                            <label htmlFor="editsupplierpostalcode" className="form-label">Postal Code:</label>
                            <input 
                            type="text" 
                            className="form-control" 
                            id="updatePostalCode"
                            name="postalCode"
                            value={updateForm.postalCode}
                            onChange={handleUpdateSupplierChange}
                          />
                          </div>
                          <hr />
                          <button type="button" className="btn btn-outline-secondary" onClick={handleSupplierUpdate}>
                            Update Supplier
                          </button>

                          <br/> <br/>

                          <button type="submit" className="btn btn-outline-secondary" onClick={DeleteSupplier}>
                                Delete
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

        {activeTab === "#edittools" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Edit Tools</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form id="edittool">
                          <div className="mb-3">
                            <label htmlFor="edittoolselect" className="form-label">Select Tool:</label>
                            <select className="form-select" onChange={handleToolSelectChange} value={selectedToolId || ''}>
                              <option value="">Select a tool</option>
                              {tools.map((tool) => (
                                <option key={tool.id} value={tool.id}>
                                  {tool.toolName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="edittoolstock" className="form-label">Stock:</label>
                            <input type="text" className="form-control" name="toolStock" value={updateToolForm.toolStock} onChange={handleToolInputChange} />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="edittoolsupplierselect" className="form-label">Select Supplier:</label>
                            <input
                                type="text"
                                name="supplierName"
                                className="form-control"
                                value={updateToolForm.supplierName}
                                onChange={handleToolInputChange}
                                disabled
                              />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="edittoolprice" className="form-label">Price:</label>
                            <input type="text" className="form-control" name="toolPrice" value={updateToolForm.toolPrice} onChange={handleToolInputChange} />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="edittooldescription" className="form-label">Description:</label>
                            <textarea className="form-control" name="toolDescription" value={updateToolForm.toolDescription} onChange={handleToolInputChange} />
                          </div>
                          <hr />
                          <div className="mb-3">
                            <label htmlFor="edittoolcategory" className="form-label">Category:</label>
                            <input type="text" className="form-control" name="toolCategory" value={updateToolForm.toolCategory} onChange={handleToolInputChange} />

                          </div>
                          <hr />
                          <button className="btn btn-outline-secondary" type="button" onClick={handleToolUpdate}>Update Tool</button>
                          <br/> <br/>
                          <button type="submit" className="btn btn-outline-secondary" onClick={DeleteTool}>
                                Delete
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

        {activeTab === "#inventory" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Inventory</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">
                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
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
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Supplier Name</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tools.map((tool) => (
                                <tr key={tool.id}>
                                  <td>{tool.toolName}</td>
                                  <td>{tool.toolCategory}</td>
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

        {activeTab === "#createdocuments" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Create Documents</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <form id="createDocumentForm" onSubmit={handleUploadDocsFormSubmit}>
                            <div className="mb-3">
                              <label htmlFor="documentType" className="form-label">
                                Document Type:
                              </label>
                              <select
                                id="documentType"
                                name="documentType"
                                className="form-select"
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                              >
                                <option value="Contract">Contract</option>
                                <option value="Change Order">Change Order</option>
                                <option value="Submittal">Submittal</option>
                              </select>
                            </div>

                            <div className="mb-3">
                              <label htmlFor="documentTitle" className="form-label">
                                Document Title:
                              </label>
                              <input
                                type="text"
                                id="documentTitle"
                                autoComplete="off"
                                name="documentTitle"
                                className="form-control"
                                value={documentTitle}
                                onChange={(e) => setDocumentTitle(e.target.value)}
                              />
                            </div>

                            <div className="mb-3">
                              <label htmlFor="documents" className="form-label">
                                Upload Document:
                              </label>
                              <input
                                type="file"
                                id="documents"
                                autoComplete="off"
                                name="documents"
                                className="form-control"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                onChange={handleUploadDocsFileChange}
                              />
                            </div>

                            <div className="mb-3">
                              <label htmlFor="documentContent" className="form-label">
                                Document Content:
                              </label>
                              <textarea
                                id="documentContent"
                                autoComplete="off"
                                name="documentContent"
                                className="form-control"
                                value={documentContent}
                                onChange={(e) => setDocumentContent(e.target.value)}
                              />
                            </div>

                            <button type="submit" className="btn btn-outline-secondary">
                              Create Document
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

        {activeTab === "#managedocuments" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Manage Documents</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table id="documentTable" className="table">
                          <thead>
                            <tr>
                              <th>Document Title</th>
                              <th>Document Type</th>
                              <th>Document Content</th>
                              <th>File URL</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((document) => (
                              <tr key={document.key}>
                                <td>{document.documentTitle}</td>
                                <td>{document.documentType}</td>
                                <td>{document.documentContent}</td>
                                <td>
                                  <a href={document.fileURL} target="_blank" rel="noopener noreferrer">
                                    View File
                                  </a>
                                </td>
                                <td>
                                <button className="btn btn-danger" onClick={() => handleDelete(document)}>
                                      Delete
                                    </button>
                                </td>
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

      {activeTab === "#blueprints" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Blueprints</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table id="blueprintTable" className="table">
                            <thead>
                              <tr>
                                <th>Project Name</th>
                                <th>Action</th>
                                <th>Delete</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blueprints.map((blueprint) => (
                                <tr key={blueprint.id}>
                                  <td>{blueprint.projectName}</td>
                                  <td>
                                    <a href={blueprint.fileURL} target="_blank" rel="noopener noreferrer">
                                      View File
                                    </a>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-danger"
                                      onClick={() => handleDeleteBlueprint(blueprint.id)}
                                    >
                                      Delete
                                    </button>
                                  </td>
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

      {activeTab === "#designspecification" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Design Specification</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table id="designSpecTable" className="table">
                          <thead>
                            <tr>
                              <th>Project Name</th>
                              <th>Action</th>
                              <th>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {designSpecifications.map((designSpec) => (
                              <tr key={designSpec.id}>
                                <td>{designSpec.projectName}</td>
                                <td>
                                  <a href={designSpec.fileURL} target="_blank" rel="noopener noreferrer">
                                    View File
                                  </a>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeleteDesignSpec(designSpec.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
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

      {activeTab === "#permit" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Permits</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table id="permitTable" className="table">
                          <thead>
                            <tr>
                              <th>Project Name</th>
                              <th>Action</th>
                              <th>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permits.map((permit) => (
                              <tr key={permit.id}>
                                <td>{permit.projectName}</td>
                                <td>
                                  <a href={permit.fileURL} target="_blank" rel="noopener noreferrer">
                                    View File
                                  </a>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeletePermit(permit.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
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

      {activeTab === "#forms" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Forms</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table id="formTable" className="table">
                          <thead>
                            <tr>
                              <th>Project Name</th>
                              <th>Action</th>
                              <th>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {forms.map((form) => (
                              <tr key={form.id}>
                                <td>{form.projectName}</td>
                                <td>
                                  <a href={form.fileURL} target="_blank" rel="noopener noreferrer">
                                    View File
                                  </a>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeleteForm(form.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
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


        {activeTab === "#invoiceapproval" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Invoice Approval</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
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
                              <th>Invoice Date</th>
                              <th>Due Date</th>
                              <th>Project Name</th>
                              <th>Subcontractor</th>
                              <th>Notes</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((invoice) => (
                              <tr key={invoice.id}>
                                <td>{invoice.invoiceNumber}</td>
                                <td>{invoice.amountDue}</td>
                                <td>{invoice.invoiceDate}</td>
                                <td>{invoice.paymentDueDate}</td>
                                <td>{invoice.projectName}</td>
                                <td>{invoice.subcontractorName}</td>
                                <td>{invoice.notes}</td>
                                <td>
                                  {/* Dropdown for selecting status */}
                                  <select
                                    value={invoice.status}
                                    onChange={(e) => updateStatus(invoice.id, e.target.value)}
                                  >
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                    {/* Add other status options as needed */}
                                  </select>
                                </td>
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

        {activeTab === "#workorder" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Work Order</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Assigned To</th>
                              <th>Description</th>
                              <th>End Date</th>
                              <th>Materials</th>
                              <th>Project</th>
                              <th>Start Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workOrders.map((order) => (
                              <tr key={order.id}>
                                <td>{order.assignedTo}</td>
                                <td>{order.description}</td>
                                <td>{order.endDate}</td>
                                <td>{order.materials}</td>
                                <td>{order.project}</td>
                                <td>{order.startDate}</td>
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

        {activeTab === "#inspectionreports" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Inspection Reports</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
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

      {activeTab === "#incidentreports" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Incident Reports</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Incident Date</th>
                              <th>Location</th>
                              <th>Reporter Name</th>
                              <th>Reporter Contact</th>
                              <th>Description</th>
                              <th>Actions Taken</th>
                              <th>Witnesses</th>
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
            {/* Add form, input fields, or any other content as needed */}
          </div>
        )} 

      {activeTab === "#qualitycontrolplan" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Quality Control Plan</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
             <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table className="table">
                            <thead>
                              <tr>
                                <th>Project Name</th>
                                <th>Inspection Date</th>
                                <th>Inspector Name</th>
                                <th>Defects Found</th>
                                <th>Actions Taken</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reports.map((report) => (
                                <tr key={report.id}>
                                  <td>{report.projectName}</td>
                                  <td>{report.inspectionDate}</td>
                                  <td>{report.inspectorName}</td>
                                  <td>{report.defects}</td>
                                  <td>{report.actionsTaken}</td>
                                  <td>{report.remarks}</td>
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

      {activeTab === "#teammemberreports" && (
          <div>
            {/* Add your content for creating projects here */}
            <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
            <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
              <h2 className="fs-2 m-0"><b>Team Member Reports</b></h2>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item dropdown">

                  </li>
                </ul>
              </div>
            </nav>
            <div className="row">
              <div className ="adj">
                <div className="col-lg-12">
                  <div className="card radius-10">
                    <div className="card-body">
                      <div >
                        <div>
                        <table className="table">
                            <thead>
                              <tr>
                                <th>Date Today</th>
                                <th>Full Name</th>
                                <th>Time In</th>
                                <th>Time Out</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceLogs.map((log) => (
                                <tr key={log.id}>
                                  <td>{log.dateToday}</td>
                                  <td>{log.fullName}</td>
                                  <td>{log.timeIn}</td>
                                  <td>{log.timeOut}</td>
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
  );
};

export default ProjectManager;
