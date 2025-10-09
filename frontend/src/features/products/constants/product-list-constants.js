// Constants for ProductList component
export const SORT_OPTIONS = [
	{ value: "name", label: "Name" },
	{ value: "sellingPrice", label: "Price" },
];

export const SORT_ORDER_OPTIONS = [
	{ value: "asc", label: "Ascending" },
	{ value: "desc", label: "Descending" },
];

export const DEFAULT_SORT_BY = "name";
export const DEFAULT_SORT_ORDER = "asc";
export const DEFAULT_CATEGORY_VALUE = "all";
export const NO_CATEGORY_VALUE = "no-category";
export const DEFAULT_PAGE_SIZE = 10;

export const CATEGORY_LIMIT = 100;

export const TABLE_COLUMNS = {
	PRODUCT_NAME: { width: "w-[200px]", label: "Product Name" },
	BARCODE: { width: "w-[150px]", label: "Barcode" },
	CATEGORY: { width: "w-[150px]", label: "Category" },
	PRICE: { width: "w-[120px]", label: "Price" },
	STOCK: { width: "w-[100px]", label: "Stock", align: "text-right" },
	UNIT: { width: "w-[100px]", label: "Unit" },
	ACTIONS: { width: "w-[150px]", label: "Actions", align: "text-right" },
};

export const ACTION_BUTTONS = {
	VIEW: { icon: "Eye", title: "View Details", variant: "ghost" },
	EDIT: { icon: "Edit", title: "Edit Product", variant: "ghost" },
};

export const FORM_GRID_CLASSES = "grid grid-cols-1 md:grid-cols-6 gap-4";
export const FORM_ERROR_CLASSES =
	"md:col-span-6 mb-2 text-sm text-destructive-foreground";
export const SUBMIT_BUTTON_CLASSES = "md:col-span-6 text-right";

export const CURRENCY_PREFIX = "Rp";
export const DEFAULT_UNIT = "pcs";
export const NO_BARCODE_TEXT = "No Barcode";
export const NO_CATEGORY_TEXT = "No Category";
export const NO_CATEGORIES_TEXT = "No Categories";
export const NO_PRICE_TEXT = "N/A";
