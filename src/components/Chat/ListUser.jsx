import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ActiveUser from "./ActiveUser";

export default function ListUser({
	latestMessage,
	activeUsers,
	userSelected,
	setUserSelected,
	startChat,
}) {
	console.log("List User:", latestMessage, userSelected);
	return (
		<div className="bg-zinc-900 border-r border-zinc-800 h-screen overflow-hidden flex flex-col ">
			<div className="p-4 border-zinc-800">
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
			<ActiveUser
				activeUsers={activeUsers}
				setUserSelected={setUserSelected}
				startChat={startChat}
			/>
			<ScrollArea className=" p-4">
				{latestMessage.map((user, index) => (
					<div
						key={index}
						className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900 cursor-pointer relative ${
							userSelected.email === user.keys ? "bg-zinc-800" : ""
						}`}
						onClick={() => {
							setUserSelected({
								email: user.keys,
								fullName: user.fullName,
								publicKey: user.publicKey,
							});
							startChat(user.keys);
						}}
					>
						<div className="relative">
							<Avatar className="min-h-14 min-w-14">
								<AvatarImage
									src={`https://placehold.jp/75/3d4070/ffffff/150x150.png?text=${user.fullName?.[0]}`}
								/>
								<AvatarFallback>{user.fullName?.slice(0, 2)}</AvatarFallback>
							</Avatar>
							<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex justify-between items-baseline">
								<p className="font-medium text-zinc-200">{user.fullName}</p>
								<span className="text-xs text-zinc-400">
									{new Date(user.timestamp).toLocaleString("en-US", {
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							<p className="text-sm text-zinc-400 truncate">{user.message}</p>
						</div>
					</div>
				))}
			</ScrollArea>
		</div>
	);
}
