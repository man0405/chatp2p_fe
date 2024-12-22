import React from "react";
import { Button } from "@/components/ui/button";
import {
	MessagesSquare,
	Settings,
	Bell,
	Globe,
	DatabaseBackup,
	LogOut,
	Monitor,
	Moon,
	Settings2,
	User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

import Backup from "@/components/Preference/Backup";

const settingsOptions = [
	{
		icon: Settings2,
		label: "General",
	},
	{
		icon: User,
		label: "Active status",
	},
	{
		icon: Bell,
		label: "Notifications",
	},
	{
		icon: Moon,
		label: "Appearance",
		description: "Mirror system preferences",
	},
	{
		icon: Globe,
		label: "Language",
		description: "System language",
	},
	{
		icon: DatabaseBackup,
		label: "Back Up",
		description: "Back up your data",
		components: <Backup />,
	},
	{
		icon: Monitor,
		label: "Mini view",
	},
	{
		icon: LogOut,
		label: "Log out",
	},
];

export default function SideBar({
	selectedSidebarItem,
	setSelectedSidebarItem,
	sidebarItems,
	fullName,
}) {
	const [activeSection, setActiveSection] = React.useState("General");
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
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className=" text-zinc-400 hover:text-white"
						>
							<Avatar className="w-8 h-8">
								<AvatarImage
									src={`https://placehold.jp/75/3d4070/ffffff/150x150.png?text=${
										fullName?.toString()[0]
									}`}
								/>
								<AvatarFallback>UN</AvatarFallback>
							</Avatar>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="ml-3 bg-zinc-900 border-zinc-800 ">
						<Dialog>
							<DialogTrigger asChild>
								<Button className="bg-zinc-900 ">
									<Settings />
									Preference
								</Button>
							</DialogTrigger>
							<DialogContent className="flex  bg-zinc-900 border-zinc-800 gap-0 p-0 md:min-h-[600px] md:max-w-4xl text-white ">
								<div className="w-64 border-r text-white">
									<div className="p-6">
										<h2 className="text-lg font-semibold">Preferences</h2>
									</div>
									<div className="space-y-4 px-2">
										<div className="space-y-1.5">
											{settingsOptions.map((option) => (
												<button
													key={option.label}
													onClick={() => setActiveSection(option.label)}
													className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm ${
														activeSection === option.label
															? "bg-secondary/50"
															: "hover:bg-secondary/50"
													}`}
												>
													<option.icon className="h-4 w-4" />
													<div className="flex flex-col items-start">
														<span>{option.label}</span>
														{option.description && (
															<span
																className={`text-xs ${
																	activeSection === option.label
																		? "text-accent-foreground"
																		: "text-muted-foreground"
																}`}
															>
																{option.description}
															</span>
														)}
													</div>
												</button>
											))}
										</div>
									</div>
								</div>
								<div className="flex-1 text-white">
									<DialogHeader className="p-6">
										<DialogTitle>{activeSection}</DialogTitle>
									</DialogHeader>
									{
										settingsOptions.find(
											(option) => option.label === activeSection
										)?.components
									}
								</div>
							</DialogContent>
						</Dialog>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
