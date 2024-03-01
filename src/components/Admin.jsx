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
  remove,
  set,// Fix: Remove the duplicated import
} from 'firebase/database';
import logoImage from './img/logo-icon.png';
import { getAuth, signOut, deleteUser } from 'firebase/auth';

const Admin = () => {

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



  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const [activeTab, setActiveTab] = useState('#NewUserApproval');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Reference to the Firebase Realtime Database path
    const dbRef = ref(getDatabase(), 'newregistration'); // Use getDatabase function

    // Attach an event listener for data changes
    const onDataChange = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersArray = Object.keys(data).map((key) => ({
          userId: key,
          ...data[key],
        }));
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
    };

    // Listen for changes in the database
    onValue(dbRef, onDataChange);

    // Clean up the event listener when the component unmounts
    return () => {
      off(dbRef, 'value', onDataChange);
    };
  }, []); // Empty dependency array ensures that the effect runs only once

  const [approvedUsers, setApprovedUsers] = useState([]);

  useEffect(() => {
    // Reference to the Firebase Realtime Database path
    const dbRef = ref(getDatabase(), 'users'); // Use getDatabase function
  
    // Attach an event listener for data changes
    const onDataChange = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const approvedUsersArray = Object.keys(data).map((key) => ({
          userId: key,
          ...data[key],
        }));
        setApprovedUsers(approvedUsersArray);
      } else {
        setApprovedUsers([]);
      }
    };
  
    // Listen for changes in the database
    onValue(dbRef, onDataChange);
  
    // Clean up the event listener when the component unmounts
    return () => {
      off(dbRef, onDataChange);
    };
  }, []); // Empty dependency array ensures that the effect runs only once
  
  

  const handleApproval = async (userId) => {
    try {
      const db = getDatabase();
      const newRegistrationRef = ref(db, `newregistration/${userId}`);
      const userRef = ref(db, `users/${userId}`);
  
      // Move the user data to 'users'
      const snapshot = await get(newRegistrationRef);
      const userData = snapshot.val();
      await set(userRef, userData);
  
      // Remove the user from 'newregistration' and wait for completion
      await new Promise((resolve, reject) => {
        remove(newRegistrationRef)
          .then(() => resolve())
          .catch((error) => reject(error));
      });
  
      // Update the state after the removal is completed
      setUsers((prevUsers) => prevUsers.filter((user) => user.userId !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };
  
  
  
  const handleDelete = async (userId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (user) {
        // Delete the user from authentication
        await deleteUser(auth, user.uid); // Make sure this function is correct
      }
  
      const db = getDatabase();
      const newRegistrationRef = ref(db, `newregistration/${userId}`);
      
      console.log('Before removal. Path:', newRegistrationRef.toString());
  
      // Remove the user from 'newregistration'
      await remove(newRegistrationRef);
  
      console.log('After removal. Path:', newRegistrationRef.toString());
  
      // Update the state to reflect the changes
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.filter((user) => user.userId !== userId);
        console.log('Updated Users:', updatedUsers);
        return updatedUsers;
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (user) {
        // Delete the user from authentication
        await deleteUser(auth, user.uid); // Make sure this function is correct
      }
  
      const db = getDatabase();
      const usersRef = ref(db, `users/${userId}`);
  
      console.log('Before removal. Path:', usersRef.toString());
  
      // Remove the user from 'newregistration'
      await remove(usersRef);
  
      // Create a new reference after removal
      const updatedUsersRef = ref(db, `users/${userId}`);
  
      console.log('After removal. Path:', updatedUsersRef.toString());
  
      // Update the state to reflect the changes
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.filter((user) => user.userId !== userId);
        console.log('Updated Users:', updatedUsers);
        return updatedUsers;
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
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
        <h4>Administrator</h4>
        <br/>
      </div>

      <ul className="tabs">
      <li
              data-tab-target="#NewUserApproval"
              className={activeTab === "#NewUserApproval" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#NewUserApproval")}
            >
              New User Approval
            </li>

            <li
              data-tab-target="#Users"
              className={activeTab === "#Users" ? "active tab" : "tab"}
              onClick={() => handleTabClick("#Users")}
            >
              Users
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
     {activeTab === "#NewUserApproval" && (
            <div className='dashboard'>
              {/* Add your content for the Dashboard tab here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>New User Approval</b></h1>
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
                          <form id="userapproval" >
                          <table className="table">
                                    <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Full Name</th>
                                        <th>Role</th>
                                        <th>Approval</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map((user) => (
                                        <tr key={user.userId}>
                                        <td>{user.email}</td>
                                        <td>{user.fullName}</td>
                                        <td>{user.role}</td>
                                        <td><button
                                        className="btn btn-primary"
                                        onClick={() => handleApproval(user.userId)}
                                        >
                                        Approve
                                        </button></td>
                                        <td>                                        <button
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(user.userId)}
                                        >
                                        Delete
                                        </button>   
                                         </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
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

        {activeTab === "#Users" && (
            <div>
              {/* Add your content for creating projects here */}
              <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-4 px-4">
              <FontAwesomeIcon icon={faAlignLeft} className="primary-text fs-4 me-3 open-btn" />
                  <h1 className='dashboard-text'><b>Users</b></h1>
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
                                <th>Email</th>
                                <th>Full Name</th>
                                <th>Role</th>
                                <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedUsers.map((approvedUser) => (
                                <tr key={approvedUser.userId}>
                                    <td>{approvedUser.email}</td>
                                    <td>{approvedUser.fullName}</td>
                                    <td>{approvedUser.role}</td>
                                    <td>                                        <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteUser(approvedUser.userId)}
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
  
    </div>
    </div>
  </div>
  );
};

export default Admin;
