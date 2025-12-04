/** @format */

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./AppRoutes";
import { ToastProvider } from "./context/ToastContext";
import './i18n/i18n';
import { NotificationProvider } from "./context/NotificationContext";

// import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
