import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { scrollToBottom } from "@/utils/scrollToBottom";
import { getToken } from "@/services/token.service";
import axiosClient from "@/lib/axios/axiosClient";
import FilePreview from "./FilePreview";
import ImagePreview from "./ImagePreview";
import IconLoader from "../Utils/IconLoader";

export function ChatArea({ messagesHistory, username }) {
	console.log("ChatArea ~ username:", username);
	const scrollBottom = useRef();

	useEffect(() => {
		if (scrollBottom.current) {
			scrollToBottom(scrollBottom.current, true);
		}
	}, [messagesHistory]);

	const handleFileClick = (msg) => {
		// Logic for handling file click/download
		console.log("Downloading file:", msg);
	};

	return (
		<ScrollArea className="flex-1 p-4">
			<div className="space-y-4" ref={scrollBottom}>
				{messagesHistory?.map((msg, index) => (
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
							{msg.type === "file" && (
								<FilePreview
									fileName={msg.fileName}
									onDownload={() => handleFileClick(msg)}
								/>
							)}
							{msg.type === "image" && (
								<ImagePreview downloadUrl={msg.downloadUrl} />
							)}
							{msg.type === "icons" && (
								<IconLoader name={msg.message} className="w-6 h-6" />
							)}
							{msg.type !== "file" &&
								msg.type !== "image" &&
								msg.type !== "icons" && <p>{msg.message}</p>}
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
