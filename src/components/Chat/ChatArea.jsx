import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatArea({ messages }) {
	return (
		<ScrollArea className="flex-1 p-4">
			<div className="space-y-4">
				{messages.map((msg, index) => (
					<div
						key={index}
						className={`flex ${
							msg.isSent ? "justify-end gap-2" : "justify-start"
						}`}
					>
						<div
							className={`${
								msg.isSent
									? "bg-blue-600 text-white"
									: "bg-zinc-800 text-zinc-200"
							} rounded-2xl px-4 py-2 max-w-[80%]`}
						>
							<p>{msg.text}</p>
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
