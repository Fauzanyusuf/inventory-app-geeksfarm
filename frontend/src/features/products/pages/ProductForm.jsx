import { useParams, useNavigate } from "react-router";
import ProductEditor from "@/features/products/components/ProductEditor";

const ProductForm = () => {
	const { id } = useParams();
	const isEdit = Boolean(id);
	const navigate = useNavigate();

	const handleSuccess = () => {
		if (isEdit) navigate(`/products/${id}`);
		else navigate("/dashboard");
	};

	return (
		<div className="form-container">
			<ProductEditor
				mode={isEdit ? "edit" : "create"}
				productId={id}
				onSuccess={handleSuccess}
			/>
		</div>
	);
};

export default ProductForm;
