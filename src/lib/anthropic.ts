import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

let client: Anthropic | null = null;

/**
 * Shared Anthropic client singleton.
 * Lazily initialized on first call so build/static analysis passes without keys.
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}
