import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireUserId(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity?.subject) {
		throw new Error("Authentication required");
	}
	return identity.subject;
}
