import "server-only";

import { createPool, type Pool, type PoolConnection } from "mysql2/promise";
import { getEffectiveRuntimeConfig } from "@/lib/installer/runtime-config";

let cached: { url: string; pool: Pool } | undefined;

export async function getPool(): Promise<Pool> {
  const runtime = await getEffectiveRuntimeConfig();
  if (!runtime?.databaseUrl) throw new Error("Application database is not configured");
  if (cached?.url === runtime.databaseUrl) return cached.pool;
  await cached?.pool.end();
  cached = {
    url: runtime.databaseUrl,
    pool: createPool({ uri: runtime.databaseUrl, connectionLimit: 8, enableKeepAlive: true, dateStrings: ["DATE"] }),
  };
  return cached.pool;
}

export async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await (await getPool()).getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
