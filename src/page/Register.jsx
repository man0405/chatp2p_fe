import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp";
import { verifyEmail } from "@/api/authentication/registerAPI";

export default function Register() {
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		name: "",
		phone: "",
		verificationCode: "",
	});
	const [otp, setOtp] = React.useState("");
	console.log("Register ~ otp:", process.env.SERVER_URL);

	const updateFormData = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const verifyEmailHandler = async () => {
		try {
			await verifyEmail(formData.email);
			handleNext();
		} catch (error) {
			console.error(error);
		}
	};

	const handleNext = () => {
		setStep((prev) => Math.min(prev + 1, 3));
	};

	const handleBack = () => {
		setStep((prev) => Math.max(prev - 1, 1));
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
										/>
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
										/>
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
										/>
									</div>
								</div>
								<div className="flex gap-4">
									<Button onClick={verifyEmailHandler} className="w-full">
										Continue
									</Button>
								</div>
							</>
						)}

						{step === 2 && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name</Label>
									<Input
										id="name"
										placeholder="John Doe"
										value={formData.name}
										onChange={(e) => updateFormData("name", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number</Label>
									<Input
										id="phone"
										placeholder="+1 (555) 000-0000"
										type="tel"
										value={formData.phone}
										onChange={(e) => updateFormData("phone", e.target.value)}
									/>
								</div>
							</div>
						)}

						{step === 3 && (
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
											<InputOTPSlot index={0} />
											<InputOTPSlot index={1} />
										</InputOTPGroup>
										<InputOTPSeparator />
										<InputOTPGroup>
											<InputOTPSlot index={2} />
											<InputOTPSlot index={3} />
										</InputOTPGroup>
										<InputOTPSeparator />

										<InputOTPGroup>
											<InputOTPSlot index={4} />
											<InputOTPSlot index={5} />
										</InputOTPGroup>
									</InputOTP>
								</div>
								<p className="text-sm text-muted-foreground">
									We sent a 6-digit OTP to {formData.email}
								</p>
							</div>
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
