import React from "react";
import {
	Pagination as PaginationRoot,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const Pagination = ({
	currentPage = 1,
	totalPages = 1,
	totalItems = 0,
	pageSize = 10,
	onPageChange,
	onPageSizeChange,
	className = "",
	showPageSizeSelector = true,
	pageSizeOptions = [10, 20, 50, 100],
}) => {
	const handlePageChange = (page) => {
		if (onPageChange && page >= 1 && page <= totalPages) {
			onPageChange(page);
		}
	};

	const handlePageSizeChange = (newPageSize) => {
		if (onPageSizeChange) {
			onPageSizeChange(parseInt(newPageSize));
		}
	};

	// Generate page numbers to display
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			// Show all pages if total pages is small
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			let startPage, endPage;

			if (currentPage <= 3) {
				startPage = 1;
				endPage = Math.min(5, totalPages);
			} else if (currentPage >= totalPages - 2) {
				startPage = Math.max(1, totalPages - 4);
				endPage = totalPages;
			} else {
				startPage = currentPage - 2;
				endPage = currentPage + 2;
			}

			if (startPage > 1) {
				pages.push(1);
				if (startPage > 2) {
					pages.push("ellipsis-start");
				}
			}

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}

			if (endPage < totalPages) {
				if (endPage < totalPages - 1) {
					pages.push("ellipsis-end");
				}
				pages.push(totalPages);
			}
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<div
			className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
			{/* Page size selector */}
			{showPageSizeSelector && onPageSizeChange && (
				<div className="flex items-center gap-2 flex-shrink-0 order-1 sm:order-1 md:order-2">
					<span className="text-sm text-muted-foreground">Show:</span>
					<Select
						value={pageSize.toString()}
						onValueChange={handlePageSizeChange}>
						<SelectTrigger className="w-20">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={size.toString()}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="text-sm text-muted-foreground">per page</span>
				</div>
			)}

			{/* Pagination info */}
			<div className="text-sm text-muted-foreground flex-shrink-0 order-2 sm:order-2">
				Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{" "}
				{Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
			</div>

			{/* Pagination controls */}
			<div className="flex-shrink-0 min-w-0 overflow-x-auto order-3 sm:order-3 w-full sm:w-auto">
				<PaginationRoot>
					<PaginationContent>
						{/* Previous button */}
						<PaginationItem>
							<PaginationPrevious
								onClick={() => handlePageChange(currentPage - 1)}
								className={
									currentPage <= 1
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>

						{/* Page numbers */}
						{pageNumbers.map((page, index) => (
							<PaginationItem key={`page-${page}-${index}`}>
								{page === "ellipsis-start" || page === "ellipsis-end" ? (
									<PaginationEllipsis />
								) : (
									<PaginationLink
										onClick={() => handlePageChange(page)}
										isActive={page === currentPage}
										className="cursor-pointer">
										{page}
									</PaginationLink>
								)}
							</PaginationItem>
						))}

						{/* Next button */}
						<PaginationItem>
							<PaginationNext
								onClick={() => handlePageChange(currentPage + 1)}
								className={
									currentPage >= totalPages
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</PaginationRoot>
			</div>
		</div>
	);
};

export default Pagination;
