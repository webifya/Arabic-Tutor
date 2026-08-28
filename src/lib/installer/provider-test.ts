import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateAddress(address: string): boolean {
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  if (!address.includes(".")) return false;
  const parts = address.split(".").map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0
  );
}

async function validateCustomBaseUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("CUSTOM_ENDPOINT_NOT_ALLOWED");
  }
  const allowedHosts = (process.env.INSTALLER_ALLOWED_AI_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (!allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error("CUSTOM_ENDPOINT_NOT_ALLOWED");
  }
  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("CUSTOM_ENDPOINT_NOT_ALLOWED");
  }
  return url;
}

type ProviderTestInput = {
  provider: "openai" | "gemini" | "anthropic" | "openai_compatible";
  apiKey: string;
  baseUrl?: string;
};

export async function testProviderConnection(input: ProviderTestInput): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    let url: URL;
    let headers: HeadersInit = { Accept: "application/json" };
    if (input.provider === "openai") {
      url = new URL("https://api.openai.com/v1/models");
      headers = { ...headers, Authorization: `Bearer ${input.apiKey}` };
    } else if (input.provider === "gemini") {
      url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
      headers = { ...headers, "x-goog-api-key": input.apiKey };
    } else if (input.provider === "anthropic") {
      url = new URL("https://api.anthropic.com/v1/models");
      headers = { ...headers, "x-api-key": input.apiKey, "anthropic-version": "2023-06-01" };
    } else {
      if (!input.baseUrl) throw new Error("CUSTOM_ENDPOINT_REQUIRED");
      const base = await validateCustomBaseUrl(input.baseUrl);
      url = new URL(`${base.toString().replace(/\/$/, "")}/models`);
      headers = { ...headers, Authorization: `Bearer ${input.apiKey}` };
    }
    const response = await fetch(url, {
      method: "GET",
      headers,
      redirect: "error",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("PROVIDER_CONNECTION_FAILED");
    const body = (await response.json()) as {
      data?: { id?: string }[];
      models?: { name?: string }[];
    };
    return (body.data?.map(({ id }) => id).filter(Boolean) ??
      body.models?.map(({ name }) => name?.replace(/^models\//, "")).filter(Boolean) ??
      []) as string[];
  } finally {
    clearTimeout(timeout);
  }
}
