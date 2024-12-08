import SideBar from "@/components/Layout/SideBar/SideBar";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { Archive, Grid, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ListUser from "@/components/Chat/ListUser";
import { MessageInput } from "@/components/Chat/MessageInput";
import { ChatArea } from "@/components/Chat/ChatArea";
import ChatHeader from "@/components/Chat/ChatHeader";
import { getToken } from "@/services/token.service";

const users = [
	{
		name: "mit uốt",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Chức NỮ",
		status: "Last seen 5m ago",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Vincom",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "BCS-22GIT2",
		status: "Last seen 1h ago",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Khẩu nghiệp",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "mit uốt",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Chức NỮ",
		status: "Last seen 5m ago",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Vincom",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "BCS-22GIT2",
		status: "Last seen 1h ago",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Khẩu nghiệp",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "mit uốt",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Chức NỮ",
		status: "Last seen 5m ago",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Vincom",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "BCS-22GIT2",
		status: "Last seen 1h ago",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Khẩu nghiệp",
		status: "Active now",
		avatar: "/placeholder.svg?height=40&width=40",
	},
];

export default function Component() {
	const [message, setMessage] = useState("");
	const [selectedUser, setSelectedUser] = useState(0);
	const [selectedSidebarItem, setSelectedSidebarItem] = useState(1);
	const [messages, setMessages] = useState([
		{ text: "Hello!", isSent: false },
		{ text: "Hi there!", isSent: true },
	]);

	const sidebarItems = [
		{ icon: Grid, label: "Dashboard" },
		{ icon: MessageCircle, label: "Messages", hasNotification: true },
		{ icon: Archive, label: "Archive" },
	];
	// Handler socket and signaling
	const [isConnected, setIsConnected] = useState(false);
	const [activeUsers, setActiveUsers] = useState([]);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [newMessage, setNewMessage] = useState("");
	const [messageHistory, setMessageHistory] = useState({});
	const [targetUser, setTargetUser] = useState("");

	const usernameRef = useRef("");

	const clientRef = useRef(null);
	const peerConnections = useRef(new Map()).current;
	const dataChannels = useRef(new Map()).current;
	const iceCandidatesQueue = useRef(new Map()).current;

	// Connect to the signaling server
	useEffect(() => {
		connectToSignalingServer();
	}, []);

	useEffect(() => {
		console.log("ActiveUsers state:", activeUsers);
	}, [activeUsers]);

	const connectToSignalingServer = () => {
		const token = getToken();
		const username = localStorage.getItem("username");
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
					// setActiveUsers(JSON.parse(message.body));
				});

				client.subscribe("/user/queue/active-friends", function (message) {
					const activeFriends = JSON.parse(message.body);
					console.log("Active friends:", activeFriends); // have data
					setActiveUsers([...activeFriends]); // it doesnt set data here

					// Update the UI with the active friends
					// updateActiveFriendsUI(activeFriends);
				});

				client.publish({
					destination: "/app/register",
					body: username,
				});

				// Subscribe to the user-specific topics for signaling
				client.subscribe(`/topic/${username}/offer`, handleReceivedOffer);
				client.subscribe(`/topic/${username}/answer`, handleReceivedAnswer);
				client.subscribe(
					`/topic/${username}/candidate`,
					handleReceivedCandidate
				);
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
		<div className="flex h-screen dark">
			{/* Icon Sidebar */}
			<SideBar
				selectedSidebarItem={selectedSidebarItem}
				setSelectedSidebarItem={setSelectedSidebarItem}
				sidebarItems={sidebarItems}
			/>

			{/* Main Content */}
			<div className="flex-1 grid" style={{ gridTemplateColumns: "360px 1fr" }}>
				{/* Left Sidebar */}
				<ListUser
					activeUsers={activeUsers}
					users={users}
					selectedUser={selectedUser}
					setSelectedUser={setSelectedUser}
				/>
				{/* Main Chat Area */}
				<div className="flex flex-col bg-zinc-900 overflow-auto">
					{/* Chat Header */}
					<ChatHeader users={users} selectedUser={selectedUser} />
					{/* Chat Messages */}
					<ChatArea messages={messages} />

					{/* Message Input */}
					<MessageInput message={messages} setMessage={setMessages} />
				</div>
			</div>
		</div>
	);
}
