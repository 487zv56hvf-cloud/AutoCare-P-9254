import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { authed } from "../middleware/auth";
import { fromAutoDev, fromVpic, mergeLookups, type VinLookup } from "../services/vin-decoders";

// VIN lookup: asks the global auto.dev decoder first (Europe, Asia, China, Korea...),
// then the free US NHTSA vPIC service, and merges what they know. The API key stays
// on the server (root .env: AUTODEV_API_KEY). Matching to the Egypt catalog happens in
// the shared client code (packages/mobile/carcare/vin.ts) so it also works offline.

const VIN = /^[A-HJ-NPR-Z0-9]{17}$/;
const CACHE_MS = 30 * 24 * 3600 * 1000;
const CACHE_MAX = 3000;
const PER_USER_HOUR = 40;

const cache = new Map<string, { at: number; value: VinLookup }>();
const usage = new Map<string, number[]>();

function allow(userId: string) {
  const now = Date.now();
  const recent = (usage.get(userId) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= PER_USER_HOUR) return false;
  recent.push(now);
  usage.set(userId, recent);
  return true;
}

export const vin = {
  /** Decodes a 17-character VIN with the global decoders. Fields it cannot find come back empty. */
  decode: authed
    .input(z.object({ vin: z.string().trim().toUpperCase().regex(VIN) }))
    .handler(async ({ input, context }): Promise<VinLookup> => {
      const hit = cache.get(input.vin);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
      if (!allow(context.user.id)) throw new ORPCError("TOO_MANY_REQUESTS", { message: "Too many VIN lookups. Try again later." });
      const ad = await fromAutoDev(input.vin);
      // vPIC only when auto.dev left a gap it might fill (it is strong on US/Korean/Japanese cars).
      const vp = !ad || !ad.model || !ad.litres ? await fromVpic(input.vin) : null;
      const value = mergeLookups(ad, vp);
      if (value.sources.length) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        cache.set(input.vin, { at: Date.now(), value });
      }
      return value;
    }),
};
