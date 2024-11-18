import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Info, Phone, Search, Video } from "lucide-react";

export default function ChatHeader({ users, selectedUser }) {
	return (
		<div className="flex items-center justify-between p-2 border-b border-zinc-800">
			<div className="flex items-center gap-3">
				<Avatar>
					<AvatarImage src={users[selectedUser].avatar} />
					<AvatarFallback>
						{users[selectedUser].name.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div className="flex flex-col">
					<span className="font-semibold text-zinc-200">
						{users[selectedUser].name}
					</span>
					<span className="text-xs text-zinc-400">
						{users[selectedUser].status}
					</span>
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
	);
}
