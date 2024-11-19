import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

export default function AddFriendModal({ isOpen, setIsOpen }) {
  const [phone, setPhone] = useState(""); // State to store phone input

  const friendSuggestions = [{ name: "Thinh", phone: "(+84) 0384 920 904" }];

  // Function to close the modal
  const handleClose = () => {
    setIsOpen(false); // Set the modal's visibility state to false
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-lg p-6">
        <DialogTitle>Thêm bạn</DialogTitle>

        {/* Input for phone number */}
        <div className="flex items-center gap-2 mt-4">
          <Input
            type="text"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {/* <div className="border px-2 py-1 rounded bg-gray-100"> */}
          <Button
            variant="secondary"
            className=""
            onClick={handleClose} // Close the modal
          >
            <Search />
          </Button>
          {/* </div> */}
        </div>

        {/* Friend suggestions */}
        <div className="mt-6">
          {/* <h3 className="font-semibold text-lg mb-2">Kết quả gần nhất</h3> */}
          {friendSuggestions.map((friend, index) => (
            <div key={index} className="flex items-center gap-3 py-2 border-b">
              <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
              <div>
                <p className="font-semibold">{friend.name}</p>
                <p className="text-gray-600 text-sm">{friend.phone}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end mt-6">
          <Button
            variant="secondary"
            className="mr-2"
            onClick={handleClose} // Close the modal
          >
            Hủy
          </Button>
          <Button variant="primary">Tìm kiếm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
