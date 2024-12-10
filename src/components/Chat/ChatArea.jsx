import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { scrollToBottom } from "@/utils/scrollToBottom";
import { getToken } from "@/services/token.service";

export function ChatArea({ messagesHistory, username }) {
  const scrollBotton = useRef();

  useEffect(() => {
    if (scrollBotton.current) {
      scrollToBottom(scrollBotton.current, true);
    }
  }, [messagesHistory]);

  // Function to handle file link click
  const handleFileClick = async (url) => {
    try {
      console.log(`Fetching file from: ${url}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`, // Replace with your token retrieval logic
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch file details");
      }
      const fileBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = url.split("/").pop(); // Extract the file name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error fetching file:", error.message);
    }
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4" ref={scrollBotton}>
        {messagesHistory?.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === username ? "justify-end gap-2" : "justify-start"
            }`}
          >
            <div
              className={`${
                msg.sender === username
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              } rounded-2xl px-4 py-2 max-w-[80%]`}
            >
              {msg.type === "file" ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFileClick(msg.downloadUrl);
                  }}
                  style={{
                    color: "white",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {msg.fileName || "Download File"}
                </a>
              ) : (
                <p>{msg.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
