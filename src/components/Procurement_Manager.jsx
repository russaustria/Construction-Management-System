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
  onValue,
  push,
  update,
  remove,
  ref,
  off, // Fix: Remove the duplicated import
} from 'firebase/database';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ProcurementManager = () => {

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

    const [supplierName, setSupplierName] = useState('');
const [contactPerson, setContactPerson] = useState('');
const [phoneNumber, setPhoneNumber] = useState('');
const [address, setAddress] = useState('');
const [city, setCity] = useState('');
const [state, setState] = useState('');
const [postalCode, setPostalCode] = useState('');

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
    window.location.reload();
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
    window.location.reload();
    
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
    window.location.reload();
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
    window.location.reload();

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

const [purchaseformData, setpurchaseformData] = useState({
  product: '',
  description: '',
  quantity: '',
  price: '',
  total: '',
});

useEffect(() => {
  // Set default values for description and product
  setpurchaseformData((prevData) => ({
    ...prevData,
    product: '',
    description: '',
  }));
}, []);
const purchasehandleInputChange = (e) => {
  const { id, value } = e.target;

  // Format quantity and price with commas
  let formattedValue = value;
  if (id === 'quantity' || id === 'price') {
    formattedValue = value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Update purchaseformData
  setpurchaseformData((prevData) => ({
    ...prevData,
    [id]: formattedValue,
  }));

  // Recalculate total if both quantity and price are present
  if (id === 'quantity' || id === 'price') {
    const parsedQuantity = parseInt(purchaseformData.quantity.replace(/,/g, ''), 10) || 0;
    const parsedPrice = parseInt(purchaseformData.price.replace(/,/g, ''), 10) || 0;
    const calculatedTotal = parsedQuantity * parsedPrice;
    setpurchaseformData((prevData) => ({
      ...prevData,
      total: calculatedTotal.toLocaleString(), // Format total with commas
    }));
  }
};

const handlepruchaseFormSubmit = async (e) => {
  e.preventDefault();

  try {
    // Use the "purchase" database
    const databaseRef = ref(database, 'purchase');
    await push(databaseRef, purchaseformData);

    setpurchaseformData({
      product: '',
      description: '',
      quantity: '',
      price: '',
      total: '',
    });

    alert('Purchase Order Made Successfully!');
    window.location.reload();
  } catch (error) {
    console.error('Error submitting data:', error);
  }
};

const [purchaseData, setPurchaseData] = useState([]);

useEffect(() => {
  // Replace 'your/path/to/purchase' with the actual path in your Firebase database
  const purchaseRef = ref(database, 'purchase');

  // Attach an asynchronous callback to read the data
  const fetchData = async () => {
    try {
      onValue(purchaseRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPurchaseData(Object.values(data));
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();

  // Clean up the event listener when the component unmounts
  return () => {
    // Detach the callback when the component unmounts
    // This helps avoid memory leaks
    off(purchaseRef);
  };
}, []); // Empty dependency array to run the effect only once on mount

const [projects, setProjects] = useState([]);
const [selectedProject, setSelectedProject] = useState('');
const [itemName, setItemName] = useState('');
const [itemDescription, setItemDescription] = useState('');
const [quantity, setQuantity] = useState('');
const [procurementprice, setProcurementPrice] = useState('');
const [deliveryDate, setDeliveryDate] = useState('');

useEffect(() => {
  const fetchData = async () => {
    const db = getDatabase(app);
    const projectsRef = ref(db, 'projects'); // Update 'projects' to your actual database path
    onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.keys(data).map((projectId) => ({
          id: projectId,
          ...data[projectId],
        }));
        setProjects(projectList);
      }
    });
  };

  fetchData();

  // Cleanup function to remove the event listener when the component unmounts
  return () => {
    // Update with the reference to the same path used above
    off(ref(getDatabase(app), 'projects'));
  };
}, []); // Empty dependency array to run the effect only once on mount

const handleProcurementQuantityChange = (e) => {
  const formattedValue = e.target.value.replace(/,/g, ''); // Remove commas
  setQuantity(formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')); // Add commas
};

const handleProcurementPriceChange = (e) => {
  const formattedValue = e.target.value.replace(/,/g, ''); // Remove commas
  setProcurementPrice(formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')); // Add commas
};

const handleProcurementSubmit = async (e) => {
  e.preventDefault();

  // Construct the data object to be pushed to the database
  const procurementData = {
    projectName: selectedProject,
    itemName,
    itemDescription,
    quantity,
    procurementprice,
    deliveryDate,
  };

  // Push data to the 'procurements' path in the database
  const db = getDatabase(app);
  const procurementRef = ref(db, 'procurements'); // Update 'procurements' to your desired database path
  await push(procurementRef, procurementData);
  alert("Procurement Request Made Successfully!")
  window.location.reload();

  // Reset form fields after submission
  setSelectedProject('');
  setItemName('');
  setItemDescription('');
  setQuantity('');
  setProcurementPrice('');
  setDeliveryDate('');
};

const [procurements, setProcurements] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    const db = getDatabase(app);
    const procurementsRef = ref(db, 'procurements'); // Update to your actual database path
    onValue(procurementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const procurementList = Object.keys(data).map((procurementId) => ({
          id: procurementId,
          ...data[procurementId],
        }));
        setProcurements(procurementList);
      }
    });
  };

  fetchData();

  // Cleanup function to remove the event listener when the component unmounts
  return () => {
    const db = getDatabase(app);
    const procurementsRef = ref(db, 'procurements');
    off(procurementsRef);
  };
}, []);

