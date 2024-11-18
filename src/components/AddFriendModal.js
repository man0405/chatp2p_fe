import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "@shadcn/ui/input";
import { ScrollArea } from "@shadcn/ui/scroll-area";

export default function AddFriendModal() {
  const [phone, setPhone] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const friendSuggestions = [
    { name: "Hoanggg", phone: "(+84) 0384 920 904" },
    { name: "Dang Diep", phone: "(+84) 0384 902 904" },
    { name: "Thanh Van Le", phone: "(+84) 0905 519 529" },
  ];

  const friendRecommendations = [
    { name: "Thuy My", source: "Từ số điện thoại" },
    { name: "Duong Ngo", source: "Từ gợi ý kết bạn" },
    { name: "Lê Thảo", source: "Từ gợi ý kết bạn" },
  ];

  return (
    <div>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Thêm bạn
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-lg p-6">
          <DialogTitle>Thêm bạn</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="border px-2 py-1 rounded bg-gray-100">(+84)</div>
            <Input
              type="text"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Kết quả gần nhất</h3>
            <ScrollArea className="h-40">
              {friendSuggestions.map((friend, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-2 border-b"
                >
                  <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
                  <div>
                    <p className="font-semibold">{friend.name}</p>
                    <p className="text-gray-600 text-sm">{friend.phone}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Có thể bạn quen</h3>
            <ScrollArea className="h-40">
              {friendRecommendations.map((friend, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-2 border-b"
                >
                  <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-semibold">{friend.name}</p>
                    <p className="text-gray-600 text-sm">{friend.source}</p>
                  </div>
                  <Button size="sm" variant="secondary">
                    Kết bạn
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              variant="secondary"
              className="mr-2"
              onClick={() => setIsOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="primary">Tìm kiếm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
