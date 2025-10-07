import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import AppToaster from "@/components/ui/app-toaster";
import "@/styles/globals.css";
import router from "./router";
import { ThemeProvider } from "@/components/shared/theme-provider";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
			<AuthProvider>
				<ConfirmProvider>
					<RouterProvider router={router} />
					<AppToaster />
				</ConfirmProvider>
			</AuthProvider>
		</ThemeProvider>
	</StrictMode>
);
