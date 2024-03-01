import React, { useState } from "react";
import loginImage from "./img/login-page.jpg";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import { getDatabase, ref, get } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useNavigate } from 'react-router-dom'; // Add this import
import "bootstrap/dist/css/bootstrap.min.css";
import './styles.css';
import wallpaperImage from './img/wallpaper.jpg';
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Add this line

  const signIn = async (e) => {
    e.preventDefault();
    

    if (email === "admin@admin.com" && password === "admin123!") {
      // Redirect to the admin page
      navigate('/Admin');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

  
      // Fetch additional user details from Realtime Database
      const userSnapshot = await getUserDetailsFromDatabase(user.uid);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        console.log("Logged in");
        alert("Logged-In Successfully!");
  
        // Redirect based on user role
        if (userData.role === "Project Manager") {
          // Redirect to Admin page
          navigate('/ProjectManager', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Construction Site Supervisor") {
          // Redirect to ProjectManager page
          navigate('/ConstructionSiteSupervisor', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Procurement Manager") {
          // Redirect to ProjectManager page
          navigate('/ProcurementManager', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Construction Team Member") {
          // Redirect to ProjectManager page
          navigate('/ConstructionTeamMember', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Project Stakeholder") {
          // Redirect to ProjectManager page
          navigate('/ProjectStakeholder', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Supplier") {
          // Redirect to ProjectManager page
          navigate('/Supplier', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Construction Site Inspector") {
          // Redirect to ProjectManager page
          navigate('/ConstructionSiteInspector', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Project Accountant") {
          // Redirect to ProjectManager page
          navigate('/ProjectAccountant', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Subcontractor") {
          // Redirect to ProjectManager page
          navigate('/Subcontractor', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Project Scheduler") {
          // Redirect to ProjectManager page
          navigate('/ProjectScheduler', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Quality Control Manager") {
          // Redirect to ProjectManager page
          navigate('/QualityControlManager', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Project Owner") {
          // Redirect to ProjectManager page
          navigate('/ProjectOwner', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Field Supervisor") {
          // Redirect to ProjectManager page
          navigate('/FieldSupervisor', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Materials Manager") {
          // Redirect to ProjectManager page
          navigate('/MaterialsManager', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Safety Officer") {
          // Redirect to ProjectManager page
          navigate('/SafetyOfficer', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Executive") {
          // Redirect to ProjectManager page
          navigate('/Executive', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else {
          // Redirect to a default page for other roles or handle accordingly
          navigate('/DefaultPage');
        }
      } else {
        alert("User not found. Register First");
      }
    } catch (error) {
      alert("Login error:", error);
    }
  };

  
  const getUserDetailsFromDatabase = async (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    return await get(userRef);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if the user is registered in Firebase
      const userSnapshot = await getUserDetailsFromDatabase(user.uid);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        console.log("Logged in");
        alert("Logged-In Successfully!");
  
        // Redirect based on user role
        if (userData.role === "Project Manager") {
          // Redirect to Admin page
          navigate('/ProjectManager', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Construction Site Supervisor") {
          // Redirect to ProjectManager page
          navigate('/ConstructionSiteSupervisor', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Procurement Manager") {
          // Redirect to ProjectManager page
          navigate('/ProcurementManager', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Construction Team Member") {
          // Redirect to ProjectManager page
          navigate('/ConstructionTeamMember', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Project Stakeholder") {
          // Redirect to ProjectManager page
          navigate('/ProjectStakeholder', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Supplier") {
          // Redirect to ProjectManager page
          navigate('/Supplier', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Construction Site Inspector") {
          // Redirect to ProjectManager page
          navigate('/ConstructionSiteInspector', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Project Accountant") {
          // Redirect to ProjectManager page
          navigate('/ProjectAccountant', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else if (userData.role === "Subcontractor") {
          // Redirect to ProjectManager page
          navigate('/Subcontractor', {
            state: {
              userId: user.uid,
              email: user.email,
              fullName: userData.fullName,
              role: userData.role,
            },
          });
        } else {
          // Redirect to a default page for other roles or handle accordingly
          navigate('/DefaultPage');
        }
      } else {
        alert("User not found. Please Register first.");
      }
    } catch (error) {
    }
  };

  const handleForgotPassword = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent. Check your inbox.");
      })
      .catch((error) => {
        console.error("Error sending password reset email:", error);
      });
  };
  
  const styles = {
    backgroundImage: `url(${wallpaperImage})`,
    backgroundSize: 'relative',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };


  return (
<div style={styles}>

      <div className="animation-container">
        <section className="vh-100">
        <div className="container py-5 h-100">
            <div className="row justify-content-center align-items-center h-100">
            <div className="col col-xl-10">
                <div className="card border-0 rounded-lg slide-in">
                <div className="card border-0 rounded-lg">
                    <div className="row g-0">
                    <div className="col-md-6 col-lg-5 d-none d-md-block">
                        <img src={loginImage} alt="login form" className="img-fluid rounded-md-start" />
                    </div>
                    <div className="col-md-6 col-lg-7 d-flex align-items-center">
                        <div className="card-body p-4 p-lg-5 text-dark">
                        <form onSubmit={signIn}>
                            <div className="d-flex align-items-center mb-2 pb-1">
                            <h1 className="login-title">Login</h1>
                            </div>
                            <h4 className="fw-normal mb-3 pb-3" style={{letterSpacing: 1}}>Sign into your account</h4>
                            <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control form-control-md"
                            ></input>
                            </div>
                            <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control form-control-md"
                            ></input>
                            </div>
                            <div className="mb-3">
                            <button className="form-control form-control-md" style={{ textDecoration: 'none', fontSize: '15px' }} type="submit">Login</button>
                            </div>
                            <div className="text-center mb-3">
                            <a className="lg text-muted text-center" style={{ textDecoration: 'none', fontSize: '15px' }}>or Login with:</a>
                            </div>
                            <div className="mb-3 d-flex justify-content-center">
                              <button
                                onClick={signInWithGoogle}
                                className="btn btn-light form-control-lg d-flex align-items-center"
                                id="google-signin"
                                style={{ backgroundColor: "white", fontSize: "15px" }}
                              >
                                <FontAwesomeIcon icon={faGoogle} className="me-2" /> Google
                              </button>
                            </div>
                            <div className="text-center mb-3">
                              <a
                                className="small text-muted"
                                onClick={handleForgotPassword}
                                style={{ textDecoration: "none", fontSize: "12px", cursor: "pointer" }}
                              >
                                Forgot password?
                              </a>
                            </div>
                            <p className="text-center mb-3" style={{color: '#393f81', fontSize: '15px'}}>Don't have an account? <a href="/Signup" style={{color: '#393f81', textDecoration: 'none', fontSize: '15px'}}>Register here</a></p>
                            <p className="text-center mb-3"><a href="/" style={{color: '#393f81', textDecoration: 'none', fontSize: '12px'}}>Go Back to Homepage</a></p>
                        </form>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        </section>

      </div>
    </div>
  );
}

export default Login;
