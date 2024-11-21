import { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Call() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (streamRef.current) {
        const tracks = streamRef.current.getVideoTracks();
        tracks.forEach((track) => track.stop());
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isMicOn,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
  };

  const toggleMic = async () => {
    if (isMicOn) {
      if (streamRef.current) {
        const tracks = streamRef.current.getAudioTracks();
        tracks.forEach((track) => track.stop());
      }
      setIsMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: true,
        });
        streamRef.current = stream;
        setIsMicOn(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }
  };

  const hangUp = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOn(false);
    setIsMicOn(false);
    console.log("Call ended");
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Video display area */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        <video
          ref={videoRef}
          className={`w-full max-h-[840px] object-cover ${
            isCameraOn ? "" : "hidden"
          }`}
          autoPlay
          playsInline
          muted={!isMicOn}
        />
        {!isCameraOn && <p className="text-gray-300 absolute">Camera is off</p>}
      </div>

      {/* Fixed control buttons at the bottom */}
      <div className="flex justify-center items-center p-4 bg-gray-800">
        <div className="flex space-x-4">
          <Button
            onClick={toggleCamera}
            variant="outline"
            size="icon"
            className={`rounded-full ${
              isCameraOn
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {isCameraOn ? (
              <Camera className="h-6 w-6" />
            ) : (
              <CameraOff className="h-6 w-6" />
            )}
            <span className="sr-only">
              {isCameraOn ? "Turn off camera" : "Turn on camera"}
            </span>
          </Button>

          <Button
            onClick={toggleMic}
            variant="outline"
            size="icon"
            className={`rounded-full ${
              isMicOn ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            {isMicOn ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
            <span className="sr-only">
              {isMicOn ? "Turn off microphone" : "Turn on microphone"}
            </span>
          </Button>

          <Button
            onClick={hangUp}
            variant="outline"
            size="icon"
            className="rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
            <span className="sr-only">Hang up</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
