import React from "react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ResearcherCaseDetailPage } from "../pages/researcher/ResearcherCaseDetailPage";
import { getResearcherAcademicCaseDetail } from "../services/academicCases";
import { apiClient } from "../services/apiClient";
import type { ResearcherAcademicCaseDetail } from "../types/academicCases";

vi.mock("../services/academicCases", () => ({
  getResearcherAcademicCaseDetail: vi.fn(),
}));

const assignedCaseId = "case-123";
const pendingDetail: ResearcherAcademicCaseDetail = {
  case: {
    id: assignedCaseId,
    referenceCode: "CAS-20261001-0001",
    status: "RESULT_UPLOADED",
    studyName: "Tomografía de tórax",
    additionalReference: null,
    originInstitution: null,
    studyDate: null,
    notes: null,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-01T11:00:00Z",
    receivedAt: "2026-10-01T10:00:00Z",
    availableResultId: null,
  },
  inputFiles: [],
  results: [{
    id: "result-123",
    originalFilename: "informe.pdf",
    contentType: "application/pdf",
    sizeBytes: 2048,
    uploadedAt: "2026-10-01T11:00:00Z",
    updatedAt: "2026-10-01T11:00:00Z",
    version: 1,
    status: "UPLOADED",
    correctionRequest: null,
    publicationType: "INITIAL",
    availableAt: null,
  }],
};

const enabledWithoutResult: ResearcherAcademicCaseDetail = {
  ...pendingDetail,
  case: { ...pendingDetail.case, status: "ENABLED_FOR_PROCESSING", updatedAt: "2026-10-01T12:00:00Z" },
  results: [],
};

const uploadedDetail: ResearcherAcademicCaseDetail = {
  ...pendingDetail,
  case: { ...pendingDetail.case, status: "RESULT_UPLOADED" },
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/casos_asignados/${assignedCaseId}`]}>
      <Routes>
        <Route path="/casos_asignados/:caseId" element={<ResearcherCaseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("acciones del investigador sobre resultados pendientes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reemplaza mediante eliminación auditada y habilita la siguiente carga", async () => {
    const user = userEvent.setup();
    vi.mocked(getResearcherAcademicCaseDetail)
      .mockResolvedValueOnce(pendingDetail)
      .mockResolvedValueOnce(enabledWithoutResult);
    const deleteSpy = vi.spyOn(apiClient.internal, "deleteResult").mockResolvedValueOnce();

    renderDetail();
    await screen.findByText("informe.pdf");
    await user.click(screen.getByRole("button", { name: "Reemplazar" }));
    await user.type(screen.getByLabelText("Motivo"), "El archivo tenía un error");
    await user.click(screen.getByRole("button", { name: "Retirar y continuar" }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(assignedCaseId, "result-123", "El archivo tenía un error"));
    expect(await screen.findByText("Cargar Resultado Procesado")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Ya puedes cargar la nueva versión");
  });

  it("elimina una carga pendiente con motivo y deja el caso habilitado", async () => {
    const user = userEvent.setup();
    vi.mocked(getResearcherAcademicCaseDetail)
      .mockResolvedValueOnce(pendingDetail)
      .mockResolvedValueOnce(enabledWithoutResult);
    const deleteSpy = vi.spyOn(apiClient.internal, "deleteResult").mockResolvedValueOnce();

    renderDetail();
    await screen.findByText("informe.pdf");
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.type(screen.getByLabelText("Motivo"), "Se retira sin reemplazo");
    await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(assignedCaseId, "result-123", "Se retira sin reemplazo"));
    expect(await screen.findByText("Cargar Resultado Procesado")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("quedó habilitado para procesamiento");
  });

  it("no ofrece reemplazo ni eliminación cuando el resultado ya está publicado", async () => {
    vi.mocked(getResearcherAcademicCaseDetail).mockResolvedValueOnce({
      ...pendingDetail,
      case: { ...pendingDetail.case, status: "RESULT_AVAILABLE", availableResultId: "result-123" },
      results: [{ ...pendingDetail.results[0], status: "AVAILABLE", availableAt: "2026-10-01T12:00:00Z" }],
    });

    renderDetail();
    await screen.findByText("informe.pdf");
    expect(screen.queryByRole("button", { name: "Reemplazar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });

  it("refleja la versión inicial cargada y deja un mensaje de éxito en el detalle", async () => {
    const user = userEvent.setup();
    vi.mocked(getResearcherAcademicCaseDetail)
      .mockResolvedValueOnce(enabledWithoutResult)
      .mockResolvedValueOnce(uploadedDetail);
    vi.spyOn(apiClient.internal, "createResultUpload").mockResolvedValueOnce({
      file: { id: "file-456", originalFilename: "informe.pdf", contentType: "application/pdf", sizeBytes: 5, fileKind: "RESULT" },
      uploadUrl: "https://storage.healthdocs.local/result/file-456",
      expiresAt: "2099-01-01T00:00:00Z",
    });
    vi.spyOn(apiClient.files, "completeUpload").mockResolvedValueOnce({
      file: { id: "file-456", originalFilename: "informe.pdf", contentType: "application/pdf", sizeBytes: 5, fileKind: "RESULT" },
      result: { id: "result-123", caseId: assignedCaseId, status: "UPLOADED", uploadedBy: "researcher-1", uploadedAt: "2026-10-01T11:00:00Z", version: 1, publicationType: "INITIAL" },
      caseStatus: "RESULT_UPLOADED",
    });

    renderDetail();
    await screen.findByText("Cargar Resultado Procesado");
    await user.upload(screen.getByTestId("result-file-input"), new File(["pdf"], "informe.pdf", { type: "application/pdf" }));
    await user.click(screen.getByTestId("submit-result-button"));

    expect(await screen.findByText("El resultado se cargó y quedó pendiente de revisión por coordinación.")).toBeInTheDocument();
    expect(await screen.findByText("informe.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Cargar Resultado Procesado")).not.toBeInTheDocument();
  });

  it("exige un motivo antes de confirmar la eliminación", async () => {
    const user = userEvent.setup();
    vi.mocked(getResearcherAcademicCaseDetail).mockResolvedValueOnce(pendingDetail);
    renderDetail();
    await screen.findByText("informe.pdf");
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(screen.getByRole("button", { name: "Confirmar eliminación" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Motivo" } });
    expect(screen.getByRole("button", { name: "Confirmar eliminación" })).toBeEnabled();
  });
});
