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
import { useState } from "react";

export default function Test() {
	const [message, setMessage] = useState("");

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
}
