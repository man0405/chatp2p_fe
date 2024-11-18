import React from "react";
import { Button } from "@/components/ui/button";
import { Archive, Grid, MessageCircle, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SideBar({
	selectedSidebarItem,
	setSelectedSidebarItem,
	sidebarItems,
}) {
	return (
		<div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
			<Button
				variant="ghost"
				size="icon"
				className="mb-4 text-zinc-400 hover:text-white"
			>
				<MessagesSquare className="w-6 h-6" />
			</Button>
			<div className="flex-1 flex flex-col gap-2">
				{sidebarItems.map((item, index) => (
					<Button
						key={index}
						variant="ghost"
						size="icon"
						className={`text-zinc-400 hover:text-white relative ${
							selectedSidebarItem === index ? "bg-zinc-800" : ""
						}`}
						onClick={() => setSelectedSidebarItem(index)}
					>
						<item.icon className="w-5 h-5" />
						{item.hasNotification && (
							<div className="absolute right-2 top-2 w-2 h-2 bg-blue-600 rounded-full" />
						)}
					</Button>
				))}
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
	);
}
