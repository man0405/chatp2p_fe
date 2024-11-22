import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActiveUser({
	activeUsers,
	setUserSelected,
	startChat,
}) {
	return (
		<div className="p-4 border-zinc-800">
			<div className="flex gap-2 overflow-x-auto">
				{/* Online contacts */}
				{activeUsers?.map((data, index) => (
					<div
						key={index}
						className="flex flex-col items-center gap-1 min-w-[64px]"
						onClick={() => {
							setUserSelected(data);
							startChat(data.email);
						}}
					>
						<div className="relative">
							<Avatar className="h-14 w-14 border border-gray-800">
								<AvatarImage
									className="pointer-events-none"
									src={`https://placehold.jp/75/3d4070/ffffff/150x150.png?text=${data.fullName?.[0]}`}
								/>
								<AvatarFallback>UN</AvatarFallback>
							</Avatar>
							<div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
						</div>
						<span className="text-xs text-gray-400 truncate w-full text-center">
							{data.fullName}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
