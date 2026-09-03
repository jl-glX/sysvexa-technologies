import { describe, expect, it, vi } from "vitest";
import {
  buildServiceRequestNotification,
  sendServiceRequestNotification,
} from "./notifications";

function notificationEnv(send = vi.fn().mockResolvedValue({})) {
  return {
    NOTIFICATION_FROM: "formularios@sysvexatechnologies.com",
    NOTIFICATION_TO: "u3849730636@gmail.com",
    SERVICE_REQUEST_NOTIFICATIONS: { send },
  } as unknown as Env;
}

const notification = {
  requestId: "00000000-0000-4000-8000-000000000001",
  service: "maintenance",
  productOption: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("service request notifications", () => {
  it("builds a minimal notice without copying customer data", () => {
    const message = buildServiceRequestNotification(
      notificationEnv(),
      notification,
    );
    const serialized = JSON.stringify(message);
    expect(message.to).toBe("u3849730636@gmail.com");
    expect(serialized).toContain(notification.requestId);
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("details");
    expect(serialized).not.toContain("captchaToken");
  });

  it("includes a consulting duration without copying customer data", () => {
    const message = buildServiceRequestNotification(notificationEnv(), {
      ...notification,
      service: "consulting",
      productOption: "consulting_90",
    });
    expect(message.text).toContain("Modalidad: consulting_90");
  });

  it("uses the restricted Cloudflare email binding", async () => {
    const send = vi.fn().mockResolvedValue({});
    await sendServiceRequestNotification(notificationEnv(send), notification);
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toMatchObject({
      subject: "Nueva solicitud de servicio en Sysvexa",
      to: "u3849730636@gmail.com",
    });
  });
});
