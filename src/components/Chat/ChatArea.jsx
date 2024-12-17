import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { scrollToBottom } from "@/utils/scrollToBottom";
import IconLoader from "../Utils/IconLoader";

export function ChatArea({ messagesHistory, username }) {
	console.log("ChatArea ~ username:", username);
	const scrollBotton = useRef();
	useEffect(() => {
		if (scrollBotton.current) {
			scrollToBottom(scrollBotton.current, true);
		}
	}, [messagesHistory]);

	return (
		<ScrollArea className="flex-1 p-4">
			<div className="space-y-4" ref={scrollBotton}>
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
							{msg.type === "icons" ? (
								<IconLoader name={msg.message} className="w-6 h-6" />
							) : (
								<p>{msg.message}</p>
							)}
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
