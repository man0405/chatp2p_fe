import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { scrollToBottom } from "@/utils/scrollToBottom";
import { getToken } from "@/services/token.service";
import axiosClient from "@/lib/axios/axiosClient";

export function ChatArea({ messagesHistory, username }) {
  const scrollBotton = useRef();

  useEffect(() => {
    if (scrollBotton.current) {
      scrollToBottom(scrollBotton.current, true);
    }
  }, [messagesHistory]);

  // Function to handle file link click
  const handleFileClick = async (msg) => {
    try {
      console.log(`Fetching file for: ${msg.fileName}`);
      const response = await axiosClient.get(msg.downloadUrl, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        responseType: "blob", // To handle file data as a blob
      });

      const downloadUrl = URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = msg.fileName || "downloaded_file";
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
              className={`$${
                msg.sender === username
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              } rounded-2xl px-4 py-2 max-w-[80%]`}
            >
              {msg.type === "file" ? (
                <span
                  onClick={() => handleFileClick(msg)}
                  style={{
                    color: "white",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {msg.fileName || "Download File"}
                </span>
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
