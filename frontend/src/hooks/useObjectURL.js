import { useEffect, useRef, useCallback } from "react";

export default function useObjectURL() {
	const urlsRef = useRef(new Set());

	const create = useCallback((file) => {
		if (!(file instanceof File)) {
			return null;
		}

		const url = URL.createObjectURL(file);
		urlsRef.current.add(url);
		return url;
	}, []);

	const revoke = useCallback((url) => {
		if (typeof url !== "string") {
			return;
		}

		URL.revokeObjectURL(url);
		urlsRef.current.delete(url);
	}, []);

	const mapFilesToPreviews = useCallback(
		(files) => {
			if (!Array.isArray(files) || files.length === 0) {
				return [];
			}

			return files.map((file) => ({
				name: file.name,
				file,
				url: create(file),
			}));
		},
		[create]
	);

	const cleanup = useCallback(() => {
		urlsRef.current.forEach((url) => {
			URL.revokeObjectURL(url);
		});
		urlsRef.current.clear();
	}, []);

	useEffect(() => {
		return () => cleanup();
	}, [cleanup]);

	return {
		create,
		revoke,
		mapFilesToPreviews,
		cleanup,
	};
}
