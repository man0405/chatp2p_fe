import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

  const startCall = async (targetUser) => {
    console.log("startCall invoked with:", targetUser);
    // Ensure targetUser is not an event object
    if (targetUser && typeof targetUser !== "string") {
      console.error("Invalid targetUser:", targetUser);
      return;
    }

    // Avoid accidentally passing the event object
    const callNotificationPayload = {
      targetUser,
      caller: username,
    };

    // Notify the target user about the call
    clientRef.current.publish({
      destination: `/app/call-notification`,
      body: JSON.stringify(callNotificationPayload), // Ensure only serializable data
    });
    console.log(`Call notification sent to ${targetUser}`);
  };

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // Add TURN servers here if necessary
  ];
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
				const token = await response.json();
				localStorage.setItem("token", token.data);
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
        disconnect();
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
        client.subscribe(
          `/topic/${user}/call-notification`,
          handleCallNotification
        );
        client.subscribe(`/topic/${user}/call-accepted`, hanedleCallAccepted);
			},
			onStompError: (frame) => {
				console.error("STOMP error:", frame.headers["message"]);
				console.error("Detailed error:", frame.body);
			},
		});

		client.activate();
		clientRef.current = client;
	};

  const hanedleCallAccepted = (message) => {
    try {
      const { targetUser } = JSON.parse(message.body);
      console.log("message.body", message.body);

      openCallTab(usernameRef.current, targetUser);
    } catch (error) {
      console.error("Error handling call acceptejd:", error);
    }
  };

  const handleCallNotification = (message) => {
    try {
      const { caller, message: notification = "Incoming call" } = JSON.parse(
        message.body
      );
      console.log(`Incoming call notification from ${caller}: ${notification}`);

      const accept = window.confirm(`${caller} is calling you. Accept?`);
      if (accept) {
        console.log("Call accepted. Starting chat with:", caller);
        openCallTab(usernameRef.current, caller);
        clientRef.current.publish({
          destination: `/app/call-accepted`,
          body: JSON.stringify({
            targetUser: caller,
            sender: usernameRef.current,
          }),
        });
      }
    } catch (error) {
      console.error("Error handling call notification:", error);
    }
  };

  const startChat = async (targetUser) => {
    if (peerConnections.has(targetUser)) {
      console.warn(`Already connected to ${targetUser}`);
      return;
    }

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

  const openCallTab = (username, targetUser) => {
    console.log("Opening call tab...");
    const url = `/call?username=${encodeURIComponent(
      username
    )}&targetUser=${encodeURIComponent(targetUser)}`;
    console.log("Opening URL:", url);

    // Open a new tab or window
    const newWindow = window.open(url, "_blank", "width=800,height=600");
    if (!newWindow) {
      console.error("Failed to open call tab. Check popup blockers.");
    } else {
      console.log("Call tab opened successfully.");
    }
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.publish({
        destination: "/app/exit",
        body: username,
      });
      console.log("WebSocket connection closed");
    }
  };

  // const VideoCall = ({ isOpen, setIsOpen }) => {
  //   const [username, setUsername] = useState(this.username);
  //   const [targetUser, setTargetUser] = useState(this.targetUser);
  //   const [isCameraOn, setIsCameraOn] = useState(false);
  //   const [isMicOn, setIsMicOn] = useState(false);
  //   const [isConnected, setIsConnected] = useState(false);
  //   const videoRef = useRef(null);
  //   const remoteVideoRef = useRef(null);
  //   const localStreamRef = useRef(null);
  //   const remoteStreamRef = useRef(null);
  //   const peerConnectionRef = useRef(null);
  //   const clientRef = useRef(null);

  //   const startCall = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //         audio: true,
  //       });

  //       localStreamRef.current = stream;
  //       if (videoRef.current) {
  //         videoRef.current.srcObject = stream;
  //       }

  //       const peerConnection = createPeerConnection();
  //       peerConnectionRef.current = peerConnection;

  //       stream.getTracks().forEach((track) => {
  //         peerConnection.addTrack(track, stream);
  //       });

  //       const offer = await peerConnection.createOffer();
  //       await peerConnection.setLocalDescription(offer);

  //       console.log("Offer created and set:", offer);
  //       console.log("Updated peerConnectionRef:", peerConnectionRef.current);
  //     } catch (err) {
  //       console.error("Error starting call:", err);
  //     }
  //   };

  //   useEffect(() => {
  //     // Log state changes for username and targetUser
  //     console.log("Updated username:", username);
  //     console.log("Updated targetUser:", targetUser);
  //   }, [username, targetUser]);

  //   const handleClose = () => {
  //     setIsOpen(false); // Close the modal
  //   };

  //   return (
  //     <Dialog open={isOpen} onOpenChange={setIsOpen}>
  //       <DialogContent className="w-full max-w-lg p-6">
  //         <DialogTitle>Calling</DialogTitle>

  //         <div className="flex flex-col h-screen bg-gray-900">
  //           <div className="flex-1 bg-black flex items-center justify-center relative">
  //             <video
  //               ref={videoRef}
  //               className={`w-full max-h-[840px] object-cover ${
  //                 isCameraOn ? "" : "hidden"
  //               }`}
  //               autoPlay
  //               playsInline
  //               muted
  //             />
  //             <video
  //               ref={remoteVideoRef}
  //               className={`w-full max-h-[840px] object-cover ${
  //                 isConnected ? "" : "hidden"
  //               }`}
  //               autoPlay
  //               playsInline
  //             />
  //             {!isCameraOn && (
  //               <p className="text-gray-300 absolute">Camera is off</p>
  //             )}
  //             {!isConnected && (
  //               <p className="text-gray-300 absolute">
  //                 Waiting for connection...
  //               </p>
  //             )}
  //           </div>

  //           <div className="flex justify-center items-center p-4 bg-gray-800">
  //             <Button onClick={toggleCamera}>
  //               {isCameraOn ? <Camera /> : <CameraOff />}
  //             </Button>
  //             <Button onClick={toggleMic}>
  //               {isMicOn ? <Mic /> : <MicOff />}
  //             </Button>
  //             <Button onClick={startCall} className="bg-green-500">
  //               Start Call
  //             </Button>
  //             <Button onClick={hangUp} className="bg-red-500">
  //               <PhoneOff />
  //             </Button>
  //           </div>
  //         </div>

  //         {/* Action Buttons */}
  //         <div className="flex justify-end mt-6">
  //           <Button variant="secondary" className="mr-2" onClick={handleClose}>
  //             Cancel
  //           </Button>
  //           <Button
  //             variant="primary"
  //             // Trigger fetch on button click
  //           >
  //             Search
  //           </Button>
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* <VideoCall isOpen={isModalOpen} setIsOpen={setIsModalOpen} /> */}
      {/* Left Panel: Active Users */}
      <div
        style={{ width: "25%", borderRight: "1px solid gray", padding: "10px" }}
      >
        <div className="flex justify-between">
          <div>333</div>
          <div>333</div>
          <div>333</div>
          <Button onClick={disconnect}>Close</Button>
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
            <Button onClick={() => startCall(targetUser)}>Call</Button>
          </>
        ) : (
          <p>Select a user to start chatting.</p>
        )}
      </div>
    </div>
  );
};

export default WebRTCComponent;
