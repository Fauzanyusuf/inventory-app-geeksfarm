import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import BarcodeScanner from "@/features/products/components/BarcodeScanner";

const ScanPage = () => {
	const [showScanner, setShowScanner] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		// Auto-open scanner when page loads
		setShowScanner(true);
	}, []);

	const handleScanSuccess = (code) => {
		// Trace the scanned code for debugging
		console.debug("[ScanPage] scanned code:", code);
		// Navigate back to dashboard with search term and origin flag
		navigate(`/dashboard?search=${encodeURIComponent(code)}&from=scan`);
	};

	const handleCloseScanner = () => {
		setShowScanner(false);
		navigate("/dashboard");
	};

	const handleManualSearch = () => {
		const code = prompt("Enter barcode manually:");
		if (code && code.trim()) {
			console.debug("[ScanPage] manual code entered:", code.trim());
			handleScanSuccess(code.trim());
		}
	};

	return (
		<div className="space-y-6">
			{/* Main Content */}
			<div className="max-w-4xl mx-auto">
				<div className="bg-card shadow overflow-hidden sm:rounded-lg border border-border">
					<div className="px-4 py-5 sm:px-6">
						<h3 className="text-lg leading-6 font-medium text-card-foreground">
							Scan Product Barcode
						</h3>
						<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
							Position the barcode within the camera frame to scan products
							automatically.
						</p>
					</div>

					<div className="border-t border-border px-4 py-5 sm:px-6">
						<div className="text-center">
							<div className="space-x-2">
								<Button variant="outline" onClick={handleManualSearch}>
									Manual Input
								</Button>
								<Button onClick={() => setShowScanner(true)}>
									<svg
										className="h-6 w-6 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 21h.01M12 4h.01M12 21h.01M21 12h-1m-11 0H3m6 0v2m0-11v3m0 0h.01M12 21h.01M12 4h.01M12 21h.01M21 12h-1m-11 0H3m6 0v2"
										/>
									</svg>
									Open Camera Scanner
								</Button>
							</div>

							<p className="mt-4 text-sm text-muted-foreground">
								Or use the Manual Input button above to enter barcodes manually
							</p>
						</div>

						{/* Instructions */}
						<div className="mt-8 bg-popover border border-border rounded-md p-4">
							<h4 className="text-sm font-medium text-card-foreground mb-2">
								Scanning Tips:
							</h4>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>
									- Ensure your camera has permission to access the device
								</li>
								<li>
									- Hold the barcode steady and centered in the scanning area
								</li>
								<li>- Good lighting improves scanning accuracy</li>
								<li>- Try different distances and angles if scanning fails</li>
								<li>- Clean barcodes work better than damaged or dirty ones</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* Barcode Scanner Modal */}
			{showScanner && (
				<BarcodeScanner
					onScanSuccess={handleScanSuccess}
					onClose={handleCloseScanner}
				/>
			)}
		</div>
	);
};

export default ScanPage;
