import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Camera, Smile, Send, ThumbsUp } from "lucide-react";

export function MessageInput({ sendMessage }) {
	const [message, setMessage] = useState("");

	const handleSend = () => {
		if (message.trim()) {
			sendMessage(message, "text", new Date().toISOString());
			setMessage("");
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && message.trim()) {
			handleSend();
		}
	};

	return (
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
						onKeyPress={handleKeyPress}
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
					onClick={handleSend}
				>
					{message ? (
						<Send className="w-5 h-5" />
					) : (
						<ThumbsUp className="w-5 h-5" />
					)}
				</Button>
			</div>
		</div>
	);
}
