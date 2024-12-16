import React, { useState } from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";

import { changePassword } from "@/api/authentication/changePasswordAPI";
import { useToast } from "@/hooks/use-toast";

export default function AccountSetting() {
	const { toast } = useToast();
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});

	const validatePassword = (password) => {
		const strongPassword = new RegExp(
			"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
		);
		return strongPassword.test(password);
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setErrors((prev) => ({
			...prev,
			[name]: "",
		}));
	};

	const handleSubmit = async () => {
		const newErrors = {};

		// Validate current password (you should implement this check against actual current password)
		if (!formData.currentPassword) {
			newErrors.currentPassword = "Current password is required";
		}

		// Validate new password
		if (!validatePassword(formData.newPassword)) {
			newErrors.newPassword =
				"Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character";
		}

		// Validate confirm password
		if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);
		try {
			// Implement your password change logic here
			const response = await changePassword(
				localStorage.getItem("username"),
				formData.currentPassword,
				formData.newPassword
			);
			console.log("handleSubmit ~ response:", response.success);

			if (!response.success) {
				setErrors({
					currentPassword: response.data,
				});
				return;
			}
			// Reset form and close modal

			setShowPasswordModal(false);
			setFormData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			toast({
				title: "Password changed successfully",
				description: "Your password has been updated successfully",
				variant: "success",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "An error occurred while changing password",
				variant: "destructive",
			});
			console.error("Error changing password:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6 p-6 pt-0 text-white">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label>Change Password</Label>
					<div className="text-sm text-muted-foreground">
						Update your account password
					</div>
				</div>
				<Button
					className="text-zinc-400 hover:text-white bg-zinc-900 border"
					onClick={() => setShowPasswordModal(true)}
				>
					Change Password
				</Button>
			</div>

			<Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
				<DialogContent className="bg-zinc-900 border-zinc-800 text-white">
					<DialogHeader>
						<DialogTitle className="text-white">Change Password</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Current Password</Label>
							<Input
								type="password"
								name="currentPassword"
								value={formData.currentPassword}
								onChange={handleInputChange}
								className="bg-zinc-800 border-zinc-700"
							/>
							{errors.currentPassword && (
								<p className="text-sm text-red-500">{errors.currentPassword}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label>New Password</Label>
							<Input
								type="password"
								name="newPassword"
								value={formData.newPassword}
								onChange={handleInputChange}
								className="bg-zinc-800 border-zinc-700"
							/>
							{errors.newPassword && (
								<p className="text-sm text-red-500">{errors.newPassword}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label>Confirm New Password</Label>
							<Input
								type="password"
								name="confirmPassword"
								value={formData.confirmPassword}
								onChange={handleInputChange}
								className="bg-zinc-800 border-zinc-700"
							/>
							{errors.confirmPassword && (
								<p className="text-sm text-red-500">{errors.confirmPassword}</p>
							)}
						</div>
					</div>
					<div className="flex justify-end">
						<Button
							onClick={handleSubmit}
							disabled={isLoading}
							className="text-zinc-400 hover:text-white bg-zinc-900 border"
						>
							{isLoading ? (
								<>
									<Loader2 className="animate-spin" />
									<span className="ml-2">Updating...</span>
								</>
							) : (
								"Update Password"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
