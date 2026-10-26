import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PatientDashboardPage } from "../pages/patient/PatientDashboardPage";
import { getPatientDashboard } from "../services/patientDashboard";
import type { PatientDashboardResponse } from "../types/patientDashboard";

vi.mock("../services/patientDashboard", () => ({
  getPatientDashboard: vi.fn(),
}));

const mockGetPatientDashboard = vi.mocked(getPatientDashboard);

function dashboard(
  recentActivity: PatientDashboardResponse["recentActivity"],
): PatientDashboardResponse {
  return {
    summary: { activeCases: 0, inProgressCases: 0, availableResults: 0 },
    recentCases: [],
    nextSteps: [],
    recentActivity,
    availableResults: [],
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<PatientDashboardPage />} />
        <Route path="/mis_casos/:caseId" element={<p>Detalle del caso</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Actividad reciente del dashboard del paciente", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra carga y luego actividades de varios casos con acceso al detalle", async () => {
    let resolveDashboard!: (value: PatientDashboardResponse) => void;
    mockGetPatientDashboard.mockReturnValueOnce(
      new Promise((resolve) => { resolveDashboard = resolve; }),
    );

    renderDashboard();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando dashboard");

    resolveDashboard(dashboard([
      {
        id: "event-1",
        type: "RESULT_PUBLISHED",
        occurredAt: "2026-10-24T12:00:00Z",
        caseReferenceCode: "CAS-20261024-0001",
      },
      {
        id: "event-2",
        type: "INPUT_CHANGE_REJECTED",
        occurredAt: "2026-10-24T11:00:00Z",
        caseReferenceCode: "CAS-20261023-0002",
      },
    ]));

    const secondActivityLink = await screen.findByRole("link", {
      name: "Solicitud revisada: CAS-20261023-0002",
    });
    expect(screen.getByText("Resultado disponible")).toBeInTheDocument();
    expect(screen.getByText("La solicitud de cambio del caso CAS-20261023-0002 fue revisada."))
      .toBeInTheDocument();

    fireEvent.click(secondActivityLink);
    expect(await screen.findByText("Detalle del caso")).toBeInTheDocument();
  });

  it("muestra un estado vacío si el backend no devuelve actividad", async () => {
    mockGetPatientDashboard.mockResolvedValueOnce(dashboard([]));

    renderDashboard();

    expect(await screen.findByText("Aún no hay actividad reciente.")).toBeInTheDocument();
  });

  it("muestra el estado de error si falla la consulta real del dashboard", async () => {
    mockGetPatientDashboard.mockRejectedValueOnce(new Error("Network error"));

    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible cargar el dashboard.",
    );
  });
});
