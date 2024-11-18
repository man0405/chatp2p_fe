import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Archive,
  Bell,
  Camera,
  Grid,
  Info,
  MessageCircle,
  MessagesSquare,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  ThumbsUp,
  Video,
} from "lucide-react";

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
  const [message, setMessage] = useState("");

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
    <div className="flex h-screen dark">
      {/* Icon Sidebar */}
      <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="mb-4 text-zinc-400 hover:text-white"
        >
          <MessagesSquare className="w-6 h-6" />
        </Button>
        <div className="flex-1 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <Grid className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white relative"
          >
            <MessageCircle className="w-5 h-5" />
            <div className="absolute right-2 top-2 w-2 h-2 bg-blue-600 rounded-full" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <Archive className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>UN</AvatarFallback>
            </Avatar>
          </Button>
          <div className="absolute -right-1 -top-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            1
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid" style={{ gridTemplateColumns: "360px 1fr" }}>
        {/* Left Sidebar */}
        <div className="bg-zinc-900 border-r border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-white">Chats</h1>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search (⌘K)"
                className="pl-8 bg-zinc-800 border-0 text-zinc-200 placeholder:text-zinc-400 focus-visible:ring-0"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-88px)]">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/50 relative"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium text-zinc-200">User Name</p>
                    <span className="text-xs text-zinc-400">2:50 PM</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    Latest message preview here...
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col bg-zinc-900">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-200">mit uốt</span>
                <span className="text-xs text-zinc-400">Active now</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Video className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <Card className="mx-4 mt-4 bg-zinc-800/50 border-0">
            <div className="p-4 flex items-start gap-4">
              <div className="rounded-full bg-zinc-700 p-2">
                <Bell className="w-5 h-5 text-zinc-200" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-200 mb-1">
                  Extra security for chats
                </h3>
                <p className="text-sm text-zinc-400">
                  Messenger&apos;s evolving security with end-to-end encryption
                  for some calls and chats.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-zinc-200 hover:text-white"
              >
                Learn More
              </Button>
            </div>
          </Card>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-200 rounded-2xl px-4 py-2 max-w-[80%]">
                  <p>k bt</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                  <p>tý sạc</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Camera className="w-5 h-5" />
              </Button>
              <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="border-0 bg-transparent focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-400"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                {message ? (
                  <Send className="w-5 h-5" />
                ) : (
                  <ThumbsUp className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCComponent;
