import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp";

import {
	verifyEmail,
	signup,
	verifyCode,
} from "@/api/authentication/registerAPI";
import { generateAndStoreKeys } from "@/utils/rsa";
export default function Register() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		firstName: "",
		lastName: "",
		phone: "",
	});
	const [otp, setOtp] = React.useState("");
	const [errors, setErrors] = React.useState({
		email: "",
		password: "",
		confirmPassword: "",
		firstName: "",
		lastName: "",
		phone: "",
		verifyCode: "",
	});

	const validateStep = () => {
		let isValid = true;
		const newErrors = { ...errors };

		if (step === 1) {
			// Email validation
			if (!formData.email) {
				newErrors.email = "Email is required";
				isValid = false;
			} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
				newErrors.email = "Email is invalid";
				isValid = false;
			}

			// Password validation
			if (!formData.password) {
				newErrors.password = "Password is required";
				isValid = false;
			} else if (formData.password.length < 6) {
				newErrors.password = "Password must be at least 6 characters";
				isValid = false;
			}

			// Confirm password validation
			if (formData.password !== formData.confirmPassword) {
				newErrors.confirmPassword = "Passwords do not match";
				isValid = false;
			}
		}

		if (step === 2) {
			if (!formData.firstName) {
				newErrors.name = "First name is required";
				isValid = false;
			}
			if (!formData.lastName) {
				newErrors.name = "Last name is required";
				isValid = false;
			}

			if (!formData.phone) {
				newErrors.phone = "Phone number is required";
				isValid = false;
			}
		}

		setErrors(newErrors);
		return isValid;
	};

	const updateFormData = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleNext = () => {
		if (!validateStep()) return;
		setStep((prev) => Math.min(prev + 1, 3));
	};

	const handleBack = () => {
		setStep((prev) => Math.max(prev - 1, 1));
	};

	const verifyEmailHandler = async () => {
		if (!validateStep()) return;
		try {
			setIsLoading(true);
			const result = await verifyEmail(formData.email);
			if (result.success) {
				handleNext();
			} else {
				setErrors((e) => ({ ...e, email: result.message }));
			}
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	const registerHandler = async () => {
		if (!validateStep()) return;
		try {
			setIsLoading(true);
			const keyPair = await generateAndStoreKeys();
			const result = await signup(
				formData.email,
				formData.password,
				formData.phone,
				formData.firstName,
				formData.lastName,
				keyPair.publicKey
			);
			if (result.success) {
				handleNext();
			} else {
				setErrors((e) => ({ ...e, email: result.message }));
			}
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	const verifyCodeHandler = async () => {
		try {
			setIsLoading(true);
			const result = await verifyCode(formData.email, otp);

			if (result.success) {
				// Redirect to login page
				console.log("Registration complete");
				navigate("/auth/login");
			} else {
				setErrors((e) => ({ ...e, verifyCode: result.data }));
			}
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
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
						Acme Inc
					</div>
					<blockquote className="space-y-2">
						<p className="text-lg">
							&ldquo;This library has saved me countless hours of work and
							helped me deliver stunning designs to my clients faster than ever
							before.&rdquo;
						</p>
						<footer className="text-sm">Sofia Davis</footer>
					</blockquote>
				</div>
			</div>
			<div className="flex items-center justify-center p-8">
				<div className="mx-auto w-full max-w-md space-y-8">
					<div className="space-y-2 text-center">
						<h1 className="text-3xl font-bold">Create an account</h1>
						<p className="text-muted-foreground">
							Complete the steps below to create your account
						</p>
					</div>

					<div className="space-y-4">
						<div className="flex justify-between text-sm">
							{[1, 2, 3].map((number) => (
								<div
									key={number}
									className={`flex items-center gap-2 ${
										step >= number ? "text-primary" : "text-muted-foreground"
									}`}
								>
									<div
										className={`flex h-8 w-8 items-center justify-center rounded-full ${
											step >= number
												? "bg-primary text-primary-foreground"
												: "bg-muted"
										}`}
									>
										{number}
									</div>
									<span className="hidden sm:inline">
										{number === 1
											? "Account"
											: number === 2
											? "Personal"
											: "Verify"}
									</span>
								</div>
							))}
						</div>

						{step === 1 && (
							<>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											placeholder="m@example.com"
											type="email"
											value={formData.email}
											onChange={(e) => updateFormData("email", e.target.value)}
											className={errors.email ? "border-red-500" : ""}
										/>
										{errors.email && (
											<p className="text-sm text-red-500">{errors.email}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="password">Password</Label>
										<Input
											id="password"
											type="password"
											value={formData.password}
											onChange={(e) =>
												updateFormData("password", e.target.value)
											}
											className={errors.password ? "border-red-500" : ""}
										/>
										{errors.password && (
											<p className="text-sm text-red-500">{errors.password}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirmPassword">Confirm Password</Label>
										<Input
											id="confirmPassword"
											type="password"
											value={formData.confirmPassword}
											onChange={(e) =>
												updateFormData("confirmPassword", e.target.value)
											}
											className={errors.confirmPassword ? "border-red-500" : ""}
										/>
										{errors.confirmPassword && (
											<p className="text-sm text-red-500">
												{errors.confirmPassword}
											</p>
										)}
									</div>
								</div>
								<div className="flex gap-4">
									<Button
										onClick={verifyEmailHandler}
										className="w-full"
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="animate-spin" />
										) : (
											"Continue "
										)}
									</Button>
								</div>
							</>
						)}

						{step === 2 && (
							<>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="firstName">First Name</Label>
										<Input
											id="firstName"
											placeholder="John"
											value={formData.firstName}
											onChange={(e) =>
												updateFormData("firstName", e.target.value)
											}
											className={errors.firstName ? "border-red-500" : ""}
										/>
										{errors.firstName && (
											<p className="text-sm text-red-500">{errors.firstName}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="lastName">Last Name</Label>
										<Input
											id="lastName"
											placeholder="Doe"
											value={formData.lastName}
											onChange={(e) =>
												updateFormData("lastName", e.target.value)
											}
											className={errors.lastName ? "border-red-500" : ""}
										/>
										{errors.lastName && (
											<p className="text-sm text-red-500">{errors.lastName}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Phone Number</Label>
										<Input
											id="phone"
											placeholder="+1 (555) 000-0000"
											type="tel"
											value={formData.phone}
											onChange={(e) => updateFormData("phone", e.target.value)}
											className={errors.phone ? "border-red-500" : ""}
										/>
										{errors.phone && (
											<p className="text-sm text-red-500">{errors.phone}</p>
										)}
									</div>
								</div>
								<div className="flex gap-4">
									<Button
										onClick={registerHandler}
										className="w-full"
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="animate-spin" />
										) : (
											"Continue "
										)}
									</Button>
								</div>
							</>
						)}

						{step === 3 && (
							<>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="otp">Enter OTP</Label>
										<InputOTP
											maxLength={6}
											pattern={REGEXP_ONLY_DIGITS}
											value={otp}
											onChange={(value) => setOtp(value)}
										>
											<InputOTPGroup>
												<InputOTPSlot
													index={0}
													className={errors.verifyCode ? "border-red-500" : ""}
												/>
												<InputOTPSlot
													index={1}
													className={errors.verifyCode ? "border-red-500" : ""}
												/>
											</InputOTPGroup>
											<InputOTPSeparator />
											<InputOTPGroup>
												<InputOTPSlot
													index={2}
													className={errors.verifyCode ? "border-red-500" : ""}
												/>
												<InputOTPSlot
													index={3}
													className={errors.verifyCode ? "border-red-500" : ""}
												/>
											</InputOTPGroup>
											<InputOTPSeparator />

											<InputOTPGroup>
												<InputOTPSlot
													index={4}
													className={errors.verifyCode ? "border-red-500" : ""}
												/>
												<InputOTPSlot
													index={5}
													className={errors.verifyCode ? "border-red-500" : ""}
												/>
											</InputOTPGroup>
										</InputOTP>
									</div>
									{errors.verifyCode && (
										<p className="text-sm text-red-500">{errors.verifyCode}</p>
									)}
									<p className="text-sm text-muted-foreground">
										We sent a 6-digit OTP to {formData.email}
									</p>
								</div>
								<div className="flex gap-4">
									<Button
										onClick={verifyCodeHandler}
										className="w-full"
										disabled={isLoading}
									>
										{isLoading ? (
											<Loader2 className="animate-spin" />
										) : (
											"Complete Registration"
										)}
									</Button>
								</div>
							</>
						)}

						<div className="flex gap-4">
							{step > 1 && (
								<Button
									variant="outline"
									onClick={handleBack}
									className="w-full"
								>
									Back
								</Button>
							)}
							{/* <Button onClick={handleNext} className="w-full">
								{step === 3 ? "Complete" : "Continue"}
							</Button> */}
						</div>

						<p className="text-center text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link href="/sign-in" className="underline">
								Sign in
							</Link>
						</p>

						<p className="text-center text-xs text-muted-foreground">
							By clicking continue, you agree to our{" "}
							<Link href="/terms" className="underline">
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link href="/privacy" className="underline">
								Privacy Policy
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
