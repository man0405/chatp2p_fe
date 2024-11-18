import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Component() {
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
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<Link to="#" className="text-sm font-medium underline">
									Forgot password?
								</Link>
							</div>
							<Input id="password" type="password" required />
						</div>
						<Button type="submit" className="w-full">
							Sign in
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
		</div>
	);
}
