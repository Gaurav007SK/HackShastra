import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterFarmer from './pages/RegisterFarmer';
import FarmerDashboard from './pages/FarmerDashboard';
import { authUtils } from './services/auth';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  return authUtils.isAuthenticated() ? children : <Navigate to="/login" />;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  return authUtils.isAuthenticated() ? <Navigate to="/farmer-dashboard" /> : children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterFarmer />
              </PublicRoute>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/farmer-dashboard" 
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
