import { getUser, getMonthlyUsage, recordUsage } from "@/lib/db/queries";

export const FREE_LIMITS: Record<string, number> = {
  generate: 3,
  regenerate: 10,
  chat: 20,
  budget: 5,
  packing: 5,
};

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  resetsAt: Date;
}

function getMonthResetDate(): Date {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return reset;
}

/**
 * Check if a user can perform an action.
 * Pro users always pass. Free users are checked against monthly limits.
 */
export async function checkUsageLimit(
  userId: string,
  action: string
): Promise<UsageCheck> {
  const limit = FREE_LIMITS[action] ?? 10;
  const resetsAt = getMonthResetDate();

  // Check if user is on pro plan
  try {
    const user = await getUser(userId);
    if (user?.plan === "pro") {
      return { allowed: true, current: 0, limit: Infinity, resetsAt };
    }
  } catch {
    // DB not connected — allow action (graceful degradation)
    return { allowed: true, current: 0, limit, resetsAt };
  }

  try {
    const current = await getMonthlyUsage(userId, action);
    return {
      allowed: current < limit,
      current,
      limit,
      resetsAt,
    };
  } catch {
    // DB error — allow action
    return { allowed: true, current: 0, limit, resetsAt };
  }
}

/**
 * Record a usage event after successful completion.
 */
export async function trackUsage(userId: string, action: string) {
  try {
    await recordUsage(userId, action);
  } catch {
    // Don't fail the request if usage tracking fails
  }
}

/**
 * Get a summary of all usage for the current month.
 */
export async function getUsageSummary(userId: string) {
  const resetsAt = getMonthResetDate();

  try {
    const user = await getUser(userId);
    const isPro = user?.plan === "pro";

    const [generate, regenerate, chat, budget, packing] = await Promise.all([
      getMonthlyUsage(userId, "generate"),
      getMonthlyUsage(userId, "regenerate"),
      getMonthlyUsage(userId, "chat"),
      getMonthlyUsage(userId, "budget"),
      getMonthlyUsage(userId, "packing"),
    ]);

    return {
      plan: isPro ? ("pro" as const) : ("free" as const),
      resetsAt: resetsAt.toISOString(),
      usage: {
        generate: {
          current: generate,
          limit: isPro ? Infinity : FREE_LIMITS.generate,
        },
        regenerate: {
          current: regenerate,
          limit: isPro ? Infinity : FREE_LIMITS.regenerate,
        },
        chat: {
          current: chat,
          limit: isPro ? Infinity : FREE_LIMITS.chat,
        },
        budget: {
          current: budget,
          limit: isPro ? Infinity : FREE_LIMITS.budget,
        },
        packing: {
          current: packing,
          limit: isPro ? Infinity : FREE_LIMITS.packing,
        },
      },
    };
  } catch {
    // DB not connected — return defaults
    return {
      plan: "free" as const,
      resetsAt: resetsAt.toISOString(),
      usage: {
        generate: { current: 0, limit: FREE_LIMITS.generate },
        regenerate: { current: 0, limit: FREE_LIMITS.regenerate },
        chat: { current: 0, limit: FREE_LIMITS.chat },
        budget: { current: 0, limit: FREE_LIMITS.budget },
        packing: { current: 0, limit: FREE_LIMITS.packing },
      },
    };
  }
}
