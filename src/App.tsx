/** @format */

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./AppRoutes";
import { ToastProvider } from "./context/ToastContext";
import './i18n/i18n';
import { NotificationProvider } from "./context/NotificationContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/i18n";

// import './App.css';

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
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
    </I18nextProvider>
  );
};

export default App;
