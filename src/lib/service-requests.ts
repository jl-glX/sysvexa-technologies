export interface ServiceRequestPayload {
  name: string;
  email: string;
  phone: string;
  service: string;
  productOption?: string;
  details: string;
  locale: string;
  consent: boolean;
  captchaToken: string;
  website: string;
}

export class ServiceRequestError extends Error {
  constructor(readonly code: string) {
    super("Service request could not be submitted");
    this.name = "ServiceRequestError";
  }
}

export async function submitServiceRequest(
  payload: ServiceRequestPayload,
  fetcher: typeof fetch = fetch,
): Promise<{ requestId: string }> {
  const response = await fetcher("/api/service-requests", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => ({}))) as {
    submitted?: boolean;
    requestId?: string;
    code?: string;
  };
  if (!response.ok || !result.submitted || !result.requestId) {
    throw new ServiceRequestError(result.code ?? "SUBMISSION_FAILED");
  }
  return { requestId: result.requestId };
}
