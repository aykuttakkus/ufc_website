// src/api/rankApi.ts
import type {
  UfcDivisionsResponse,
  UfcSingleDivisionResponse,
} from "../types";

// Backend base URL – env'den oku, yoksa localhost
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5050";

export async function getAllUfcDivisions(): Promise<UfcDivisionsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/ufc/rankings`);

  if (!res.ok) {
    throw new Error("Failed to fetch UFC divisions");
  }

  const data: UfcDivisionsResponse = await res.json();
  return data;
}

export async function getUfcDivision(
  divisionName: string
): Promise<UfcSingleDivisionResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/ufc/rankings/${divisionName.toLowerCase()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch UFC division");
  }

  const data: UfcSingleDivisionResponse = await res.json();
  return data;
}