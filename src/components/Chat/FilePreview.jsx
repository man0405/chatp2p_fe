import { FileIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FilePreview({ fileName, onDownload = () => {} }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg max-w-md">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileIcon className="h-6 w-6 flex-shrink-0 text-gray-600" />
        <div className="min-w-0 flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-base font-medium text-gray-900 truncate">
                  {fileName}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fileName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDownload}
        className="flex-shrink-0 text-gray-600 hover:text-gray-900"
      >
        <Download className="h-5 w-5" />
        <span className="sr-only">Download file</span>
      </Button>
    </div>
  );
}
