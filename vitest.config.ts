import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		projects: [
			{
				test: {
					name: "convex",
					include: ["convex/__tests__/**/*.test.ts"],
					environment: "node",
					server: {
						deps: {
							inline: ["convex-test"],
						},
					},
				},
			},
			{
				test: {
					name: "react",
					include: ["src/__tests__/**/*.test.tsx", "src/**/*.test.tsx"],
					environment: "jsdom",
					globals: true,
					setupFiles: ["./src/test-setup.ts"],
				},
			},
		],
	},
});
