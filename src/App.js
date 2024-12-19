import React, { useState, useRef } from "react";

import { Archive, BookUser, MessageCircle } from "lucide-react";

import SideBar from "@/components/Layout/SideBar/SideBar";
import Chat from "./page/Chat";
import Friend from "./page/Friend";

const sidebarItems = [
  {
    icon: MessageCircle,
    label: "Messages",
    hasNotification: true,
    component: <Chat />,
  },
  { icon: BookUser, label: "Friend", component: <Friend /> },
  { icon: Archive, label: "Archive" },
];

export default function App() {
  const [selectedSidebarItem, setSelectedSidebarItem] = useState(0);
  const fullName = useRef(localStorage.getItem("fullName"));
  const [userSelected, setUserSelected] = useState({});
  return (
    <div className="flex h-screen dark">
      <SideBar
        selectedSidebarItem={selectedSidebarItem}
        setSelectedSidebarItem={setSelectedSidebarItem}
        sidebarItems={sidebarItems}
        fullName={fullName.current}
      />
      <div className="flex-1 grid" style={{ gridTemplateColumns: "360px 1fr" }}>
        {/* {sidebarItems[selectedSidebarItem].component} */}
        {selectedSidebarItem === 0 ? (
          <Chat userSelected={userSelected} setUserSelected={setUserSelected} />
        ) : selectedSidebarItem === 1 ? ( // Friend
          <Friend
            userSelected={userSelected}
            setUserSelected={setUserSelected}
            setSelectedSidebarItem={setSelectedSidebarItem}
          />
        ) : (
          sidebarItems[selectedSidebarItem].component
        )}
      </div>
    </div>
  );
}
