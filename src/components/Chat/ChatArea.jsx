import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallback, useEffect, useRef, useState } from "react";
import { scrollToBottom } from "@/utils/scrollToBottom";

import axiosClient from "@/lib/axios/axiosClient";
import FilePreview from "./FilePreview";
import ImagePreview from "./ImagePreview";
import IconLoader from "../Utils/IconLoader";
import { decrypt } from "@/utils/rsa";

export function ChatArea({ messagesHistory, username, privateKey }) {
	console.log("ChatArea ~ username:", username);
	const scrollBottom = useRef();
	const [decryptedContent, setDecryptedContent] = useState([]);
	console.log("ChatArea ~ decryptedContent:", decryptedContent);

	useEffect(() => {
		if (scrollBottom.current) {
			scrollToBottom(scrollBottom.current, true);
		}
	}, [messagesHistory]);

	const handleFileClick = async (msg) => {
		try {
			console.log(`Fetching file for: ${msg.fileName}`);
			const messageDecrypt = decryptHandler(msg.downloadUrl);
			const response = await axiosClient.get(messageDecrypt, {
				headers: {
					Authorization: `Bearer ${getToken()}`,
				},
				responseType: "blob", // To handle file data as a blob
			});
			const downloadUrl = URL.createObjectURL(response);
			const a = document.createElement("a");
			a.href = downloadUrl;
			a.download = msg.fileName || "downloaded_file";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error("Error fetching file:", error.message);
		}
	};

	const decryptHandler = useCallback(
		async (msg) => {
			try {
				if (!msg) return { content: "" };
				const decryptedMessage = await decrypt(msg, privateKey);
				return decryptedMessage;
			} catch (error) {
				console.error("Decryption error:", error);
				return { content: "Error decrypting message" };
			}
		},
		[privateKey]
	);

	useEffect(() => {
		const decryptMessages = async () => {
			const newDecryptedContent = [];
			for (const msg of messagesHistory || []) {
				try {
					const msgCopy = { ...msg };
					if (msg.sender !== username) {
						let decryptedMessage;
						if (msg.type === "image") {
							decryptedMessage = await decryptHandler(msg.downloadUrl);
							msgCopy.downloadUrl = decryptedMessage?.content || "";
						} else if (msg.type === "icons" || msg.type === "text") {
							decryptedMessage = await decryptHandler(msg.message);
							msgCopy.message = decryptedMessage?.content || "";
						} else if (msg.type === "file") {
							msgCopy.downloadUrl = msg.downloadUrl;
						}
					}
					newDecryptedContent.push(msgCopy);
				} catch (error) {
					console.error("Error processing message:", error);
					newDecryptedContent.push({
						...msg,
						message: "Error decrypting message",
					});
				}
			}
			setDecryptedContent(newDecryptedContent);
		};

		decryptMessages();
	}, [messagesHistory, decryptHandler]);

	const renderMessageContent = (msg) => {
		if (msg.type === "file") {
			return (
				<FilePreview
					fileName={msg.fileName}
					onDownload={() => handleFileClick(msg)}
				/>
			);
		}

		if (msg.type === "image") {
			return <ImagePreview downloadUrl={msg.downloadUrl} />;
		}

		if (msg.type === "icons") {
			return <IconLoader name={msg.message} className="w-6 h-6" />;
		}

		return (
			<p className="whitespace-pre-wrap break-words">
				{msg.message || "Decrypting..."}
			</p>
		);
	};

	return (
		<ScrollArea className="flex-1 p-4">
			<div className="space-y-4" ref={scrollBottom}>
				{decryptedContent?.map((msg, index) => (
					<div
						key={index}
						className={`flex ${
							msg.sender === username ? "justify-end gap-2" : "justify-start"
						}`}
					>
						<div
							className={`${
								msg.sender === username
									? "bg-blue-600 text-white"
									: "bg-zinc-800 text-zinc-200"
							} rounded-2xl px-4 py-2 max-w-[80%]`}
						>
							{renderMessageContent(msg)}
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
