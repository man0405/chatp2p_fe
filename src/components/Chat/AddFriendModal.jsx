import React, { useState } from "react";
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
  const jwtToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2YW5tYW4xNjA1MDRAZ21haWwuY29tIiwiaWF0IjoxNzMyMDg4MDU2LCJleHAiOjE3MzIwOTE2NTZ9.DJTfcUXHpe_8bYT4py5nTcyZ3FB1-wkv5DhvGBrzwN4"; // Replace this with your actual JWT token or fetch it dynamically

  // Function to fetch friend data
  const fetchFriendSuggestions = async () => {
    setUndefined(false); // Reset isUndefined state
    try {
      const response = await axiosClient.get(`/friends/find?gmail=${gmail}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`, // Add JWT token to Authorization header
        },
      });
      // Map the returned JSON into the format required for friendSuggestions
      console.log(response);
      const friendData = {
        name: `${response.firstname} ${response.lastname}`,
        phone: response.email,
        status: response.status,
      };
      setFriendSuggestions([friendData]); // Update state with the fetched data
    } catch (error) {
      console.error("Failed to fetch friend suggestions:", error);
      setFriendSuggestions([]); // Reset friendSuggestions state
      setUndefined(true); // Set isUndefined to true
    }
  };

  const sendFriendRequest = async () => {
    try {
      const response = await axiosClient.post(
        `/friends/add?gmail=${gmail}`, // API endpoint
        null, // Request body (JSON object)
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Pass the JWT token in the header
            "Content-Type": "application/json", // Ensure JSON is specified as Content-Type
          },
        }
      );
      if (response.status === 200) {
        setStatus("Pending s");
      }
      console.log("Friend request sent successfully:", response);
      return response; // Return the response for further handling
    } catch (error) {
      console.error(
        "Failed to send friend request:",
        error.response?.data || error.message
      );
      throw error; // Re-throw the error for error handling in the calling function
    }
  };

  const acceptFriendRequest = async () => {
    try {
      const response = await axiosClient.post(
        `/friends/accept?gmail=${gmail}`, // API endpoint
        null, // Request body (JSON object)
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Pass the JWT token in the header
            "Content-Type": "application/json", // Ensure JSON is specified as Content-Type
          },
        }
      );
      console.log("Friend request accepted successfully:", response);
      return response; // Return the response for further handling
    } catch (error) {
      console.error(
        "Failed to accept friend request:",
        error.response?.data || error.message
      );
      throw error; // Re-throw the error for error handling in the calling function
    }
  };

  const renderFriendAction = (status) => {
    setStatus(status);
    if (this.status === "Pending s") {
      return (
        <Button variant="warning" disabled>
          Sent request
        </Button>
      );
    } else if (this.status === "Pending r") {
      return (
        <Button variant="secondary" onClick={acceptFriendRequest}>
          Accept
        </Button>
      );
    } else if (this.status === "Already") {
      return (
        <Button variant="secondary" disabled>
          Friends
        </Button>
      );
    } else {
      return (
        <Button variant="primary" onClick={sendFriendRequest}>
          Add
        </Button>
      );
    }
  };

  // Function to close the modal
  const handleClose = () => {
    setIsOpen(false); // Close the modal
  };

  function inputHandler(e) {
    setGmail(e.target.value);
    if (e.target.value == "") setTriggered(false);
    else setTriggered(true);
  }

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
            onChange={inputHandler} // Update Gmail state
          />
        </div>

        {/* Friend Suggestions */}
        <div>
          {friendSuggestions.length > 0
            ? friendSuggestions.map((friend, index) => (
                <div className="flex justify-between items-center border-b">
                  <div key={index} className="flex items-center gap-3 py-2 ">
                    <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
                    <div>
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-gray-600 text-sm">{friend.phone}</p>
                    </div>
                  </div>
                  {renderFriendAction}
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
            onClick={fetchFriendSuggestions} // Trigger fetch on button click
          >
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
