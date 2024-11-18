import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WebRTCComponent = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [targetUser, setTargetUser] = useState("");
	const [isConnected, setIsConnected] = useState(false);
	const [messageHistory, setMessageHistory] = useState({});
	const [newMessage, setNewMessage] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [activeUsers, setActiveUsers] = useState([]);

	const clientRef = useRef(null);
	const peerConnections = useRef(new Map()).current;
	const dataChannels = useRef(new Map()).current;
	const iceCandidatesQueue = useRef(new Map()).current;

	// Ref to store the latest username
	const usernameRef = useRef("");

	useEffect(() => {
		usernameRef.current = username;
	}, [username]);

	// Login and obtain JWT token
	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch("http://localhost:8080/auth/signin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (response.ok) {
				const token = await response.text();
				localStorage.setItem("token", token);
				setIsAuthenticated(true);

				// Extract the username from email or set it explicitly
				const extractedUsername = email.split("@")[0];
				setUsername(extractedUsername);
				console.log("Username set to:", extractedUsername); // Logging

				// Connect to signaling server after setting username
				connectToSignalingServer(token, extractedUsername);
			} else {
				console.error("Login failed");
			}
		} catch (error) {
			console.error("Error during login:", error);
		}
	};

	// Connect to the signaling server with JWT
	const connectToSignalingServer = (token, user) => {
		const client = new Client({
			webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
			connectHeaders: { Authorization: `Bearer ${token}` },
			debug: (str) => console.log("STOMP Debug:", str),
			reconnectDelay: 5000,
			onDisconnect: () => {
				console.error("Disconnected from signaling server");
				setIsConnected(false);
			},
			onConnect: () => {
				console.log("Connected to signaling server");
				setIsConnected(true);

				client.subscribe("/topic/users", (message) => {
					setActiveUsers(JSON.parse(message.body));
				});

				client.publish({
					destination: "/app/register",
					body: user,
				});

				// Subscribe to the user-specific topics for signaling
				client.subscribe(`/topic/${user}/offer`, handleReceivedOffer);
				client.subscribe(`/topic/${user}/answer`, handleReceivedAnswer);
				client.subscribe(`/topic/${user}/candidate`, handleReceivedCandidate);
			},
			onStompError: (frame) => {
				console.error("STOMP error:", frame.headers["message"]);
				console.error("Detailed error:", frame.body);
			},
		});

		client.activate();
		clientRef.current = client;
	};

	const startChat = async (targetUser) => {
		if (peerConnections.has(targetUser)) {
			console.warn(`Already connected to ${targetUser}`);
			return;
		}

		const iceServers = [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			// Add TURN servers here if necessary
		];

		const newPeerConnection = new RTCPeerConnection({ iceServers });
		peerConnections.set(targetUser, newPeerConnection);

		const dataChannel = newPeerConnection.createDataChannel("chat");
		dataChannels.set(targetUser, dataChannel);

		// Data Channel Event Handlers
		dataChannel.onopen = () => {
			console.log(`Data channel is open with ${targetUser}`);
		};

		dataChannel.onclose = () => {
			console.log(`Data channel closed with ${targetUser}`);
		};

		dataChannel.onerror = (error) => {
			console.error(`Data channel error with ${targetUser}:`, error);
		};

		dataChannel.onmessage = (event) => {
			const message = event.data;
			setMessageHistory((prev) => ({
				...prev,
				[targetUser]: [
					...(prev[targetUser] || []),
					{ sender: targetUser, message },
				],
			}));
		};

		// Peer Connection Event Handlers
		newPeerConnection.onconnectionstatechange = () => {
			console.log(
				`Connection state with ${targetUser}: ${newPeerConnection.connectionState}`
			);
			if (newPeerConnection.connectionState === "failed") {
				console.error(`Connection failed with ${targetUser}`);
			} else if (newPeerConnection.connectionState === "disconnected") {
				console.warn(`Connection disconnected with ${targetUser}`);
			} else if (newPeerConnection.connectionState === "connected") {
				console.log(`Connection established with ${targetUser}`);
			}
		};

		newPeerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				sendCandidate(event.candidate, targetUser);
				console.log(
					`Generated and sent ICE candidate for ${targetUser}:`,
					event.candidate
				);
			} else {
				console.log(`All ICE candidates have been sent for ${targetUser}`);
			}
		};

		newPeerConnection.ondatachannel = (event) => {
			const receiveChannel = event.channel;
			dataChannels.set(targetUser, receiveChannel);
			receiveChannel.onmessage = (event) => {
				setMessageHistory((prev) => ({
					...prev,
					[targetUser]: [
						...(prev[targetUser] || []),
						{ sender: targetUser, message: event.data },
					],
				}));
			};
		};

		try {
			const offer = await newPeerConnection.createOffer();
			await newPeerConnection.setLocalDescription(offer);
			console.log("Generated and set local offer:", offer);
			sendOffer(offer, targetUser);
		} catch (error) {
			console.error("Error creating offer:", error);
		}
	};

	// Handle incoming offer automatically by creating an answer
	const handleReceivedOffer = async (message) => {
		try {
			const parsedMessage = JSON.parse(message.body);
			const { offer, sender } = parsedMessage;
			console.log(`Received offer from ${sender}:`, offer);

			if (!peerConnections.has(sender)) {
				const iceServers = [
					{ urls: "stun:stun.l.google.com:19302" },
					{ urls: "stun:stun1.l.google.com:19302" },
					{ urls: "stun:stun2.l.google.com:19302" },
					// Add TURN servers here if necessary
				];

				const newPeerConnection = new RTCPeerConnection({ iceServers });
				peerConnections.set(sender, newPeerConnection);

				newPeerConnection.onicecandidate = (event) => {
					if (event.candidate) {
						sendCandidate(event.candidate, sender);
						console.log(
							`Generated and sent ICE candidate for ${sender}:`,
							event.candidate
						);
					} else {
						console.log(`All ICE candidates have been sent for ${sender}`);
					}
				};

				newPeerConnection.ondatachannel = (event) => {
					const receiveChannel = event.channel;
					dataChannels.set(sender, receiveChannel);
					receiveChannel.onmessage = (event) => {
						setMessageHistory((prev) => ({
							...prev,
							[sender]: [
								...(prev[sender] || []),
								{ sender, message: event.data },
							],
						}));
					};
				};

				newPeerConnection.onconnectionstatechange = () => {
					console.log(
						`Connection state with ${sender}: ${newPeerConnection.connectionState}`
					);
					if (newPeerConnection.connectionState === "failed") {
						console.error(`Connection failed with ${sender}`);
					} else if (newPeerConnection.connectionState === "disconnected") {
						console.warn(`Connection disconnected with ${sender}`);
					} else if (newPeerConnection.connectionState === "connected") {
						console.log(`Connection established with ${sender}`);
					}
				};
			}

			const peerConnection = peerConnections.get(sender);
			await peerConnection.setRemoteDescription(
				new RTCSessionDescription(offer)
			);
			console.log(`Set remote description with offer from ${sender}`);

			// Apply queued ICE candidates after remote description is set
			await applyQueuedIceCandidates(sender);

			const answer = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answer);
			console.log(`Created and set local answer for ${sender}:`, answer);
			sendAnswer(answer, sender);
		} catch (error) {
			console.error("Error in handleReceivedOffer:", error);
		}
	};

	const handleReceivedAnswer = async (message) => {
		try {
			const { answer, sender } = JSON.parse(message.body);
			console.log("Received answer from:", sender);

			if (peerConnections.has(sender)) {
				const peerConnection = peerConnections.get(sender);
				await peerConnection.setRemoteDescription(
					new RTCSessionDescription(answer)
				);
				console.log("Set remote description with answer from:", sender);

				// Apply queued ICE candidates after remote description is set
				await applyQueuedIceCandidates(sender);
			} else {
				console.error("No peer connection found for sender:", sender);
			}
		} catch (error) {
			console.error("Error in handleReceivedAnswer:", error);
		}
	};

	// Function to handle received ICE candidates
	const handleReceivedCandidate = async (message) => {
		try {
			const data = JSON.parse(message.body);
			const { candidate, sender } = data;

			// Fallback to usernameFragment if sender is empty
			const actualSender = sender || (candidate && candidate.usernameFragment);

			if (!actualSender) {
				console.error("Cannot determine sender for ICE candidate.");
				return;
			}

			console.log(`Received ICE candidate from ${actualSender}:`, candidate);

			if (peerConnections.has(actualSender)) {
				const peerConnection = peerConnections.get(actualSender);
				const iceCandidate = new RTCIceCandidate({
					candidate: candidate.candidate,
					sdpMLineIndex: candidate.sdpMLineIndex,
					sdpMid: candidate.sdpMid,
					usernameFragment: candidate.usernameFragment,
				});

				if (
					peerConnection.remoteDescription &&
					peerConnection.remoteDescription.type
				) {
					await peerConnection.addIceCandidate(iceCandidate);
					console.log("Added ICE candidate:", iceCandidate);
				} else {
					if (!iceCandidatesQueue.has(actualSender)) {
						iceCandidatesQueue.set(actualSender, []);
					}
					iceCandidatesQueue.get(actualSender).push(iceCandidate);
					console.log("Queued ICE candidate:", iceCandidate);
				}
			} else {
				console.error("No peer connection found for sender:", actualSender);
			}
		} catch (error) {
			console.error("Error adding received ICE candidate:", error);
		}
	};

	// Apply queued ICE candidates after setting the remote description
	const applyQueuedIceCandidates = async (sender) => {
		if (iceCandidatesQueue.has(sender) && peerConnections.has(sender)) {
			const peerConnection = peerConnections.get(sender);
			const candidates = iceCandidatesQueue.get(sender);
			while (candidates.length > 0) {
				const candidate = candidates.shift();
				try {
					await peerConnection.addIceCandidate(candidate);
					console.log("Added queued ICE candidate:", candidate);
				} catch (error) {
					console.error("Error adding queued ICE candidate:", error);
				}
			}
			iceCandidatesQueue.delete(sender);
		}
	};

	const sendOffer = (offer, targetUser) => {
		if (!targetUser) {
			console.error("Target user is not defined");
			return;
		}
		clientRef.current.publish({
			destination: "/app/offer",
			body: JSON.stringify({ offer, targetUser, sender: usernameRef.current }),
		});
		console.log("Sent offer to:", targetUser);
	};

	const sendAnswer = (answer, targetUser) => {
		if (!targetUser) {
			console.error("Target user is not defined");
			return;
		}
		clientRef.current.publish({
			destination: "/app/answer",
			body: JSON.stringify({ answer, targetUser, sender: usernameRef.current }),
		});
		console.log(`Sent answer to ${targetUser}:`, answer);
	};

	const sendCandidate = (candidate, targetUser) => {
		if (!targetUser) {
			console.error("Target user is not defined");
			return;
		}
		console.log("Sending candidate with sender:", usernameRef.current); // Logging
		clientRef.current.publish({
			destination: "/app/candidate",
			body: JSON.stringify({
				candidate,
				targetUser,
				sender: usernameRef.current,
			}),
		});
		console.log(`Sent ICE candidate to ${targetUser}:`, candidate);
	};

	// Send message over the data channel
	const sendMessage = () => {
		if (targetUser && dataChannels.has(targetUser)) {
			const dataChannel = dataChannels.get(targetUser);
			console.log("sendMessage ~ dataChannel:", dataChannel);

			if (dataChannel.readyState === "open") {
				dataChannel.send(newMessage);
				setMessageHistory((prev) => ({
					...prev,
					[targetUser]: [
						...(prev[targetUser] || []),
						{ sender: "You", message: newMessage },
					],
				}));
				setNewMessage("");
			} else if (dataChannel.readyState === "connecting") {
				console.log("Data channel is still connecting. Please wait.");
				setTimeout(sendMessage, 1000); // Retry after 1 second
			} else {
				console.error(
					"Data channel is not open or does not exist. Cannot send message."
				);
			}
		} else {
			console.error("No data channel found for the target user.");
		}
	};

	return (
		<div style={{ display: "flex", height: "100vh" }}>
			{/* Left Panel: Active Users */}
			<div
				style={{ width: "25%", borderRight: "1px solid gray", padding: "10px" }}
			>
				<div className="flex">
					<div>333</div>
					<div>333</div>
					<div>333</div>
				</div>
				<h3>Active Users</h3>
				<ul>
					{activeUsers
						.filter((user) => user !== username)
						.map((user) => (
							<li
								key={user}
								onClick={() => {
									setTargetUser(user);
									startChat(user);
								}}
								style={{ cursor: "pointer", marginBottom: "10px" }}
							>
								{user}
							</li>
						))}
				</ul>
			</div>

			{/* Right Panel: Chat Box */}
			<div style={{ flex: 1, padding: "10px" }}>
				{!isAuthenticated ? (
					<form onSubmit={handleLogin}>
						<input
							type="text"
							placeholder="Enter email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<input
							type="password"
							placeholder="Enter password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<button type="submit">Login</button>
					</form>
				) : !isConnected ? (
					<p>Connecting to signaling server...</p>
				) : targetUser ? (
					<>
						<h3>Chat with {targetUser}</h3>
						<div
							style={{
								border: "1px solid gray",
								height: "400px",
								overflowY: "auto",
								marginBottom: "10px",
								padding: "10px",
							}}
						>
							{messageHistory[targetUser] &&
								messageHistory[targetUser].map((msg, index) => (
									<div key={index}>
										<strong>{msg.sender}:</strong> {msg.message}
									</div>
								))}
						</div>
						<input
							type="text"
							placeholder="Type a message"
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
						/>
						<button onClick={sendMessage}>Send Message</button>
					</>
				) : (
					<p>Select a user to start chatting.</p>
				)}
			</div>
		</div>
	);
};

export default WebRTCComponent;
