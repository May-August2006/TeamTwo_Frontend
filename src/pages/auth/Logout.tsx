/** @format */

import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js"; // keep .js extension for Node16/Nodenext

export default function Logout(): JSX.Element {
  const navigate = useNavigate();
  const { logout } = useAuth(); // typed logout function

  useEffect(() => {
    // Clear user state and localStorage
    logout();

    // Redirect to login page after 3 seconds
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>You have been logged out.</h2>
      <p>Redirecting to login page...</p>
    </div>
  );
}
