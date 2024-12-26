import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosClient from "@/lib/axios/axiosClient"; // Import axiosClient

export default function AddFriendModal({ isOpen, setIsOpen }) {
  const [gmail, setGmail] = useState(""); // State to store email input
  const [friendSuggestions, setFriendSuggestions] = useState([]); // State for friend suggestions
  const [isUndefined, setUndefined] = useState(false);
  const [isTriggered, setTriggered] = useState(false);
  const [status, setStatus] = useState("");
  const [friendActionButton, setFriendActionButton] = useState(null); // State for the button
  const jwtToken = localStorage.getItem("token"); // Replace this with your actual JWT token or fetch it dynamically

  useEffect(() => {
    if (status === "Pending s") {
      setFriendActionButton(
        <Button variant="warning" disabled>
          Sent request
        </Button>
      );
    } else if (status === "Pending r") {
      setFriendActionButton(
        <Button variant="secondary" onClick={acceptFriendRequest}>
          Accept
        </Button>
      );
    } else if (status === "Already") {
      setFriendActionButton(
        <Button variant="secondary" disabled>
          Friends
        </Button>
      );
    } else {
      setFriendActionButton(
        <Button variant="primary" onClick={sendFriendRequest}>
          Add
        </Button>
      );
    }
  }, [status]); // Update the button whenever status changes

  // Fetch friend data
  const fetchFriendSuggestions = async () => {
    setUndefined(false);
    try {
      const response = await axiosClient.get(`/friends/find?gmail=${gmail}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      const friendData = {
        name: `${response.firstname} ${response.lastname}`,
        phone: response.email,
        status: response.status,
      };
      setFriendSuggestions([friendData]);
      setStatus(response.status); // Update status for useEffect
    } catch (error) {
      console.error("Failed to fetch friend suggestions:", error);
      setFriendSuggestions([]);
      setUndefined(true);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const response = await axiosClient.post(
        `/friends/add?gmail=${gmail}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        setStatus("Pending s");
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const acceptFriendRequest = async () => {
    try {
      const response = await axiosClient.post(
        `/friends/accept?gmail=${gmail}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        setStatus("Already");
      }
      console.log("Friend request accepted successfully:", response);
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const inputHandler = (e) => {
    setGmail(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-lg p-6">
        <DialogTitle>Find friends</DialogTitle>

        {/* Input for Gmail */}
        <div className="flex items-center gap-2 mt-4">
          <Input
            type="text"
            placeholder="Enter email"
            value={gmail}
            onChange={inputHandler}
          />
        </div>

        {/* Friend Suggestions */}
        <div>
          {friendSuggestions.length > 0
            ? friendSuggestions.map((friend, index) => (
                <div
                  className="flex justify-between items-center border-b"
                  key={index}
                >
                  <div className="flex items-center gap-3 py-2">
                    <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
                    <div>
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-gray-600 text-sm">{friend.phone}</p>
                    </div>
                  </div>
                  {friendActionButton}
                </div>
              ))
            : isTriggered &&
              isUndefined && (
                <p className="text-gray-500 text-sm">No results</p>
              )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6">
          <Button variant="secondary" className="mr-2" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTriggered(true);
              fetchFriendSuggestions();
            }}
          >
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
