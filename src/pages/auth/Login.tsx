/** @format */

import { useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import API from "../../api/api.js";
import type { AxiosError } from "axios"; // ✅ Import AxiosError type
import { Button } from "../../components/common/ui/Button.js";
import Logo from '../../assets/SeinGayHarLogo.png';

// Interface for login response from backend
interface LoginResponse {
  id: number;
  username: string;
  token: string; // access token
  refreshToken: string;
  roles: string[]; // single or multiple roles
}

// Interface for error response (backend message)
interface ErrorResponse {
  message?: string;
}

export default function Login(): JSX.Element {
  const [username, setUsername] = useState<string>("");
  const [passwordHash, setPassword] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await API.post<LoginResponse>("/api/auth/login", {
        username,
        passwordHash,
      });

      console.log("Login response:", res.data);

      const {
        id: userId,
        username: user,
        token: accessToken,
        refreshToken,
        roles,
      } = res.data;

      if (user && accessToken && refreshToken && roles?.length > 0) {
        // Save user info in context
        login({ userId, username: user, accessToken, refreshToken, roles });

        // Redirect based on role
        if (roles.includes("ROLE_SUPERADMIN")) navigate("/super-admin");
        else if (roles.includes("ROLE_ADMIN")) navigate("/admin");
        else navigate("/user");
      } else {
        setMsg("Login failed! Invalid response.");
      }
    } catch (error) {
      // ✅ Use AxiosError for proper typing
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMsg =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Login failed! Please check credentials or server.";

      console.error("Login error:", axiosError.response || axiosError);
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E8EB] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[#E5E8EB] overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E40AF] px-8 py-6 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={Logo} 
              alt="Sein Gay Har Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-[#E5E8EB] opacity-90 mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Username
            </label>
            <input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Password
            </label>
            <input
              placeholder="Enter your password"
              type="password"
              value={passwordHash}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-[#E5E8EB] text-[#1E40AF] focus:ring-[#1E40AF]"
              />
              <span className="ml-2 text-[#1E293B] opacity-80">
                Remember me
              </span>
            </label>
            <a
              href="/forgot-password"
              className="text-[#1E40AF] hover:text-[#1E3A8A] transition-colors duration-200 font-medium"
            >
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white py-3 text-base font-medium"
          >
            Sign In
          </Button>
        </form>

        {/* Message */}
        {msg && (
          <div className="px-8 pb-6">
            <div className="rounded-lg p-4 text-center bg-red-50 border border-red-200 text-red-800">
              <p className="text-sm font-medium">{msg}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#F8F9FA] px-8 py-6 border-t border-[#E5E8EB] text-center">
          <p className="text-[#1E293B] opacity-80 text-sm">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-[#1E40AF] hover:text-[#1E3A8A] font-medium transition-colors duration-200"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}