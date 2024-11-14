import React, { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const StompClientComponent = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [connectionStatus, setConnectionStatus] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const handleLogin = async (e) => {
		e.preventDefault();

		try {
			// Adjusted to match the `auth/signin` endpoint requirements
			const response = await fetch("http://localhost:8080/auth/signin", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }), // Send `email` and `password`
			});

			if (response.ok) {
				const token = await response.text(); // Assume token is returned as plain text
				localStorage.setItem("token", token); // Store the token in localStorage
				setIsAuthenticated(true); // Set authentication status
				setConnectionStatus("Logged in and connecting to WebSocket...");
			} else {
				console.error("Login failed");
				setConnectionStatus("Login failed. Please try again.");
			}
		} catch (error) {
			console.error("Error during login:", error);
			setConnectionStatus("Error during login. Please try again.");
		}
	};

	useEffect(() => {
		if (!isAuthenticated) return; // Only connect if authenticated

		const token = localStorage.getItem("token");

		const client = new Client({
			webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
			connectHeaders: {
				Authorization: `Bearer ${token}`,
			},
			debug: (str) => console.log("STOMP Debug:", str),
			reconnectDelay: 5000,
			onConnect: () => {
				console.log("Connected to WebSocket");
				setConnectionStatus("Connected to WebSocket");

				client.subscribe("/topic/connect", (message) => {
					const response = message.body;
					setConnectionStatus(response);
					console.log("Received from /topic/connect:", response);
				});

				client.publish({
					destination: "/app/connect",
					body: email, // Use email or another identifier for the connection
				});
			},
			onDisconnect: () => {
				console.log("Disconnected from WebSocket");
				setConnectionStatus("Disconnected");
			},
			onStompError: (frame) => {
				console.error("STOMP error:", frame.headers["message"]);
				setConnectionStatus("Error: " + frame.headers["message"]);
			},
		});

		client.activate();

		return () => {
			client.deactivate();
		};
	}, [isAuthenticated, email]);

	return (
		<div>
			{!isAuthenticated ? (
				<form onSubmit={handleLogin}>
					<h2>Login</h2>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<button type="submit">Login</button>
				</form>
			) : (
				<div>
					<h2>STOMP Client Connection</h2>
					<p>Status: {connectionStatus}</p>
				</div>
			)}
		</div>
	);
};

export default StompClientComponent;
