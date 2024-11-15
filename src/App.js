import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WebRTCComponent = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [targetUser, setTargetUser] = useState("");
	const [isConnected, setIsConnected] = useState(false);
	const [messageHistory, setMessageHistory] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [incomingOfferNotification, setIncomingOfferNotification] =
		useState(null);

	const clientRef = useRef(null);
	const peerConnection = useRef(
		new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		})
	).current;
	const dataChannelRef = useRef(null);
	const iceCandidatesQueue = [];

	peerConnection.onicecandidate = (event) => {
		if (event.candidate) {
			sendCandidate(event.candidate);
		}
	};

	peerConnection.ondatachannel = (event) => {
		dataChannelRef.current = event.channel;

		dataChannelRef.current.onopen = () => {
			console.log("Data channel is open on receiver side");
			setIsDataChannelOpen(true);
		};

		dataChannelRef.current.onmessage = (event) => {
			const message = event.data;
			setMessageHistory((prev) => [...prev, { sender: targetUser, message }]);
		};
	};

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
			debug: (str) => console.log(str),
			reconnectDelay: 5000,
			onConnect: () => {
				console.log("Connected to signaling server");
				setIsConnected(true);

				// Subscribe to the user-specific topics for signaling
				client.subscribe(`/topic/${user}/offer`, handleReceivedOffer);
				client.subscribe(`/topic/${user}/answer`, handleReceivedAnswer);
				client.subscribe(`/topic/${user}/candidate`, handleReceivedCandidate);
			},
		});

		client.activate();
		clientRef.current = client;
	};

	const startChat = async () => {
		dataChannelRef.current = peerConnection.createDataChannel("chat");

		dataChannelRef.current.onopen = () => {
			console.log("Data channel is open on initiator side");
			setIsDataChannelOpen(true);
		};

		dataChannelRef.current.onmessage = (event) => {
			const message = event.data;
			setMessageHistory((prev) => [...prev, { sender: targetUser, message }]);
		};

		// Generate an offer
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);

		// Log and check if the offer is valid before sending
		if (offer && offer.type && offer.sdp) {
			console.log("Generated offer:", offer);
			sendOffer(offer);
		} else {
			console.error("Generated offer is invalid:", offer);
		}
	};

	// Handle incoming offer automatically by creating an answer
	const handleReceivedOffer = async (message) => {
		try {
			const parsedMessage = JSON.parse(message.body);
			const { offer, sender } = parsedMessage;

			// Check if offer is defined and has both type and sdp properties
			if (!offer || !offer.type || !offer.sdp) {
				console.error("Received an invalid offer:", offer);
				return;
			}

			// Set targetUser to sender of the offer
			setTargetUser(sender);

			await peerConnection.setRemoteDescription(
				new RTCSessionDescription(offer)
			);
			console.log("Remote description set with offer");

			// Create an answer and send it back to the targetUser (sender of the offer)
			const answer = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answer);
			sendAnswer(answer, sender);
		} catch (error) {
			console.error("Error in handleReceivedOffer:", error);
		}
	};

	const handleReceivedAnswer = async (message) => {
		const { answer } = JSON.parse(message.body);
		await peerConnection.setRemoteDescription(
			new RTCSessionDescription(answer)
		);
		console.log("Remote description set with answer");

		// Process any queued ICE candidates now that the remote description is set
		await applyQueuedIceCandidates();
	};

	// Function to handle received ICE candidates
	const handleReceivedCandidate = async (message) => {
		try {
			const candidateData = JSON.parse(message.body);

			if (candidateData && candidateData.candidate) {
				const iceCandidate = new RTCIceCandidate(candidateData.candidate);

				if (peerConnection.remoteDescription) {
					await peerConnection.addIceCandidate(iceCandidate);
					console.log("Added ICE candidate:", iceCandidate);
				} else {
					iceCandidatesQueue.push(iceCandidate);
					console.log("Queued ICE candidate:", iceCandidate);
				}
			} else {
				console.warn("Received malformed ICE candidate:", candidateData);
			}
		} catch (error) {
			console.error("Error adding received ICE candidate:", error);
		}
	};

	// Apply queued ICE candidates after setting the remote description
	const applyQueuedIceCandidates = async () => {
		try {
			while (iceCandidatesQueue.length > 0) {
				const candidate = iceCandidatesQueue.shift();
				await peerConnection.addIceCandidate(candidate);
				console.log("Added queued ICE candidate:", candidate);
			}
		} catch (error) {
			console.error("Error adding queued ICE candidate:", error);
		}
	};

	const sendOffer = (offer) => {
		if (!targetUser) {
			console.error("Target user is not defined");
			return;
		}
		clientRef.current.publish({
			destination: "/app/offer",
			body: JSON.stringify({ offer, targetUser, sender: username }),
		});
	};

	const sendAnswer = (answer, targetUser) => {
		if (!targetUser) {
			console.error("Target user is not defined");
			return;
		}
		clientRef.current.publish({
			destination: "/app/answer",
			body: JSON.stringify({ answer, targetUser, sender: username }),
		});
	};

	const sendCandidate = (candidate) => {
		if (!targetUser) {
			console.error("Target user is not defined");
			return;
		}
		clientRef.current.publish({
			destination: "/app/candidate",
			body: JSON.stringify({ candidate, targetUser, sender: username }),
		});
	};

	// Send message over the data channel
	const sendMessage = () => {
		if (isDataChannelOpen && dataChannelRef.current.readyState === "open") {
			dataChannelRef.current.send(newMessage);
			setMessageHistory([
				...messageHistory,
				{ sender: "You", message: newMessage },
			]);
			setNewMessage("");
		} else {
			console.error("Data channel is not open. Cannot send message.");
		}
	};

	return (
		<div>
			{!isAuthenticated ? (
				<form onSubmit={handleLogin}>
					<input
						// type="email"
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
			) : (
				<div>
					{isConnected ? (
						<>
							<input
								type="text"
								placeholder="Enter target username"
								value={targetUser || ""}
								onChange={(e) => setTargetUser(e.target.value)}
							/>
							<button onClick={startChat}>Start Chat</button>

							{incomingOfferNotification && (
								<div>{incomingOfferNotification}</div>
							)}

							<div>
								{messageHistory.map((msg, index) => (
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
						<p>Connecting to signaling server...</p>
					)}
				</div>
			)}
		</div>
	);
};

export default WebRTCComponent;
