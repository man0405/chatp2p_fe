import { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function Call() {
	const [username, setUsername] = useState("");
	const [targetUser, setTargetUser] = useState("");
	const [isCameraOn, setIsCameraOn] = useState(false);
	const [isMicOn, setIsMicOn] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [isCallStarted, setIsCallStarted] = useState(false);
	const videoRef = useRef(null);
	const remoteVideoRef = useRef(null);
	const localStreamRef = useRef(null);
	const remoteStreamRef = useRef(null);
	const peerConnectionRef = useRef(null);
	const clientRef = useRef(null);

	const servers = [
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

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const usernameParam = params.get("username");
		const targetUserParam = params.get("targetUser");

		if (!usernameParam || !targetUserParam) {
			console.error("Username or Target User is missing in query params");
			return;
		}

		setUsername(usernameParam);
		setTargetUser(targetUserParam);

		console.log("Call started with:", { usernameParam, targetUserParam });

		const client = new Client({
			webSocketFactory: () => new SockJS(process.env.SERVER_URL + "/ws"),
			connectHeaders: {
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
			debug: (str) => console.log("STOMP debug:", str),
			reconnectDelay: 5000,
			onConnect: () => {
				console.log("Connected to signaling server");

				client.subscribe(`/topic/${usernameParam}/offer`, handleIncomingOffer);
				client.subscribe(
					`/topic/${usernameParam}/answer`,
					handleIncomingAnswer
				);
				client.subscribe(
					`/topic/${usernameParam}/candidate`,
					handleIncomingCandidate
				);

				// Start the call once connected to the signaling server
				startCall();
			},
			onStompError: (frame) => {
				console.error("STOMP error:", frame.headers["message"]);
			},
		});

		client.activate();

		clientRef.current = client;

		return () => {
			client.deactivate();
			hangUp();
		};
	}, []);

	const createPeerConnection = () => {
		const peerConnection = new RTCPeerConnection({ iceServers: servers });

		peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				console.log("Local ICE candidate:", event.candidate);
				clientRef.current.publish({
					destination: `/app/candidate`,
					body: JSON.stringify({
						candidate: event.candidate,
						targetUser,
						sender: username,
					}),
				});
			} else {
				console.log("End of local ICE candidates.");
			}
		};

		peerConnection.oniceconnectionstatechange = () => {
			const iceState = peerConnection.iceConnectionState;
			console.log("ICE connection state:", iceState);

			if (iceState === "failed") {
				console.log("ICE connection failed. Possible NAT issue detected.");
			} else if (iceState === "disconnected") {
				console.log("ICE connection disconnected.");
			} else if (iceState === "connected") {
				console.log("Peers are connected!");
				setIsConnected(true);
			}
		};

		peerConnection.ontrack = (event) => {
			console.log("ontrack event:", event);
			if (event.streams && event.streams[0]) {
				console.log("Remote stream received:", event.streams[0]);
				remoteStreamRef.current = event.streams[0];
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = event.streams[0];
				}
			} else {
				console.warn("No streams found in ontrack event");
			}
		};

		return peerConnection;
	};

	const [isRemoteStreamReady, setIsRemoteStreamReady] = useState(false);
	const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);

	// Updated Start Call
	const startCall = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});

			localStreamRef.current = stream;
			setIsLocalStreamReady(true);

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}

			const peerConnection = createPeerConnection();
			peerConnectionRef.current = peerConnection;

			stream.getTracks().forEach((track) => {
				peerConnection.addTrack(track, stream);
			});

			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);

			console.log("Offer created and set:", offer);

			clientRef.current.publish({
				destination: `/app/offer`,
				body: JSON.stringify({
					offer,
					targetUser,
					sender: username,
				}),
			});
		} catch (err) {
			console.error("Error starting call:", err);
		}
	};

	const handleIncomingOffer = async (message) => {
		try {
			const { offer, sender } = JSON.parse(message.body);
			console.log("Received offer from:", sender);

			const peerConnection = createPeerConnection();
			peerConnectionRef.current = peerConnection;

			await peerConnection.setRemoteDescription(
				new RTCSessionDescription(offer)
			);

			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			localStreamRef.current = stream;
			setIsLocalStreamReady(true);

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}

			stream.getTracks().forEach((track) => {
				peerConnection.addTrack(track, stream);
			});

			const answer = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answer);

			console.log("Sending answer:", answer);

			clientRef.current.publish({
				destination: `/app/answer`,
				body: JSON.stringify({
					answer,
					targetUser: sender,
					sender: username,
				}),
			});
		} catch (err) {
			console.error("Error handling incoming offer:", err);
		}
	};

	const handleIncomingAnswer = async (message) => {
		try {
			const { answer, sender } = JSON.parse(message.body);
			console.log("Received answer from:", sender);

			const peerConnection = peerConnectionRef.current;
			if (peerConnection) {
				await peerConnection.setRemoteDescription(
					new RTCSessionDescription(answer)
				);
				setIsConnected(true);
				console.log("Set remote description with answer");
			}
		} catch (err) {
			console.error("Error handling incoming answer:", err);
		}
	};

	const handleIncomingCandidate = async (message) => {
		try {
			const { candidate } = JSON.parse(message.body);

			console.log("Received ICE candidate:", candidate);

			if (peerConnectionRef.current) {
				await peerConnectionRef.current
					.addIceCandidate(new RTCIceCandidate(candidate))
					.then(() => {
						console.log("ICE candidate added successfully");
					})
					.catch((error) => {
						console.error("Error adding ICE candidate", error);
					});
			}
		} catch (err) {
			console.error("Error handling incoming candidate:", err);
		}
	};

	const toggleCamera = async () => {
		if (isCameraOn) {
			localStreamRef.current?.getVideoTracks().forEach((track) => track.stop());
			setIsCameraOn(false);
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: isMicOn,
				});
				localStreamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setIsCameraOn(true);
			} catch (err) {
				console.error("Error accessing camera:", err);
			}
		}
	};

	const toggleMic = async () => {
		if (isMicOn) {
			localStreamRef.current?.getAudioTracks().forEach((track) => track.stop());
			setIsMicOn(false);
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: isCameraOn,
					audio: true,
				});
				localStreamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setIsMicOn(true);
			} catch (err) {
				console.error("Error accessing microphone:", err);
			}
		}
	};

	const hangUp = () => {
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}

		if (clientRef.current) {
			clientRef.current.deactivate();
		}

		setIsCallStarted(false);
		setIsCameraOn(false);
		setIsMicOn(false);
		setIsConnected(false);
		console.log("Call ended.");
	};

	return (
		<div className="flex flex-col h-screen bg-gray-900">
			<div className="flex-1 bg-black flex items-center justify-center relative">
				<div
					className={`relative w-full h-full ${
						isConnected ? "absolute top-0 right-0 w-1/4 h-1/4 z-10" : ""
					}`}
				>
					<video
						ref={videoRef}
						className={`w-full h-full object-cover ${
							isCameraOn ? "" : "hidden"
						}`}
						autoPlay
						playsInline
						muted
					/>
				</div>
				<div className="relative w-full h-full">
					{/* {isRemoteStreamReady ? ( */}
					<video
						ref={remoteVideoRef}
						className="w-full h-full object-cover"
						autoPlay
						playsInline
					/>
					{/* ) : ( */}
					{/* <div className="flex justify-center items-center w-full h-full text-white">
            Waiting for the remote user to connect...
          </div> */}
					{/* )} */}
				</div>
			</div>

			<div className="flex justify-center items-center p-4 bg-gray-800">
				<Button onClick={toggleCamera}>
					{isCameraOn ? <Camera /> : <CameraOff />}
				</Button>
				<Button onClick={toggleMic}>{isMicOn ? <Mic /> : <MicOff />}</Button>
				<Button onClick={startCall} className="bg-green-500">
					Start Call
				</Button>
				<Button onClick={hangUp} className="bg-red-500">
					<PhoneOff />
				</Button>
			</div>
		</div>
	);
}
