import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { getNotifications, markNotificationRead } from "../services/notifications";
import type { NotificationItem, NotificationsResponse } from "../types/notifications";

vi.mock("../services/notifications", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  isNotificationUnread: (item: NotificationItem) => item.readAt === null,
}));

const unread: NotificationItem = {
  id: "notification-1",
  type: "RESULT_AVAILABLE",
  caseReferenceCode: "CAS-20261024-0001",
  createdAt: "2026-10-24T14:30:00Z",
  readAt: null,
};

const page = (items: NotificationItem[]): NotificationsResponse => ({
  items,
  page: 0,
  size: 20,
  totalElements: items.length,
  totalPages: items.length ? 1 : 0,
});

function renderNotifications() {
  return render(
    <MemoryRouter initialEntries={["/notificaciones"]}>
      <Routes>
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/mis_casos/:caseId" element={<div>Detalle del caso</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NotificationsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra estado de carga y luego el aviso con su acceso al caso", async () => {
    let resolve!: (value: NotificationsResponse) => void;
    vi.mocked(getNotifications).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    renderNotifications();

    expect(screen.getByRole("status")).toHaveTextContent("Cargando notificaciones");
    resolve(page([unread]));

    expect(await screen.findByText("Resultado disponible")).toBeInTheDocument();
    expect(screen.getByText("Hay un resultado disponible para el caso CAS-20261024-0001.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver caso" })).toHaveAttribute(
      "href", "/mis_casos/CAS-20261024-0001",
    );
    expect(screen.queryByText(/diagnóstico|motivo|archivo/i)).not.toBeInTheDocument();
  });

  it("presenta un estado vacío cuando la bandeja no tiene avisos", async () => {
    vi.mocked(getNotifications).mockResolvedValueOnce(page([]));
    renderNotifications();
    expect(await screen.findByText(/No tienes notificaciones por ahora/)).toBeInTheDocument();
  });

  it("permite reintentar después de un error de carga", async () => {
    vi.mocked(getNotifications)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(page([]));
    renderNotifications();

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText(/No tienes notificaciones por ahora/)).toBeInTheDocument();
    expect(getNotifications).toHaveBeenCalledTimes(2);
  });

  it("marca el aviso como leído y actualiza el estado de la fila", async () => {
    vi.mocked(getNotifications).mockResolvedValueOnce(page([unread]));
    vi.mocked(markNotificationRead).mockResolvedValueOnce({
      ...unread,
      readAt: "2026-10-24T15:00:00Z",
    });
    renderNotifications();

    await userEvent.click(await screen.findByRole("button", { name: "Marcar como leída" }));

    await waitFor(() => expect(screen.getByText("Leída")).toBeInTheDocument());
    expect(markNotificationRead).toHaveBeenCalledWith(unread.id);
    expect(screen.queryByRole("button", { name: "Marcar como leída" })).not.toBeInTheDocument();
  });

  it("muestra error de acción si falla el marcado de lectura", async () => {
    vi.mocked(getNotifications).mockResolvedValueOnce(page([unread]));
    vi.mocked(markNotificationRead).mockRejectedValueOnce(new Error("network"));
    renderNotifications();

    await userEvent.click(await screen.findByRole("button", { name: "Marcar como leída" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo marcar el aviso como leído");
    expect(screen.getByText("Sin leer")).toBeInTheDocument();
  });
});
