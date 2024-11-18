import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Register() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		// Handle registration logic here
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
			<div className="flex items-center justify-center p-6 lg:p-10">
				<div className="mx-auto w-full max-w-[400px] space-y-6">
					<div className="flex flex-col space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">
							Create an account
						</h1>
						<p className="text-sm text-muted-foreground">
							Enter your details to create your account
						</p>
					</div>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="m@example.com"
								required
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								required
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								required
								onChange={(e) =>
									setFormData({ ...formData, confirmPassword: e.target.value })
								}
							/>
						</div>
						{error && (
							<p className="text-sm text-red-500 text-center">{error}</p>
						)}
						<Button type="submit" className="w-full">
							Create Account
						</Button>
					</form>
					<div className="text-center">
						<Link
							to="/auth/login"
							className="text-sm text-muted-foreground hover:text-primary underline"
						>
							Already have an account? Sign in
						</Link>
					</div>
					<p className="px-8 text-center text-sm text-muted-foreground">
						By clicking continue, you agree to our{" "}
						<Link
							to="/terms"
							className="underline underline-offset-4 hover:text-primary"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							to="/privacy"
							className="underline underline-offset-4 hover:text-primary"
						>
							Privacy Policy
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
