import axiosClient from "@/lib/axios/axiosClient";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getToken } from "@/services/token.service";

export default function ImagePreview({ downloadUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch image when the component mounts
    fetchImage();

    // Cleanup to revoke the object URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []); // Empty dependency array ensures this runs once after mounting

  const fetchImage = async () => {
    if (imageUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get(downloadUrl, {
        headers: { Authorization: `Bearer ${getToken()}` },
        responseType: "blob",
      });

      const blob = response;
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      console.error("Error fetching image:", err);
      setError("Failed to load the image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = downloadUrl.split("/").pop() || "downloaded_image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            className="w-full h-48 focus:outline-none bg-gray-200 flex items-center justify-center"
            onClick={() => setIsOpen(true)}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : isLoading ? (
              <span className="text-gray-500">Loading image...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              <span className="text-gray-500">Click to load image</span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading image...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">
                {error}
              </div>
            ) : imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
                <Button
                  variant="secondary"
                  className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </>
            ) : null}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close preview</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
