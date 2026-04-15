/**
 * Client-side localStorage → database migration.
 * Reads existing trips from browser storage and POSTs them to the DB API.
 * Sets a flag so migration doesn't re-run.
 */

interface LocalTrip {
  id: string;
  destination: string;
  duration: number;
  budget: string;
  createdAt: string;
}

export interface MigrationResult {
  total: number;
  migrated: number;
  errors: string[];
}

export function hasPendingMigration(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("roamly_migrated")) return false;
    const history = localStorage.getItem("roamly_history");
    if (!history) return false;
    const entries = JSON.parse(history);
    return Array.isArray(entries) && entries.length > 0;
  } catch {
    return false;
  }
}

export function getPendingTripCount(): number {
  try {
    const history = localStorage.getItem("roamly_history");
    if (!history) return 0;
    const entries = JSON.parse(history);
    return Array.isArray(entries) ? entries.length : 0;
  } catch {
    return 0;
  }
}

export async function migrateLocalTrips(
  onProgress?: (current: number, total: number) => void
): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, migrated: 0, errors: [] };

  try {
    const historyRaw = localStorage.getItem("roamly_history");
    if (!historyRaw) return result;

    const entries: LocalTrip[] = JSON.parse(historyRaw);
    if (!Array.isArray(entries)) return result;

    result.total = entries.length;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      onProgress?.(i + 1, entries.length);

      try {
        const tripRaw = localStorage.getItem(`roamly_trip_${entry.id}`);
        if (!tripRaw) {
          result.errors.push(`No data for trip ${entry.destination}`);
          continue;
        }

        const tripJson = JSON.parse(tripRaw);
        const tripData = tripJson.trip;
        if (!tripData) {
          result.errors.push(`Invalid data for trip ${entry.destination}`);
          continue;
        }

        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData: {
              destination: tripData.destination || entry.destination,
              durationDays: tripData.duration_days || entry.duration,
              budget: entry.budget || "mid-range",
            },
            tripData,
          }),
        });

        if (!res.ok) {
          result.errors.push(
            `Failed to save ${entry.destination}: ${res.status}`
          );
          continue;
        }

        result.migrated++;
      } catch (err) {
        result.errors.push(
          `Error migrating ${entry.destination}: ${err instanceof Error ? err.message : "unknown"}`
        );
      }
    }

    // Mark migration as complete
    localStorage.setItem(
      "roamly_migrated",
      JSON.stringify({ at: Date.now(), count: result.migrated })
    );
  } catch (err) {
    result.errors.push(
      `Migration failed: ${err instanceof Error ? err.message : "unknown"}`
    );
  }

  return result;
}

export function dismissMigration() {
  try {
    localStorage.setItem(
      "roamly_migrated",
      JSON.stringify({ at: Date.now(), count: 0, skipped: true })
    );
  } catch {
    /* ignore */
  }
}
