import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ImageUpload = ({
	value,
	onChange,
	accept = "image/*",
	multiple = false,
	maxFiles = 1,
	className = "",
	disabled = false,
	placeholder = "Choose files...",
}) => {
	const [dragActive, setDragActive] = useState(false);

	const handleFiles = (files) => {
		const fileList = Array.from(files);

		if (fileList.length > maxFiles) {
			console.warn(`Maximum ${maxFiles} files allowed`);
			return;
		}

		if (multiple) {
			onChange(fileList);
		} else {
			onChange(fileList[0] || null);
		}
	};

	const handleChange = (e) => {
		const files = e.target.files;
		if (files) {
			handleFiles(files);
		}
	};

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFiles(e.dataTransfer.files);
		}
	};

	const getFilePreview = (file) => {
		if (file instanceof File) {
			return URL.createObjectURL(file);
		}
		return null;
	};

	const getFileList = () => {
		if (!value) return [];
		return Array.isArray(value) ? value : [value];
	};

	const removeFile = (index) => {
		if (multiple && Array.isArray(value)) {
			const newFiles = value.filter((_, i) => i !== index);
			onChange(newFiles);
		} else {
			onChange(null);
		}
	};

	return (
		<div className={cn("space-y-4", className)}>
			<div
				className={cn(
					"relative border-2 border-dashed rounded-lg p-6 transition-colors",
					dragActive ? "border-primary bg-primary/5" : "border-border",
					disabled && "opacity-50 cursor-not-allowed"
				)}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}>
				<Input
					type="file"
					accept={accept}
					multiple={multiple}
					onChange={handleChange}
					disabled={disabled}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
				/>

				<div className="text-center">
					<div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
						<svg
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							className="h-full w-full">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<p className="text-sm text-muted-foreground">{placeholder}</p>
					<p className="text-xs text-muted-foreground mt-1">
						{multiple ? `Up to ${maxFiles} files` : "Single file"}
					</p>
				</div>
			</div>

			{/* File Previews */}
			{getFileList().length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Selected Files:</h4>
					<div className="space-y-2">
						{getFileList().map((file, index) => (
							<div
								key={index}
								className="flex items-center gap-3 p-3 border rounded-lg">
								{file.type.startsWith("image/") && (
									<img
										src={getFilePreview(file)}
										alt={file.name}
										className="h-12 w-12 object-cover rounded"
									/>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{file.name}</p>
									<p className="text-xs text-muted-foreground">
										{(file.size / 1024 / 1024).toFixed(2)} MB
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => removeFile(index)}
									disabled={disabled}>
									Remove
								</Button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default ImageUpload;
