import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { login } from "@/api/authentication/login";
import { setToken } from "@/services/token.service";
import axiosClient from "@/lib/axios/axiosClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  const updateFormData = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await login(formData.email, formData.password);
      if (response.success) {
        setToken(response.data.token);
        localStorage.setItem("fullName", response.data.fullName);
        localStorage.setItem("username", formData.email);
        navigate("/test");
        return;
      } else {
        setErrors({
          email: response.data,
          password: response.data,
        });
      }
    } catch (error) {
      console.error(error);
      setErrors({
        email: "An error occurred",
        password: "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    setIsLoading(true);
    setForgotPasswordError("");
    const formData = new FormData();
    formData.append("email", email);
    console.log("email: " + email);
    try {
      const response = await axiosClient.post(
        "/auth/forgot-password",
        formData,
        {
          headers: {
            "Content-Type": "text",
          },
        }
      );
      if (response.success) {
        setIsForgotPasswordModalOpen(true);
      } else {
        setForgotPasswordError("Email not found");
      }
    } catch (error) {
      console.error(error);
      setForgotPasswordError(error.response?.message || "Email not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    setIsLoading(true);
    setForgotPasswordError("");
    console.log(formData.email, " ", resetToken, " ", newPassword);
    try {
      if (!resetToken || !newPassword) {
        throw new Error("Reset token and new password are required.");
      }

      const response = await axiosClient.post("/auth/reset-password", {
        email: formData.email,
        resetToken,
        newPassword,
      });

      if (response.success) {
        // Successfully reset the password
        setIsForgotPasswordModalOpen(false);
        setResetToken("");
        setNewPassword("");
        console.log("Password reset successfully");
        // Optionally redirect or show a success message
        navigate("/auth/login");
      } else {
        throw new Error(response.data?.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error(error);
      setForgotPasswordError(
        error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block bg-zinc-900 relative">
        <div className="relative z-20 flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            2P Inc
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Use me, your messages are known only to you and your
              partner&rdquo;
            </p>
            <footer className="text-sm">2P CEO</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="mx-auto w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in.
            </p>
          </div>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => updateFormData("email", e.target.value)}
                name="email"
                value={formData.email}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  className="text-sm font-medium underline p-0 h-auto"
                  onClick={() => handleForgotPassword(formData.email)}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                required
                onChange={(e) => updateFormData("password", e.target.value)}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-medium underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <Dialog
        open={isForgotPasswordModalOpen}
        onOpenChange={setIsForgotPasswordModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter the reset token sent to your email and your new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetToken">Reset Token</Label>
              <Input
                id="resetToken"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter reset token"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleResetPasswordSubmit} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {forgotPasswordError && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p>{forgotPasswordError}</p>
            <Button onClick={() => setForgotPasswordError("")} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
