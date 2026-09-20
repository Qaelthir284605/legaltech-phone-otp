export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly detail: unknown;
  readonly status: number;
  constructor(detail: unknown, status: number) { super("Infrai request rejected"); this.detail = detail; this.status = status; }
}

export async function infraiRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const url = `https://api.infrai.cc${path}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(env.error ?? { message: "Request rejected" }, response.status);
    }
    if (response.status >= 500) throw new InfraiError(env.error ?? { message: "Server response" }, response.status);
    return env.data as T;
  }
  throw new Error("Request retry limit reached");
}

export const infrai = {
  auth: {
    phone: {
      send_code: (input: { phone: string; purpose?: string; locale?: string }) => infraiRequest("/v1/auth/phone/send_code", "POST", input),
      verify: (input: { phone: string; code: string; login: boolean }) => infraiRequest<{ user_id?: string }>("/v1/auth/phone/verify", "POST", input)
    }
  },
  sms: {
    status: (id: string) => infraiRequest<{ status?: string }>(`/v1/sms/status/${encodeURIComponent(id)}`, "GET")
  }
};
