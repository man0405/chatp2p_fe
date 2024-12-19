import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Search } from "lucide-react";

const contacts = [
	{ name: "Anh Danh", image: "/placeholder.svg" },
	{ name: "Ba", image: "/placeholder.svg" },
	{ name: "Bảo Quân", image: "/placeholder.svg" },
	{ name: "Cầu Phúc", image: "/placeholder.svg", status: "Business" },
	{ name: "Chi", image: "/placeholder.svg" },
	{ name: "Đại", image: "/placeholder.svg" },
	{ name: "Đạt", image: "/placeholder.svg" },
	{ name: "Đinh Thị Đông Phương", image: "/placeholder.svg" },
	{ name: "Đoan Lễ", image: "/placeholder.svg" },
	{ name: "Đức Tâm", image: "/placeholder.svg" },
	{ name: "Dương", image: "/placeholder.svg" },
	{ name: "Dương Văn Bảo", image: "/placeholder.svg" },
];

const groupedContacts = contacts.reduce((acc, contact) => {
	const firstLetter = contact.name[0].toUpperCase();
	if (!acc[firstLetter]) {
		acc[firstLetter] = [];
	}
	acc[firstLetter].push(contact);
	return acc;
}, {});

export default function Friend() {
	return (
		<>
			<div className="bg-zinc-900 border-r border-zinc-800 h-screen overflow-hidden flex flex-col">
				<div className="p-4 border-zinc-800">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-xl font-semibold text-white">
							Danh sách bạn bè
						</h1>
					</div>
					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
						<Input
							placeholder="Search (⌘K)"
							className="pl-8 bg-zinc-800 border-0 text-zinc-200 placeholder:text-zinc-400 focus-visible:ring-0"
						/>
					</div>
				</div>
				<ScrollArea className="h-[calc(100vh-8rem)]">
					<div className="p-4">
						{Object.entries(groupedContacts).map(([letter, contacts]) => (
							<div key={letter} className="mb-4">
								<h3 className="text-sm font-medium mb-2 text-zinc-400">
									{letter}
								</h3>
								{contacts.map((contact, index) => (
									<div
										key={index}
										className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg cursor-pointer group"
									>
										<Avatar className="min-h-14 min-w-14">
											<AvatarImage src={contact.image} alt={contact.name} />
											<AvatarFallback>{contact.name[0]}</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<span className="font-medium text-zinc-200">
													{contact.name}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</div>
											{contact.status && (
												<span className="text-sm text-zinc-400">
													{contact.status}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						))}
					</div>
				</ScrollArea>
			</div>

			<div className="flex-1 flex items-center justify-center  bg-zinc-900  text-zinc-400">
				Select a conversation to start chatting
			</div>
		</>
	);
}
