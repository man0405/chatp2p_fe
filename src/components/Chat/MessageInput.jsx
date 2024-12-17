import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Camera, Smile, Send, ThumbsUp } from "lucide-react";

export function MessageInput({ sendMessage, sendFile, sendImage }) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null); // Reference for the image input

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, "text");
      setMessage("");
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleImageClick = () => {
    imageInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      console.log("Selected file:", file); // Debug: Log the selected file
      sendFile(file); // Send the file using the sendFile function
    } else {
      console.error("No file selected."); // Debug: Log if no file is selected
    }
  };

  const handleImageChange = (e) => {
    const image = e.target.files[0]; // Get the selected image
    if (image) {
      console.log("Selected image:", image); // Debug: Log the selected image
      sendImage(image); // Send the image using the sendImage function
    } else {
      console.error("No image selected."); // Debug: Log if no image is selected
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        {/* File Upload Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={handleFileClick}
        >
          <Plus className="w-5 h-5" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }} // Hide the file input
        />

        {/* Image Upload Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={handleImageClick}
        >
          <Camera className="w-5 h-5" />
        </Button>
        <input
          type="file"
          accept="image/*" // Accept only image files
          ref={imageInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }} // Hide the image input
        />

        {/* Message Input */}
        <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="border-0 bg-transparent focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-400"
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <Smile className="w-5 h-5" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={handleSend}
        >
          {message ? (
            <Send className="w-5 h-5" />
          ) : (
            <ThumbsUp className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
