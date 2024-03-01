import { createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, get, ref, set } from "firebase/database";
import React, { useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import registerImage from './img/register-page.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import wallpaperImage from './img/wallpaper.jpg';

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [step, setStep] = useState(1); // Added step state to control the signup steps


  const navigate = useNavigate();

  const handleNextStep = () => {
    if (step === 1 && !role) {
      alert("Please select a role.");
    } else {
      setStep(step + 1);
    }
  };
  

  const register = async (e) => {
    e.preventDefault();

    // Password validation
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must contain at least one digit, one special character, one uppercase letter, and be at least 8 characters long");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Initialize Realtime Database
      const db = getDatabase();

      // Add user details to the 'users' node
      const userId = userCredential.user.uid;
      const userRef = ref(db, `newregistration/${userId}`);

      set(userRef, {
        userId: userId,
        fullName: fullName,
        email: email,
        role: role,
        // Add other user details as needed
      });

      alert("User registered successfully");

      // Use navigate function for navigation
      navigate("/login");
    } catch (error) {
      console.error("Error registering user: ", error);
    }
  };

  const registerWithGoogle = async () => {

    if (!role) {
      alert("Please select a role before registering with Google.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      // Check if the user is already registered
      const db = getDatabase();
      const userRef = ref(db, `newregistration/${user.uid}`);

      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // User is not registered, so register them
        // Add user details to the 'users' node
        set(userRef, {
          userId: user.uid,
          fullName: user.displayName,
          email: user.email,
          role: role,
          // Add other user details as needed
        });

        alert("User registered with Google successfully");

        // Use navigate function for navigation
        navigate("/login");
      } else {
        alert("User is already registered with Google");
      }
    } catch (error) {
      console.error("Error registering with Google: ", error);
    }
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
                        <img src={registerImage} alt="login form" className="img-fluid rounded-md-start" />
                      </div>
                      <div className="col-md-6 col-lg-7 d-flex align-items-center">
                        <div className="card-body p-4 p-md-4 text-dark">
                          <form>
                            {step === 1 && (
                              <>
                                <div className="d-flex align-items-center mb-3 pb-1">
                                  <h1 className="login-title">Sign Up As?</h1>

                                </div>
                                <div className="mb-3">
                                  <label htmlFor="role" className="form-label">
                                    Role
                                  </label>
                                  <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="form-select form-select-md"
                                  >
                            <option disabled value="">Select Role</option>
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
                                    {/* ... (options as before) */}
                                  </select>
                                </div>
                                <div className="mb-3">
                                  <button
                                    className="form-control form-control-md"
                                    style={{ textDecoration: 'none', fontSize: '15px' }}
                                    type="button"
                                    onClick={handleNextStep}
                                  >
                                    Next
                                  </button>
                                </div>
                                <div className="mb-3">
                              <div className="text-center mb-3">
                                <a className="small text-muted" style={{ textDecoration: 'none', fontSize: '15px' }}>If you are planning to register using Google, just select the role you wish to use. <br/> If not select a role then click Next.</a>
                              </div>
                              <div className="container text-center">
                                <div className="mb-4 d-flex justify-content-center">
                                  <a
                                    href="#"
                                    className="btn btn-light form-control-lg d-flex align-items-center"
                                    id="google-signin"
                                    style={{ backgroundColor: 'white', fontSize: '15px' }}
                                    onClick={registerWithGoogle}
                                  >
                                    <FontAwesomeIcon icon={faGoogle} className="me-2" /> Register with Google
                                  </a>
                                </div>
                              </div>
                            </div>
                              </>
                            )}
                            {step === 2 && (
                              <>
                            <div className="d-flex align-items-center mb-3 pb-1">
                              <h1 className="login-title">Create Account</h1>
                            </div>

                            <div className="mb-3">
                              <label htmlFor="fullName" className="form-label">
                                Full Name
                              </label>
                              <input
                                type="text"
                                autoComplete="off"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="form-control form-control-md"
                              />
                            </div>

                            <div className="mb-3">
                              <label htmlFor="email" className="form-label">
                                Email address
                              </label>
                              <input
                                type="email"
                                autoComplete="off"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control form-control-md"
                              />
                            </div>

                            <div className="mb-3">
                              <label htmlFor="password" className="form-label">
                                Password
                              </label>
                              <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-control form-control-md"
                              />
                            </div>

                            <div className="mb-3">
                              <div className="mb-3">
                                <button
                                  className="form-control form-control-md"
                                  style={{ textDecoration: 'none', fontSize: '15px' }}
                                  type="button"
                                  onClick={register}
                                >
                                  Register
                                </button>
                                {/* ... (rest of your code) */}
                              </div>

                            </div>

                            <div className="text-center mb-3">
                              <a className="small text-muted" href="/Signup" style={{ textDecoration: 'none', fontSize: '15px' }}>Back</a>
                            </div>
                              </>
                            )}

                            <div className="text-center mb-4">
                              <a className="small text-muted" href="/login" style={{ textDecoration: 'none', fontSize: '12px' }}>Go back to Login</a>
                            </div>
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

export default Signup;
