import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import { useAuth } from "@workos-inc/authkit-react";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	console.error("missing envar CONVEX_URL");
}
const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

export default function AppConvexProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ConvexProviderWithAuthKit
			client={convexQueryClient.convexClient}
			useAuth={useAuth}
		>
			{children}
		</ConvexProviderWithAuthKit>
	);
}
