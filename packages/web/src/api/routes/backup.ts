import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { vehicleBackup } from "../database/schema";

/** Same canonical form for "ب ر ص ١٢٣٤", "برص1234", "1234 ب ر ص". */
export function plateKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[أإآ]/g, "ا")
    .replace(/ي/g, "ى")
    .replace(/ة/g, "ه")
    .replace(/[\s\-_|/\\.ـ]/g, "");
  const letters = s.replace(/[0-9]/g, "");
  const digits = s.replace(/[^0-9]/g, "");
  if (!letters || !digits) return null;
  return `${letters}${digits}`;
}

// Vehicle is the client's own JSON shape; validate only the parts the server relies on.
const vehicleData = z
  .object({ make: z.string().max(60), model: z.string().max(80), plate: z.string().max(30).optional() })
  .passthrough();

const toRow = (r: typeof vehicleBackup.$inferSelect) => ({
  id: r.id,
  title: r.title,
  updatedAt: r.updatedAt,
  vehicle: JSON.parse(r.data) as Record<string, unknown>,
});

export const backup = {
  /** Saves (or updates) the signed-in user's car. One row per plate; a car without a plate uses the given id. */
  save: authed
    .input(z.object({ id: z.string().min(6).max(64), title: z.string().max(160), vehicle: vehicleData }))
    .handler(async ({ input, context }) => {
      const data = JSON.stringify(input.vehicle);
      if (data.length > 200_000) throw new ORPCError("BAD_REQUEST", { message: "Vehicle data too large" });
      const key = plateKey(input.vehicle.plate);
      const userId = context.user.id;

      // A plate already backed up under another id (e.g. re-added on a new phone) is the same car.
      const existing = key
        ? await db.select().from(vehicleBackup).where(and(eq(vehicleBackup.userId, userId), eq(vehicleBackup.plateKey, key)))
        : [];
      const id = existing[0]?.id ?? input.id;
      const values = { userId, plateKey: key, title: input.title, data, updatedAt: new Date() };

      const own = await db.select({ userId: vehicleBackup.userId }).from(vehicleBackup).where(eq(vehicleBackup.id, id));
      if (own[0] && own[0].userId !== userId) throw new ORPCError("FORBIDDEN");
      if (own[0]) await db.update(vehicleBackup).set(values).where(eq(vehicleBackup.id, id));
      else await db.insert(vehicleBackup).values({ id, ...values });
      return { id, savedAt: values.updatedAt };
    }),

  /** All cars the signed-in user has backed up, newest first. */
  list: authed.handler(async ({ context }) => {
    const rows = await db
      .select()
      .from(vehicleBackup)
      .where(eq(vehicleBackup.userId, context.user.id))
      .orderBy(desc(vehicleBackup.updatedAt));
    return rows.map(toRow);
  }),

  /** Finds the signed-in user's own car by plate. Never searches other users' cars. */
  findByPlate: authed.input(z.object({ plate: z.string().min(2).max(30) })).handler(async ({ input, context }) => {
    const key = plateKey(input.plate);
    if (!key) throw new ORPCError("BAD_REQUEST", { message: "Invalid plate" });
    const rows = await db
      .select()
      .from(vehicleBackup)
      .where(and(eq(vehicleBackup.userId, context.user.id), eq(vehicleBackup.plateKey, key)));
    return rows[0] ? toRow(rows[0]) : null;
  }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db.delete(vehicleBackup).where(and(eq(vehicleBackup.id, input.id), eq(vehicleBackup.userId, context.user.id)));
    return { ok: true };
  }),
};
