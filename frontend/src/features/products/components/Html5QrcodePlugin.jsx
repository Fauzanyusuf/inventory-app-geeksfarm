import { useEffect, useRef } from "react";
const Html5QrcodePlugin = ({
	fps = 10,
	qrbox = 250,
	aspectRatio = 1.0,
	disableFlip = false,
	formatsToSupport,
	supportedScanTypes,
	rememberLastUsedCamera = true,
	showTorchButtonIfSupported = false,
	showZoomSliderIfSupported = false,
	defaultZoomValueIfSupported = 1,
	experimentalFeatures,
	qrCodeSuccessCallback,
	qrCodeErrorCallback,
	onError,
}) => {
	const qrCodeRef = useRef(/** @type {HTMLDivElement | null} */ (null));
	const html5QrCodeRef = useRef(/** @type {Html5Qrcode | null} */ (null));
	const idRef = useRef(
		`html5qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	);
	const scannerId = idRef.current;

	useEffect(() => {
		if (!qrCodeRef.current) return;

		const timer = setTimeout(() => {
			if (!qrCodeRef.current) return;

			(async () => {
				try {
					const mod = await import("html5-qrcode");
					const { Html5Qrcode, Html5QrcodeScanType } = mod;

					const config = {
						fps,
						qrbox,
						aspectRatio,
						disableFlip,
						formatsToSupport,

						supportedScanTypes: Array.isArray(supportedScanTypes)
							? supportedScanTypes.map((s) =>
									typeof s === "string" ? Html5QrcodeScanType[s] || s : s
							  )
							: supportedScanTypes,
						rememberLastUsedCamera: rememberLastUsedCamera !== false,
						showTorchButtonIfSupported,
						showZoomSliderIfSupported,
						defaultZoomValueIfSupported,
						experimentalFeatures,
					};

					html5QrCodeRef.current = new Html5Qrcode(qrCodeRef.current.id);

					if (html5QrCodeRef.current) {
						html5QrCodeRef.current
							.start(
								{ facingMode: "environment" },
								config,
								qrCodeSuccessCallback,
								qrCodeErrorCallback
							)
							.catch((err) => {
								console.error("Error starting QR code scanner:", err);
								if (onError) onError(err);
							});
					}
				} catch (e) {
					console.error("Failed to load html5-qrcode module:", e);
					if (onError) onError(e);
				}
			})();
		}, 100);
		return () => {
			clearTimeout(timer);
			if (html5QrCodeRef.current) {
				try {
					// Check if scanner is running before trying to stop it
					const state = html5QrCodeRef.current.getState();
					if (state === 2) {
						// Scanner is running, stop it
						html5QrCodeRef.current
							.stop()
							.then(() => {
								if (html5QrCodeRef.current) {
									html5QrCodeRef.current.clear();
								}
							})
							.catch((err) => {
								// Only log error if it's not the "scanner not running" error
								if (!err.message?.includes("scanner is not running")) {
									console.error("Error stopping QR code scanner:", err);
								}
							});
					} else {
						// Scanner is not running, just clear
						if (html5QrCodeRef.current) {
							html5QrCodeRef.current.clear();
						}
					}
				} catch (err) {
					// If getState() fails, try to stop and clear anyway
					console.warn("Error getting scanner state:", err);
					if (html5QrCodeRef.current) {
						html5QrCodeRef.current
							.stop()
							.catch(() => {
								// Ignore stop errors
							})
							.finally(() => {
								if (html5QrCodeRef.current) {
									html5QrCodeRef.current.clear();
								}
							});
					}
				}
			}
		};
	}, [
		fps,
		qrbox,
		aspectRatio,
		disableFlip,
		formatsToSupport,
		supportedScanTypes,
		rememberLastUsedCamera,
		showTorchButtonIfSupported,
		showZoomSliderIfSupported,
		defaultZoomValueIfSupported,
		experimentalFeatures,
		qrCodeSuccessCallback,
		qrCodeErrorCallback,
		onError,
	]);

	return (
		<div
			ref={qrCodeRef}
			id={scannerId}
			className="w-full h-64 bg-gray-100 rounded-lg"
			style={{ minHeight: "250px" }}
		/>
	);
};

export default Html5QrcodePlugin;