const navigate = useNavigate();
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

            <li className="tab">
                <div className="dropdown">
                    <button className="dropbtn">Purchase Order</button>
                    <div className="dropdown-content">

                    <li
                    data-tab-target="#NewPurchaseOrder"
                    className={activeTab === "#NewPurchaseOrder" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#NewPurchaseOrder")}
                    >
                    New Purchase Order
                    </li>

                <li
                data-tab-target="#PurchaseOrder"
                className={activeTab === "#PurchaseOrder" ? "active tab" : "tab"}
                onClick={() => handleTabClick("#PurchaseOrder")}
                >
                Purchase Order
                </li>
                </div>
             </div>
          </li>

          <li className="tab">
                <div className="dropdown">
                    <button className="dropbtn">Procurement Request</button>
                    <div className="dropdown-content">

                    <li
                    data-tab-target="#NewProcurementRequest"
                    className={activeTab === "#NewProcurementRequest" ? "active tab" : "tab"}
                    onClick={() => handleTabClick("#NewProcurementRequest")}
                    >
                    New Procurement Request
                    </li>

                <li
                data-tab-target="#ProcurementRequest"
                className={activeTab === "#ProcurementRequest" ? "active tab" : "tab"}
                onClick={() => handleTabClick("#ProcurementRequest")}
                >
                Procurement Requests
                </li>
                </div>
             </div>
          </li>

        <li className="tab">
            <div className="dropdown">
                <button className="dropbtn">Supplies Management</button>
                <div className="dropdown-content">

                <li
                data-tab-target="#addnewsupplier"
                className={activeTab === "#addnewsupplier" ? "active tab" : "tab"}
                onClick={() => handleTabClick("#addnewsupplier")}
                >
                Add New Supplier
                </li>

              <li
              data-tab-target="#addnewtool"
              className={activeTab === "#addnewtool" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#addnewtool")}
            >
              Add New Tool
            </li>

              <li
              data-tab-target="#editsupplier"
              className={activeTab === "#editsupplier" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#editsupplier")}
            >
              Edit Supplier
            </li>

              <li
              data-tab-target="#edittools"
              className={activeTab === "#edittools" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#edittools")}
            >
              Edit Tools
            </li>

              <li
              data-tab-target="#inventory"
              className={activeTab === "#inventory" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#inventory")}
            >
              Inventory
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
              </div>
              {/* Add form, input fields, or any other content as needed */}
            </div>
          )}

          {activeTab === "#NewPurchaseOrder" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>New Purchase Order</b></h1>
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
                         <form id="purchaseOrderForm" className="form-container" onSubmit={handlepruchaseFormSubmit}>
                            <div className="mb-3">
                                <label htmlFor="product" className="form-label">
                                  Product:
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="product"
                                  value={purchaseformData.product} // Update this line
                                  onChange={purchasehandleInputChange}
                                  required
                                />
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="description" className="form-label">
                                  Project Description:
                                </label>
                                <textarea
                                  className="form-control"
                                  id="description"
                                  rows={4}
                                  value={purchaseformData.description} // Update this line
                                  onChange={purchasehandleInputChange}
                                  required
                                />
                              </div>
                            <hr />
                            <div className="mb-3">
                                <label htmlFor="quantity" className="form-label">
                                  Quantity:
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="quantity"
                                  value={purchaseformData.quantity}
                                  onChange={purchasehandleInputChange}
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="price" className="form-label">
                                  Price:
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="price"
                                  value={purchaseformData.price}
                                  onChange={purchasehandleInputChange}
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="total" className="form-label">
                                  Total:
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="total"
                                  value={purchaseformData.total}
                                  readOnly
                                  required
                                />
                              </div>
                            <hr />
                              <button type="submit" className="btn btn-outline-secondary">
                                Submit
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
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {purchaseData.map((purchase) => (
                                <tr key={purchase.id}>
                                  <td>{purchase.description}</td>
                                  <td>{purchase.product}</td>
                                  <td>{purchase.quantity}</td>
                                  <td>{purchase.price}</td>
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

        {activeTab === "#NewProcurementRequest" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>New Procurement Request</b></h1>
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
                          <form id="procurement" onSubmit={handleProcurementSubmit}>
                              <div className="mb-3">
                                <label htmlFor="projectName" className="form-label">
                                  Project Name
                                </label>
                                <select
                                  className="form-select"
                                  id="projectName"
                                  name="projectName"
                                  value={selectedProject}
                                  onChange={(e) => setSelectedProject(e.target.value)}
                                  required
                                >
                                  <option value="" disabled>
                                    Select a Project
                                  </option>
                                  {projects.map((project) => (
                                    <option key={project.id} value={project.projectName}>
                                      {project.projectName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="itemName" className="form-label">
                                  Item Name
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="itemName"
                                  name="itemName"
                                  value={itemName}
                                  onChange={(e) => setItemName(e.target.value)}
                                  required
                                />
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="itemDescription" className="form-label">
                                  Item Description
                                </label>
                                <textarea
                                  className="form-control"
                                  id="itemDescription"
                                  name="itemDescription"
                                  rows={3}
                                  value={itemDescription}
                                  onChange={(e) => setItemDescription(e.target.value)}
                                  required
                                />
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="procurementquantity" className="form-label">
                                  Quantity
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="procurementquantity"
                                  name="quantity"
                                  value={quantity}
                                  onChange={handleProcurementQuantityChange} // Use the new handler
                                  required
                                />
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="procurementprice" className="form-label">
                                  Price
                                </label>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  className="form-control"
                                  id="procurementprice"
                                  name="procurementprice"
                                  value={procurementprice}
                                  onChange={handleProcurementPriceChange} // Use the new handler
                                  required
                                />
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label htmlFor="deliveryDate" className="form-label">
                                  Desired Delivery Date
                                </label>
                                <input
                                  type="date"
                                  autoComplete="off"
                                  className="form-control"
                                  id="deliveryDate"
                                  name="deliveryDate"
                                  value={deliveryDate}
                                  onChange={(e) => setDeliveryDate(e.target.value)}
                                  required
                                />
                              </div>
                              <hr />
                              {/* ... other form fields ... */}
                              <button type="submit" className="btn btn-outline-secondary">
                                Submit Procurement Request
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

        {activeTab === "#ProcurementRequest" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Procurement Request</b></h1>
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
                                <th>Item Name</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Delivery Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {procurements.map((procurement) => (
                                <tr key={procurement.id}>
                                  <td>{procurement.projectName}</td>
                                  <td>{procurement.itemName}</td>
                                  <td>{procurement.itemDescription}</td>
                                  <td>{procurement.quantity}</td>
                                  <td>{procurement.procurementprice}</td>
                                  <td>{procurement.deliveryDate}</td>
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
                  <h1 className='dashboard-text'><b>Add New Supplier</b></h1>
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
                  <h1 className='dashboard-text'><b>Add New Tool</b></h1>
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
                  <h1 className='dashboard-text'><b>Edit Supplier</b></h1>
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
                            <hr />
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
                  <h1 className='dashboard-text'><b>Edit Tools</b></h1>
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
                  <h1 className='dashboard-text'><b>Inventory</b></h1>
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
                                  <th>Price</th>
                                  <th>Stock</th>
                                  <th>Supplier</th>
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
    </div>
    </div>
  </div>
  );
};

export default ProcurementManager;
