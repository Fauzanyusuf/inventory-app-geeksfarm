import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { getErrorFromRHF } from "@/utils/formUtils";
import { Label } from "@/components/ui/label";

const FormField = forwardRef(
	(
		{
			name,
			label,
			type = "text",
			as = "input",
			children,
			errors = null,
			className = "",
			required = false,
			description,
			placeholder,
			disabled = false,
			...props
		},
		ref
	) => {
		const errMsg = getErrorFromRHF(errors, name);

		// Use consistent form styling
		const baseClasses = as === "textarea" ? "form-textarea" : "form-input";

		const errorClasses = errMsg ? "form-input-error" : "";

		const sharedProps = {
			name,
			className: cn(baseClasses, errorClasses, className),
			ref,
			placeholder,
			disabled,
			...props,
		};

		const Element =
			as === "textarea" ? "textarea" : as === "select" ? "select" : "input";
		const elementProps = as === "input" ? { type } : {};

		return (
			<div className="form-field">
				{label && (
					<Label
						htmlFor={name}
						className={cn(
							required ? "form-label-required" : "form-label",
							errMsg && "text-destructive"
						)}>
						{label}
					</Label>
				)}

				{description && <p className="form-description">{description}</p>}

				<Element {...sharedProps} {...elementProps}>
					{children}
				</Element>

				{errMsg && <p className="form-error">{errMsg}</p>}
			</div>
		);
	}
);

FormField.displayName = "FormField";

export { FormField };
