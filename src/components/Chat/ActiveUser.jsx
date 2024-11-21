import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActiveUser() {
	return (
		<div className="p-4 border-zinc-800">
			<div className="flex gap-2 overflow-x-auto">
				{/* Online contacts */}
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="flex flex-col items-center gap-1 min-w-[64px]"
					>
						<div className="relative">
							<Avatar className="h-14 w-14 border border-gray-800">
								<AvatarImage src={`/placeholder.svg?id=${i}`} />
								<AvatarFallback>UN</AvatarFallback>
							</Avatar>
							<div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
						</div>
						<span className="text-xs text-gray-400 truncate w-full text-center">
							User {i}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
