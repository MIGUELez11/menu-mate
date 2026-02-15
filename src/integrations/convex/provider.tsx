import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import { useAuth } from "@workos-inc/authkit-react";
import { env } from "@/env";

const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL);

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
