import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatArea({ messagesHistory }) {
	console.log("ChatArea ~ messagesHistory:", messagesHistory);
	return (
		<ScrollArea className="flex-1 p-4">
			<div className="space-y-4">
				{messagesHistory?.map((msg, index) => (
					<div
						key={index}
						className={`flex ${
							msg.sender === "You" ? "justify-end gap-2" : "justify-start"
						}`}
					>
						<div
							className={`${
								msg.sender === "You"
									? "bg-blue-600 text-white"
									: "bg-zinc-800 text-zinc-200"
							} rounded-2xl px-4 py-2 max-w-[80%]`}
						>
							<p>{msg.message}</p>
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
