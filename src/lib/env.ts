const FALLBACK_APP_URL = "http://localhost:3000";

/**
 * Resolve the public application URL.
 *
 * Local development works without an `.env.local` file so the foundation can
 * be cloned and run immediately. Deployments must set NEXT_PUBLIC_APP_URL.
 */
export function getAppUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!raw) {
    return new URL(FALLBACK_APP_URL);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_APP_URL must be an absolute URL (received "${raw}"). Example: https://dawai.app`,
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`NEXT_PUBLIC_APP_URL must use http or https (received "${url.protocol}").`);
  }

  return url;
}
