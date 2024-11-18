import SideBar from "@/components/Layout/SideBar/SideBar";

import { Archive, Grid, MessageCircle } from "lucide-react";
import { useState } from "react";
import ListUser from "@/components/Chat/ListUser";
import { MessageInput } from "@/components/Chat/MessageInput";
import { ChatArea } from "@/components/Chat/ChatArea";
import ChatHeader from "@/components/Chat/ChatHeader";

export default function Component() {
	const [message, setMessage] = useState("");
	const [selectedUser, setSelectedUser] = useState(0);
	const [selectedSidebarItem, setSelectedSidebarItem] = useState(1);
	const [messages, setMessages] = useState([
		{ text: "Hello!", isSent: false },
		{ text: "Hi there!", isSent: true },
	]);

	const users = [
		{
			name: "mit uốt",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Chức NỮ",
			status: "Last seen 5m ago",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Vincom",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "BCS-22GIT2",
			status: "Last seen 1h ago",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Khẩu nghiệp",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "mit uốt",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Chức NỮ",
			status: "Last seen 5m ago",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Vincom",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "BCS-22GIT2",
			status: "Last seen 1h ago",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Khẩu nghiệp",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "mit uốt",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Chức NỮ",
			status: "Last seen 5m ago",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Vincom",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "BCS-22GIT2",
			status: "Last seen 1h ago",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Khẩu nghiệp",
			status: "Active now",
			avatar: "/placeholder.svg?height=40&width=40",
		},
	];

	const sidebarItems = [
		{ icon: Grid, label: "Dashboard" },
		{ icon: MessageCircle, label: "Messages", hasNotification: true },
		{ icon: Archive, label: "Archive" },
	];

	return (
		<div className="flex h-screen dark">
			{/* Icon Sidebar */}
			<SideBar
				selectedSidebarItem={selectedSidebarItem}
				setSelectedSidebarItem={setSelectedSidebarItem}
				sidebarItems={sidebarItems}
			/>

			{/* Main Content */}
			<div className="flex-1 grid" style={{ gridTemplateColumns: "360px 1fr" }}>
				{/* Left Sidebar */}
				<ListUser
					users={users}
					selectedUser={selectedUser}
					setSelectedUser={setSelectedUser}
				/>
				{/* Main Chat Area */}
				<div className="flex flex-col bg-zinc-900 overflow-auto">
					{/* Chat Header */}
					<ChatHeader users={users} selectedUser={selectedUser} />
					{/* Chat Messages */}
					<ChatArea messages={messages} />

					{/* Message Input */}
					<MessageInput message={messages} setMessage={setMessages} />
				</div>
			</div>
		</div>
	);
}
