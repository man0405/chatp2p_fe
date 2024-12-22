import React, { useState, useEffect } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import axiosClient from "@/lib/axios/axiosClient";
import { getToken } from "@/services/token.service";

export default function Friend({
  userSelected,
  setUserSelected,
  setSelectedSidebarItem,
}) {
  const [contacts, setContacts] = useState([]);
  const [groupedContacts, setGroupedContacts] = useState({});

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axiosClient.get("/friends/get-friend", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        console.log(response);
        setContacts(response);

        // Group contacts alphabetically
        const grouped = response.reduce((acc, contact) => {
          const firstLetter = contact.fullName[0].toUpperCase();
          if (!acc[firstLetter]) {
            acc[firstLetter] = [];
          }
          acc[firstLetter].push(contact);
          return acc;
        }, {});

        setGroupedContacts(grouped);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };
    fetchContacts();
  }, []);

  return (
    <>
      <div className="bg-zinc-900 border-r border-zinc-800 h-screen overflow-hidden flex flex-col">
        <div className="p-4 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-white">Friend List</h1>
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
                    onClick={() => {
                      setUserSelected(contact);
                      setSelectedSidebarItem(0);
                    }}
                  >
                    <Avatar className="min-h-14 min-w-14">
                      <AvatarImage
                        src={`https://placehold.jp/75/3d4070/ffffff/150x150.png?text=${
                          contact.fullName?.toString()[0]
                        }`}
                      />
                      <AvatarFallback>{contact.name}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200">
                          {contact.fullName}
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

      <div className="flex-1 flex items-center justify-center bg-zinc-900 text-zinc-400">
        Select a conversation to start chatting
      </div>
    </>
  );
}
