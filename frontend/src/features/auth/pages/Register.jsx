import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
// Removed unused Field imports - using FormField instead
import { SelectField } from "@/components/ui/select-field";
import { registerUserSchema } from "@/validation/auth-validation";
import { useFormHandler } from "@/hooks/useFormHandler";
import { toastUtils } from "@/hooks/useToast";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

const Register = () => {
	const { register: registerUser } = useAuth();
	const navigate = useNavigate();

	// Use unified form handler
	const {
		register,
		handleSubmit,
		formState,
		watch,
		setValue,
		error,
		loading,
		onSubmit,
	} = useFormHandler(registerUserSchema, {
		mode: "onBlur",
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			sex: null,
			password: "",
			confirmPassword: "",
		},
		resetOnSuccess: false,
	});

	const { errors: rhfErrors } = formState;

	const handleFormSubmit = async (values) => {
		const submitFn = async (formData) => {
			const result = await registerUser(
				formData.name,
				formData.email,
				formData.password,
				formData.phone,
				formData.sex
			);

			if (!result.success) {
				throw new Error(result.error || "Registration failed");
			}

			return result;
		};

		await onSubmit(values, submitFn, {
			successMessage:
				"Registration successful! Please wait for admin approval.",
			onSuccess: () => {
				toastUtils.success(
					"Registration successful! Please wait for admin approval."
				);
				navigate("/login");
			},
		});
	};

	return (
		<div className="bg-muted flex min-h-dvh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-2xl">
				<Card>
					<CardHeader className="flex flex-col items-center gap-2 text-center">
						<CardTitle className="text-2xl">Create your account</CardTitle>
						<CardDescription>
							Enter your details below to create your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant="destructive">
								<AlertCircleIcon />
								<AlertTitle>{error}</AlertTitle>
							</Alert>
						)}
						<form onSubmit={handleSubmit(handleFormSubmit)}>
							<div className="space-y-4">
								<div className="flex flex-col items-center gap-2 text-center"></div>
								{rhfErrors.error && (
									<div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
										<p className="text-sm text-destructive">
											{rhfErrors.error}
										</p>
									</div>
								)}
								<FormField
									name="name"
									label="Full Name"
									type="text"
									placeholder="John Doe"
									{...register("name")}
									errors={rhfErrors}
									required
								/>
								<FormField
									name="email"
									label="Email"
									type="email"
									placeholder="johndoe@example.com"
									{...register("email")}
									errors={rhfErrors}
									required
								/>
								<FormField
									name="phone"
									label="Phone Number"
									type="tel"
									placeholder="081234567890"
									{...register("phone")}
									errors={rhfErrors}
								/>
								<SelectField
									name="sex"
									label="Gender"
									value={watch("sex") || "NONE"}
									onChange={(value) =>
										setValue("sex", value === "NONE" ? null : value)
									}
									placeholder="Select gender (optional)"
									options={[
										{ value: "NONE", label: "None" },
										{ value: "MALE", label: "Male" },
										{ value: "FEMALE", label: "Female" },
									]}
									errors={rhfErrors}
								/>
								<div className="grid grid-cols-2 gap-4">
									<FormField
										name="password"
										label="Password"
										type="password"
										{...register("password")}
										errors={rhfErrors}
										required
									/>
									<FormField
										name="confirmPassword"
										label="Confirm Password"
										type="password"
										{...register("confirmPassword")}
										errors={rhfErrors}
										required
									/>
								</div>

								<Button type="submit" disabled={loading} className="w-full">
									{loading ? "Creating account..." : "Create Account"}
								</Button>
								<p className="text-center text-sm text-muted-foreground">
									Already have an account?{" "}
									<Button
										type="button"
										variant="link"
										onClick={() => navigate("/login")}
										className="p-0 h-auto underline-offset-4 hover:underline">
										Sign in
									</Button>
								</p>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Register;
