type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string | string[]>;
  data?: T;
};

export class ApiError extends Error {
  fields: Record<string, string[]>;
  status: number;

  constructor(
    message: string,
    fields: Record<string, string[]> = {},
    status = 0,
  ) {
    super(message);
    this.name = "ApiError";
    this.fields = fields;
    this.status = status;
  }
}

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Could not reach the API. Check that the backend is running and try again.",
    );
  }

  if (response.status === 204) {
    if (!response.ok)
      throw new ApiError(`Request failed with status ${response.status}.`);
    return undefined as T;
  }

  const responseText = await response.text();
  let payload: ApiEnvelope<T> | null = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as ApiEnvelope<T>;
    } catch {
      if (response.ok)
        throw new ApiError("The API returned an unreadable response.");
    }
  }

  if (!response.ok || payload?.success === false) {
    const fields = Object.fromEntries(
      Object.entries(payload?.errors ?? {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? value : [value],
      ]),
    );
    throw new ApiError(
      payload?.error ||
        payload?.message ||
        `Request failed with status ${response.status}.`,
      fields,
      response.status,
    );
  }

  if (!payload || !("data" in payload)) {
    throw new ApiError("The API response did not include data.");
  }
  return payload.data as T;
}
