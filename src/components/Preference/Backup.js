import React from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button"; // Assuming you have a Button component

export default function Backup() {
	return (
		<div className="space-y-6 p-6 pt-0 text-white ">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label>Export Data</Label>
					<div className="text-sm text-muted-foreground">
						Export your Messenger data to a file
					</div>
				</div>
				<Button className="text-zinc-400 hover:text-white  bg-zinc-900 border ">
					Export
				</Button>
			</div>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label>Import Data</Label>
					<div className="text-sm text-muted-foreground">
						Import your Messenger data from a file
					</div>
				</div>
				<Button className="text-zinc-400 hover:text-white  bg-zinc-900 border">
					Import
				</Button>
			</div>
		</div>
	);
}
