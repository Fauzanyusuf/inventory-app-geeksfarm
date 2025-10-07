export function formatPrice(price) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
	}).format(price);
}

export function formatDate(dateString, locale = "id-ID", options) {
	if (!dateString) return "-";
	try {
		const d = new Date(dateString);
		return d.toLocaleDateString(
			locale,
			options || { year: "numeric", month: "long", day: "numeric" }
		);
	} catch {
		return dateString;
	}
}
