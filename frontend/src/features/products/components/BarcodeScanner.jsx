import { useState, Suspense, lazy, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Lazy-load heavy scanner and result components to avoid large initial bundle
const Html5QrcodePlugin = lazy(() =>
	import("@/features/products/components/Html5QrcodePlugin.jsx")
);
const ResultContainerPlugin = lazy(() =>
	import("@/features/products/components/ResultContainerPlugin.jsx")
);

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
	const [decodedResults, setDecodedResults] = useState([]);
	const [error, setError] = useState(null);
	const timeoutRef = useRef(null);

	const onNewScanResult = (decodedText, decodedResult) => {
		setDecodedResults((prev) => [...prev, decodedResult]);

		// Call the success callback with the decoded text
		onScanSuccess(decodedText);

		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Close modal after showing result for 1 second
		timeoutRef.current = setTimeout(() => {
			onClose();
		}, 1000);
	};

	const onScannerError = (err) => {
		console.error("Scanner error:", err);
		setError("Failed to initialize camera. Please check camera permissions.");
	};

	const handleClose = () => {
		// Clear timeout when manually closing
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		onClose();
	};

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
			<div className="bg-card rounded-lg shadow-2xl border-2 border-border max-w-sm w-full mx-4 transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h3 className="text-lg font-semibold text-card-foreground">
						Scan Barcode
					</h3>
					<Button
						onClick={handleClose}
						variant="ghost"
						size="sm"
						className="text-muted-foreground hover:text-card-foreground hover:bg-accent rounded-full p-1">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				</div>

				{/* Content */}
				<div className="p-4">
					{/* Error Message */}
					{error && (
						<div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive-foreground rounded-md">
							<div className="flex items-center">
								<svg
									className="w-5 h-5 text-destructive mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="text-sm">{error}</p>
							</div>
						</div>
					)}

					{/* Instructions */}
					<div className="mb-4 text-center">
						<p className="text-sm text-muted-foreground">
							Position the barcode within the camera view
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Supported: QR Code, Code 128, Code 39, EAN-13, EAN-8, UPC
						</p>
					</div>

					{/* Scanner Container */}
					<div className="relative mb-4">
						<div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-border bg-muted">
							<Suspense
								fallback={
									<div className="p-8 text-center text-sm text-muted-foreground">
										Loading scanner...
									</div>
								}>
								<Html5QrcodePlugin
									fps={10}
									qrbox={200}
									aspectRatio={1.0}
									disableFlip={false}
									formatsToSupport={[
										"qr_code",
										"code_128",
										"code_39",
										"code_93",
										"codabar",
										"ean_13",
										"ean_8",
										"itf",
										"upc_a",
										"upc_e",
									]}
									rememberLastUsedCamera={true}
									showTorchButtonIfSupported={false}
									showZoomSliderIfSupported={false}
									defaultZoomValueIfSupported={1}
									experimentalFeatures={{
										useBarCodeDetectorIfSupported: true,
									}}
									qrCodeSuccessCallback={onNewScanResult}
									onError={onScannerError}
								/>
							</Suspense>
						</div>

						{/* Scanner overlay hint - positioned relative to scanner container */}
						<div className="absolute inset-0 pointer-events-none">
							<div className="relative w-full h-full">
								{/* Corner brackets */}
								<div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary rounded-tl-md"></div>
								<div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary rounded-tr-md"></div>
								<div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary rounded-bl-md"></div>
								<div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary rounded-br-md"></div>

								{/* Center targeting crosshair */}
								<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
									<div className="w-24 h-0.5 bg-primary opacity-60"></div>
									<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-24 bg-primary opacity-60"></div>
								</div>
							</div>
						</div>
					</div>

					{/* Scan Result */}
					{decodedResults.length > 0 && (
						<div className="mb-4 p-3 bg-primary/10 border border-primary text-primary-foreground rounded-md">
							<div className="flex items-center">
								<svg
									className="w-5 h-5 text-primary mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<div>
									<p className="text-sm font-medium">Barcode Detected!</p>
									<p className="text-xs text-primary mt-1 font-mono">
										{decodedResults[decodedResults.length - 1].decodedText}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Results Container (lazy) */}
					<Suspense
						fallback={
							<div className="text-sm text-muted-foreground">
								Loading results...
							</div>
						}>
						<ResultContainerPlugin results={decodedResults} />
					</Suspense>
				</div>

				{/* Footer */}
				<div className="flex justify-end space-x-3 p-4 border-t border-border bg-muted rounded-b-lg">
					<Button onClick={handleClose} variant="outline">
						Cancel
					</Button>
				</div>
			</div>
		</div>
	);
};

export default BarcodeScanner;
