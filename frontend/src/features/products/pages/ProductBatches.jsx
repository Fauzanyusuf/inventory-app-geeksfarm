import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";

import { productsApi } from "@/services/api";
import { formatDate } from "@/utils/format";

const ProductBatches = () => {
	const { id } = useParams();
	const [batches, setBatches] = useState([]);
	const [meta, setMeta] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 1,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchBatches = useCallback(
		async (page = 1, limit = 10) => {
			try {
				setLoading(true);
				setError(null);
				const res = await productsApi.getProductBatches(id, { page, limit });
				// res is normalized: { data, meta }
				setBatches(res.data || []);
				setMeta(
					res.meta || {
						page,
						limit,
						total: (res.data || []).length,
						totalPages: 1,
					}
				);
			} catch (err) {
				console.error("Failed to load batches", err);
				setError(err.message || "Failed to load batches");
			} finally {
				setLoading(false);
			}
		},
		[id]
	);

	useEffect(() => {
		fetchBatches(meta.page, meta.limit);
	}, [fetchBatches, meta.page, meta.limit]);

	if (loading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div>Loading batches...</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto">
				<div className="bg-white shadow rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-4">Product Batches</h2>
					{error && <div className="text-red-600 mb-4">{error}</div>}
					<div className="mb-4 text-sm text-gray-600">
						Showing page {meta.page} of {meta.totalPages} — {meta.total} total
					</div>
					{batches.length === 0 ? (
						<div className="text-gray-500">No batches found</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Batch ID
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Quantity
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Cost
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Received
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Expired
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{batches.map((b) => (
										<tr key={b.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
												{b.id.slice(-8)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{b.quantity}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{b.costPrice}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{b.status}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{formatDate(b.receivedAt)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{b.expiredAt ? formatDate(b.expiredAt) : "N/A"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					<div className="mt-4 flex items-center gap-2">
						<button
							className="px-3 py-1 bg-gray-200 rounded"
							onClick={() => {
								const p = Math.max(1, (meta.page || 1) - 1);
								fetchBatches(p, meta.limit);
								setMeta((m) => ({ ...m, page: p }));
							}}
							disabled={meta.page <= 1}>
							Prev
						</button>
						<button
							className="px-3 py-1 bg-gray-200 rounded"
							onClick={() => {
								const p = Math.min(meta.totalPages || 1, (meta.page || 1) + 1);
								fetchBatches(p, meta.limit);
								setMeta((m) => ({ ...m, page: p }));
							}}
							disabled={meta.page >= (meta.totalPages || 1)}>
							Next
						</button>
						<select
							value={meta.limit}
							onChange={(e) => {
								const lim = Number(e.target.value) || 10;
								setMeta((m) => ({ ...m, limit: lim, page: 1 }));
								fetchBatches(1, lim);
							}}
							className="ml-auto border rounded px-2 py-1">
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={25}>25</option>
						</select>
					</div>
				</div>
			</main>
		</div>
	);
};

export default ProductBatches;
