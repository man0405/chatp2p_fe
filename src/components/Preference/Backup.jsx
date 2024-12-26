import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { exportData, importData } from "@/services/indexDB.service";
import { generateAndStoreKeys } from "@/utils/rsa";
import { getToken } from "@/services/token.service";
import axiosClient from "@/lib/axios/axiosClient";
import { toast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

export default function Backup() {
	const [isLoadingExport, setIsLoadingExport] = useState(false);
	const [isLoadingImport, setIsLoadingImport] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const fileInputRef = useRef(null);

	const handleExport = async () => {
		setIsLoadingExport(true);
		try {
			const jsonData = await exportData();
			const blob = new Blob([jsonData], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "backup.json";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error exporting data:", error);
		} finally {
			setIsLoadingExport(false);
		}
	};

	const generateKey = async () => {
		try {
			setIsGenerating(true);
			const keys = await generateAndStoreKeys();
			const publicKey = keys.publicKey;
			const formData = new FormData();
			formData.append("publicKey", publicKey);
			const token = getToken();
			if (!token) {
				console.error("No authorization token found.");
				return;
			}
			console.log("publicKey:", publicKey.toString());

			const response = await axiosClient.put("/friends/publish-key", formData, {
				headers: {
					"Content-Type": "text",
					Authorization: `Bearer ${getToken()}`,
				},
			});

			if (response.success) {
				toast({
					title: "Success",
					description: "Keys generated and published successfully!",
					icon: <CheckCircle className="text-green-500 w-6 h-6" />, // Green tick icon
					status: "success",
				});
			} else {
				toast({
					title: "Error",
					description: "Failed to publish keys.",
					status: "error",
				});
			}
		} catch (error) {
			console.error("Error generating keys:", error);
			toast({
				title: "Error",
				description: "An error occurred while generating keys.",
				status: "error",
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const handleImportClick = () => {
		fileInputRef.current.click();
	};

	const handleFileChange = async (event) => {
		const file = event.target.files[0];
		if (file) {
			setIsLoadingImport(true);
			try {
				const reader = new FileReader();
				reader.onload = async (e) => {
					const jsonData = e.target.result;
					await importData(jsonData);
					alert("Data imported successfully");
					setIsLoadingImport(false);
				};
				reader.readAsText(file);
			} catch (error) {
				console.error("Error importing data:", error);
				setIsLoadingImport(false);
			}
		}
	};

	return (
		<div className="space-y-6 p-6 pt-0 text-white">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label>Export Data</Label>
					<div className="text-sm text-muted-foreground">
						Export your Messenger data to a file
					</div>
				</div>
				<Button
					className="text-zinc-400 hover:text-white bg-zinc-900 border"
					onClick={handleExport}
					disabled={isLoadingExport}
				>
					{isLoadingExport ? (
						<>
							<Loader2 className="animate-spin" />
							<span className="ml-2">Exporting...</span>
						</>
					) : (
						"Export"
					)}
				</Button>
			</div>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label>Import Data</Label>
					<div className="text-sm text-muted-foreground">
						Import your Messenger data from a file
					</div>
				</div>
				<Button
					className="text-zinc-400 hover:text-white bg-zinc-900 border"
					onClick={handleImportClick}
					disabled={isLoadingImport}
				>
					{isLoadingImport ? (
						<>
							<Loader2 className="animate-spin" />
							<span className="ml-2">Importing...</span>
						</>
					) : (
						"Import"
					)}
				</Button>
				<input
					type="file"
					accept="application/json"
					ref={fileInputRef}
					style={{ display: "none" }}
					onChange={handleFileChange}
				/>
			</div>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label>Generate new keys</Label>
					<div className="text-sm text-muted-foreground">
						Generate new public and private keys
					</div>
				</div>
				<Button
					className="text-zinc-400 hover:text-white bg-zinc-900 border"
					onClick={generateKey}
					disabled={isGenerating}
				>
					{isGenerating ? (
						<>
							<Loader2 className="animate-spin" />
							<span className="ml-2">Creating...</span>
						</>
					) : (
						"Create"
					)}
				</Button>
			</div>
		</div>
	);
}
