import React from "react";
import logoImage from './img/logo-icon.png';
import { Link } from 'react-router-dom';
import './styles.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import wallpaperImage from './img/wallpaper.jpg';

function Home() {

  const styles = {
    backgroundImage: `url(${wallpaperImage})`,
    backgroundSize: 'relative',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    height: '100vh',
  };
  
  return (
<div style={styles}>
      <Navbar className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">
            <a href="javascript:void(0)" className="nav__brand">
              <img src={logoImage} alt="Strastan Construction" />
            </a>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              <li className="nav__item">
                <Link to="/Login" className="nav__link" style={{ marginRight: '10px' }}>
                  Login
                </Link>
                <Link to="/Signup" className="nav__link">
                  Sign-Up
                </Link>
              </li>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="catchphrase">
        <h1>The Modern Construction Management Platform</h1>
        <h4>Streamline Your Construction Projects with Ease</h4>
        <h4>Unlock the Potential of Your Construction Projects</h4>
        <h4>Innovative Solutions for Today's Construction Challenges</h4>
        <h4>Transforming Construction Management for the Digital Age</h4>
      </div>
    </div>
  );
}

export default Home;
