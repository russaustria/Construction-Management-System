import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ProjectManager from './components/Project_Manager';
import ConstructionSiteSupervisor from './components/ConstructionSite_Supervisor';
import ProcurementManager from './components/Procurement_Manager';
import ConstructionTeamMember from './components/ConstructionTeam_Member';
import ProjectStakeholder from './components/Project_Stakeholder';
import Supplier from './components/Supplier';
import ConstructionSiteInspector from './components/ConstructionSite_Inspector';
import ProjectAccountant from './components/ProjectAccountant';
import Subcontractor from './components/Subcontractor';
import ProjectScheduler from './components/Project_Scheduler';
import QualityControlManager from './components/QualityControl_Manager';
import ProjectOwner from './components/ProjectOwner';
import FieldSupervisor from './components/FieldSupervisor';
import MaterialsManager from './components/MaterialsManager';
import SafetyOfficer from './components/SafetyOfficer';
import Executive from './components/Executive';
import Admin from './components/Admin';

function App() {
  return (
    <Router>
      {/* Use Routes instead of directly placing Route components */}
      <Routes>
        {/* Define your routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ProjectManager" element={<ProjectManager />} />
        <Route path="/ConstructionSiteSupervisor" element={<ConstructionSiteSupervisor />} />
        <Route path="/ProcurementManager" element={<ProcurementManager />} />
        <Route path="/ConstructionTeamMember" element={<ConstructionTeamMember />} />
        <Route path="/ProjectStakeholder" element={<ProjectStakeholder />} />      
        <Route path="/Supplier" element={<Supplier />} />
        <Route path="/ConstructionSiteInspector" element={<ConstructionSiteInspector />} />   
        <Route path="/ProjectAccountant" element={<ProjectAccountant />} />
        <Route path="/Subcontractor" element={<Subcontractor/>} />
        <Route path="/ProjectScheduler" element={<ProjectScheduler />}/>
        <Route path="/QualityControlManager" element={<QualityControlManager />}/>
        <Route path="/ProjectOwner" element={<ProjectOwner />}/>
        <Route path="/FieldSupervisor" element={<FieldSupervisor/>}/>
        <Route path="/MaterialsManager" element={<MaterialsManager/>}/>
        <Route path="/SafetyOfficer" element={<SafetyOfficer />}/>
        <Route path="/Executive" element={<Executive /> }/>
        <Route path="/Admin" element={<Admin /> }/>
      </Routes>
    </Router>
  );
}

export default App;
