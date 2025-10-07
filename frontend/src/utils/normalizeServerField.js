const toCamel = (s) =>
	s.replace(/[_-][a-z]/g, (m) => m.charAt(1).toUpperCase());

export function normalizeServerField(field) {
	if (!field || typeof field !== "string") return field;
	return field
		.split(".")
		.map((seg) => {
			if (/^\d+$/.test(seg)) return seg;
			return seg.replace(/[a-z0-9_-]+/gi, (match) => toCamel(match));
		})
		.join(".");
}
