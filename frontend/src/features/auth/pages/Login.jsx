import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { loginAuthSchema } from "@/validation/auth-validation";
import { useFormHandler } from "@/hooks/useFormHandler";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

const Login = () => {
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const {
		register,
		handleSubmit,
		formState: { errors: rhfErrors },
		error,
		loading,
		onSubmit,
	} = useFormHandler(loginAuthSchema, {
		mode: "onBlur",
		defaultValues: { email: "", password: "" },
		resetOnSuccess: false,
	});

	const handleFormSubmit = async (values) => {
		const submitFn = async (formData) => {
			const result = await login(formData.email, formData.password);
			if (!result || !result.success) {
				throw new Error(result?.error || "Login failed");
			}
			return result;
		};

		await onSubmit(values, submitFn, {
			successMessage: "Login successful!",
			onSuccess: () => {
				// If user was redirected to login from a protected route, return them there
				const destination =
					(location &&
						location.state &&
						location.state.from &&
						location.state.from.pathname) ||
					"/dashboard";
				navigate(destination, { replace: true });
			},
		});
	};

	return (
		<div className="bg-muted flex min-h-dvh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-lg">
				<Card>
					<CardHeader>
						<CardTitle>Login to your account</CardTitle>
						<CardDescription>
							Enter your email below to login to your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant="destructive" className="mb-4">
								<AlertCircleIcon />
								<AlertTitle>{error}</AlertTitle>
							</Alert>
						)}
						<form onSubmit={handleSubmit(handleFormSubmit)}>
							<div className="space-y-4">
								<FormField
									name="email"
									label="Email"
									type="email"
									placeholder="m@example.com"
									{...register("email")}
									errors={rhfErrors}
									required
								/>
								<FormField
									name="password"
									label="Password"
									type="password"
									{...register("password")}
									errors={rhfErrors}
									required
								/>
								<div className="space-y-2">
									<Button type="submit" disabled={loading} className="w-full">
										{loading ? "Signing in..." : "Login"}
									</Button>
									<p className="text-center text-sm text-muted-foreground">
										Don&apos;t have an account?{" "}
										<Button
											type="button"
											variant="link"
											onClick={() => navigate("/register")}
											className="p-0 h-auto underline-offset-4 hover:underline">
											Register
										</Button>
									</p>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Login;
