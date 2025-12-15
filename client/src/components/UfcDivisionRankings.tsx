// src/components/UfcDivisionRankings.tsx  (veya src/pages/RankingsPage.tsx içine)

import { useEffect, useState } from "react";
import type {
  UfcDivision,
  UfcFighterRank,
} from "../types";
import {
  getAllUfcDivisions,
  getUfcDivision,
} from "../api/rankApi";

function UfcDivisionRankings() {
  const [divisions, setDivisions] = useState<UfcDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [currentDivision, setCurrentDivision] = useState<UfcDivision | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tüm division'ları 1 kere çek
  useEffect(() => {
    getAllUfcDivisions()
      .then((data) => {
        setDivisions(data.divisions);

        if (data.divisions.length > 0) {
          const first = data.divisions[0];
          setSelectedDivision(first.division);
          setCurrentDivision(first);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Divisions yüklenirken hata oluştu.");
      })
      .finally(() => setInitialLoading(false));
  }, []);

  // Seçilen division değişince sadece onu çek
  useEffect(() => {
    if (!selectedDivision) return;

    setLoading(true);
    setError(null);

    const slug = selectedDivision.toLowerCase().split(" ")[0];

    getUfcDivision(slug)
      .then((data) => {
        setCurrentDivision(data.division);
      })
      .catch((err) => {
        console.error(err);
        setError("Division yüklenirken hata oluştu.");
      })
      .finally(() => setLoading(false));
  }, [selectedDivision]);

  if (initialLoading) {
    return <p style={{ color: "white" }}>Loading divisions...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div
      style={{
        color: "white",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 16 }}>UFC Rankings</h1>

      <div style={{ marginBottom: 24 }}>
        <label>
          Division:{" "}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
          >
            {divisions.map((d) => (
              <option key={d.division} value={d.division}>
                {d.division}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading division...</p>}

      {currentDivision && !loading && (
        <>
          <ChampionCard champion={currentDivision.champion} />
          <h2 style={{ marginTop: 24, marginBottom: 8 }}>
            Top 15 – {currentDivision.division}
          </h2>
          <RankingsTable fighters={currentDivision.fighters} />
        </>
      )}
    </div>
  );
}

function ChampionCard({ champion }: { champion: UfcFighterRank | null }) {
  if (!champion) return null;

  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: 8,
        padding: 16,
        background:
          "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(0,0,0,0.6))",
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: 0, marginBottom: 8 }}>Champion 🏆</h2>
      <div style={{ fontSize: 18, fontWeight: "bold" }}>{champion.name}</div>
      <div style={{ fontSize: 14, opacity: 0.8 }}>
        Rank: {champion.rankText ?? "C"}
      </div>
    </div>
  );
}

function RankingsTable({ fighters }: { fighters: UfcFighterRank[] }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "#111",
      }}
    >
      <thead>
        <tr>
          <th
            style={{
              textAlign: "left",
              borderBottom: "1px solid #444",
              padding: 8,
            }}
          >
            Rank
          </th>
          <th
            style={{
              textAlign: "left",
              borderBottom: "1px solid #444",
              padding: 8,
            }}
          >
            Fighter
          </th>
        </tr>
      </thead>
      <tbody>
        {fighters.map((f) => (
          <tr key={f.name}>
            <td
              style={{
                borderBottom: "1px solid #222",
                padding: 8,
                width: 60,
              }}
            >
              {f.rankText}
            </td>
            <td
              style={{
                borderBottom: "1px solid #222",
                padding: 8,
              }}
            >
              {f.name}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UfcDivisionRankings;