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
import {
	storeMessageHistory,
	getMessageHistory,
	storeLatestMessage,
	getLatestMessages,
} from "@/services/message.service";
import { debounce } from "@/utils/debounce";
import { getStoredKeys } from "@/utils/rsa";

const sidebarItems = [
	{ icon: Grid, label: "Dashboard" },
	{ icon: MessageCircle, label: "Messages", hasNotification: true },
	{ icon: Archive, label: "Archive" },
];

export default function Component() {
	const [selectedSidebarItem, setSelectedSidebarItem] = useState(1);

	// Handler socket and signaling
	const [activeUsers, setActiveUsers] = useState([]);
	const [messageHistory, setMessageHistory] = useState({});
	const [userSelected, setUserSelected] = useState({});
	const [latestMessage, setLatestMessage] = useState([]);

	const usernameRef = useRef("");
	const fullName = useRef(localStorage.getItem("fullName"));
	const publicKey = useRef("");

	const clientRef = useRef(null);
	const peerConnections = useRef(new Map()).current;
	const dataChannels = useRef(new Map()).current;
	const iceCandidatesQueue = useRef(new Map()).current;

	// Connect to the signaling server
	useEffect(() => {
		connectToSignalingServer();
		const getKeys = async () => {
			const keys = await getStoredKeys();
			if (keys) {
				publicKey.current = keys.publicKey;
			}
		};
		getKeys();
	}, []);

	useEffect(() => {
		getLatestMessages().then((messages) => {
			setLatestMessage(messages);
		});
	}, []);

	// Debounce the create / update latest message
	const storeLeastMessageHandler = ({
		keys,
		message,
		type,
		fullName,
		publicKey,
	}) => {
		debounce(
			storeLatestMessage({ keys, message, type, fullName, publicKey }),
			1000
		);
	};

	useEffect(() => {
		if (userSelected.email) {
			getMessageHistory(userSelected.email).then((messages) => {
				setMessageHistory((prev) => ({
					...prev,
					[userSelected.email]: messages,
				}));
			});
		}
	}, [userSelected]);

	const connectToSignalingServer = () => {
		const token = getToken();
		const username = localStorage.getItem("username");
		usernameRef.current = username;
		const client = new Client({
			webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
			connectHeaders: { Authorization: `Bearer ${token}` },
			// debug: (str) => console.log("STOMP Debug:", str),
			reconnectDelay: 5000,
			onDisconnect: () => {
				console.error("Disconnected from signaling server");
			},
			onConnect: () => {
				console.log("Connected to signaling server");

				client.subscribe("/topic/users", (message) => {
					// setActiveUsers(JSON.parse(message.body));
				});

				client.subscribe("/user/queue/active-friends", function (message) {
					const activeFriends = JSON.parse(message.body);
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
			{ urls: "stun:stun.l.google.com:5349" },
			{ urls: "stun:stun1.l.google.com:3478" },
			{ urls: "stun:stun1.l.google.com:5349" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:5349" },
			{ urls: "stun:stun3.l.google.com:3478" },
			{ urls: "stun:stun3.l.google.com:5349" },
			{ urls: "stun:stun4.l.google.com:19302" },
			{ urls: "stun:stun4.l.google.com:5349" },
			{
				urls: "turn:relay1.expressturn.com:3478",
				username: "efW6L6DFWVSZPJXIQY",
				credential: "hcyxASnlf91Dxla9",
			},

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
			const data = JSON.parse(event.data);
			console.log("startChat ~ message:", data);
			setMessageHistory((prev) => ({
				...prev,
				[targetUser]: [
					...(prev[targetUser] || []),
					{ sender: targetUser, message: data.message, type: data.type },
				],
			}));
			storeMessageHistory({
				sender: targetUser,
				message: data.message,
				type: data.type,
				keys: targetUser,
			});
			storeLeastMessageHandler({
				keys: targetUser,
				message: data.message,
				type: data.type,
				name: data.fullName,
				publicKey: data.publicKey,
			});
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
			console.log("startChat ~ receiveChannel:", receiveChannel);
			dataChannels.set(targetUser, receiveChannel);
			receiveChannel.onmessage = (event) => {
				console.log(`Received message from ${targetUser}:`, event.data);
				const data = JSON.parse(event.data);

				setMessageHistory((prev) => ({
					...prev,
					[targetUser]: [
						...(prev[targetUser] || []),
						{ sender: targetUser, message: data.message, type: data.type },
					],
				}));
				storeMessageHistory({
					sender: targetUser,
					message: data.message,
					type: data.type,
					keys: targetUser,
				});
				storeLeastMessageHandler({
					keys: targetUser,
					message: data.message,
					type: data.type,
					fullName: data.fullName,
					publicKey: data.publicKey,
				});
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
					{ urls: "stun:stun.l.google.com:5349" },
					{ urls: "stun:stun1.l.google.com:3478" },
					{ urls: "stun:stun1.l.google.com:5349" },
					{ urls: "stun:stun2.l.google.com:19302" },
					{ urls: "stun:stun2.l.google.com:5349" },
					{ urls: "stun:stun3.l.google.com:3478" },
					{ urls: "stun:stun3.l.google.com:5349" },
					{ urls: "stun:stun4.l.google.com:19302" },
					{ urls: "stun:stun4.l.google.com:5349" },
					{
						urls: "turn:relay1.expressturn.com:3478",
						username: "efW6L6DFWVSZPJXIQY",
						credential: "hcyxASnlf91Dxla9",
					},
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
					//? Receive data channel messages here
					receiveChannel.onmessage = (event) => {
						const data = JSON.parse(event.data);
						console.log(`Received message from ${sender}:`, data);
						setMessageHistory((prev) => ({
							...prev,
							[sender]: [
								...(prev[sender] || []),
								{ sender, message: data.message, type: data.type },
							],
						}));
						storeMessageHistory({
							sender,
							message: data.message,
							type: data.type,
							keys: sender,
						});
						storeLeastMessageHandler({
							keys: sender,
							message: data.message,
							type: data.type,
							fullName: data.fullName,
							publicKey: data.publicKey,
						});
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
			console.log("handleReceivedCandidate ~ data:", data);
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
	const sendMessage = (message, type) => {
		if (userSelected.email && dataChannels.has(userSelected.email)) {
			const dataChannel = dataChannels.get(userSelected.email);
			console.log(`Sent message to ${userSelected.email}:`, message);
			console.log(
				"sendMessage ~ dataChannel.readyState:",
				JSON.stringify({
					message: message,
					type: type,
					fullName: fullName.current,
					publicKey: publicKey.current,
				})
			);

			if (dataChannel.readyState === "open") {
				dataChannel.send(
					JSON.stringify({
						message: message,
						type: type,
						fullName: fullName.current,
						publicKey: publicKey.current,
					})
				);
				setMessageHistory((prev) => ({
					...prev,
					[userSelected.email]: [
						...(prev[userSelected.email] || []),
						{ sender: usernameRef.current, message: message, type: type },
					],
				}));
				storeMessageHistory({
					sender: usernameRef.current,
					message,
					type,
					keys: userSelected.email,
				});
				storeLeastMessageHandler({
					keys: userSelected.email,
					message,
					type,
					fullName: userSelected.fullName,
					publicKey: userSelected.publicKey,
				});
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
					latestMessage={latestMessage}
					userSelected={userSelected}
					setUserSelected={setUserSelected}
					activeUsers={activeUsers}
					startChat={startChat}
				/>
				{/* Main Chat Area */}
				<div className="flex flex-col bg-zinc-900 overflow-auto">
					{/* Chat Header */}
					<ChatHeader userSelected={userSelected} />
					{/* Chat Messages */}
					<ChatArea
						messagesHistory={messageHistory[userSelected.email]}
						username={usernameRef.current}
					/>

					{/* Message Input */}
					<MessageInput sendMessage={sendMessage} />
				</div>
			</div>
		</div>
	);
}
