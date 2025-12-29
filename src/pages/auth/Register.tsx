/** @format */

import { useState, type FormEvent, type JSX } from "react";
import API from "../../api/api.js";
import type { AxiosError } from "axios"; // ✅ Import AxiosError type
import { Button } from "../../components/common/ui/Button.js";
import Logo from '../../assets/SeinGayHarLogo.png';

interface RegisterResponse {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

interface ErrorResponse {
  message?: string;
}

export default function Register(): JSX.Element {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMsg("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await API.post<RegisterResponse>("/api/auth/register", {
        username,
        email,
        fullName,
        password,
      });

      setSuccess(true);
      setMsg(
        `User registered successfully, ${res.data.username}. Please check your email (${email}) for confirmation.`
      );

      // Clear form
      setUsername("");
      setEmail("");
      setFullName("");
      setPassword("");
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMsg =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Registration failed! Please try again.";

      setSuccess(false);
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
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-[#E5E8EB] opacity-90 mt-2">
            Join Sein Gay Har Mall Management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Full Name
            </label>
            <input
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Username
            </label>
            <input
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Email Address
            </label>
            <input
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Password
            </label>
            <input
              placeholder="Create a password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white py-3 text-base font-medium"
          >
            Create Account
          </Button>
        </form>

        {/* Message */}
        {msg && (
          <div className={`px-8 pb-6 ${success ? 'animate-pulse' : ''}`}>
            <div className={`rounded-lg p-4 text-center ${
              success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">{msg}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#F8F9FA] px-8 py-4 border-t border-[#E5E8EB] text-center">
          <p className="text-[#1E293B] opacity-80 text-sm">
            Already have an account?{" "}
            <a 
              href="/login" 
              className="text-[#1E40AF] hover:text-[#1E3A8A] font-medium transition-colors duration-200"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}