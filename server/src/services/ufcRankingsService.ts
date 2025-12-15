// src/services/ufcRankingsService.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { UfcRanking, IDivision, IFighterRank } from "../models/UfcRanking";

const UFC_RANKINGS_URL = "https://www.ufc.com/rankings";

/**
 * UFC web sitesinden rankings'i scrape eder
 * → Sadece manuel refresh endpoint'i tarafından çağrılmalı
 */
export async function scrapeUfcRankingsFromWeb(): Promise<IDivision[]> {
  const { data: html } = await axios.get(UFC_RANKINGS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const $ = cheerio.load(html);
  const divisions: IDivision[] = [];

  $(".view-grouping").each((_, grouping) => {
    const $group = $(grouping);

    // 1) Siklet adı
    let divisionName = $group
      .find(".view-grouping-header")
      .first()
      .text()
      .trim();

    if (!divisionName) {
      divisionName = $group
        .find("caption .info h4")
        .first()
        .text()
        .trim();
    }

    if (!divisionName) return;

    // 2) Şampiyonu bul (caption içindeki champion bloğu)
    let champion: IFighterRank | null = null;

    const championBlock = $group
      .find("caption .rankings--athlete--champion")
      .first();

    if (championBlock.length) {
      // Genelde isim bir <a> içinde oluyor
      const championName = championBlock.find("a").first().text().trim();

      if (championName) {
        champion = {
          rank: 0,
          rankText: "C",
          isChampion: true,
          name: championName,
        };
      }
    }

    // 3) Top 15 dövüşçüyü al
    const fighters: IFighterRank[] = [];
    let count = 0;

    $group.find("tbody tr").each((__, row) => {
      if (count >= 15) return false;

      const $row = $(row);

      const rankTextRaw = $row
        .find("td.views-field-weight-class-rank")
        .text()
        .trim();

      const name = $row
        .find("td.views-field-title a")
        .text()
        .trim();

      if (!name) return;

      let rank: number | null = null;

      if (rankTextRaw) {
        const parsed = parseInt(rankTextRaw, 10);
        if (!isNaN(parsed)) rank = parsed;
      }

      fighters.push({
        rank,
        rankText: rankTextRaw || null,
        isChampion: false,
        name,
      });

      count++;
    });

    if (fighters.length > 0 || champion) {
      divisions.push({
        division: divisionName,
        champion,
        fighters,
      });
    }
  });

  return divisions;
}

/**
 * DB'den rankings'i okur
 * → Frontend ve GET endpoint'leri tarafından kullanılır
 */
export async function getUfcRankingsFromDb(): Promise<IDivision[]> {
  const ranking = await UfcRanking.findOne()
    .sort({ createdAt: -1 }) // En son güncellenen
    .lean()
    .exec();

  if (!ranking || !ranking.divisions || ranking.divisions.length === 0) {
    return [];
  }

  return ranking.divisions;
}

/**
 * Rankings'i scrape edip DB'ye kaydeder
 * → Sadece manuel refresh endpoint'i tarafından çağrılmalı
 */
export async function refreshUfcRankingsInDb(): Promise<IDivision[]> {
  const divisions = await scrapeUfcRankingsFromWeb();

  // Eski rankings'i sil ve yenisini ekle (singleton pattern)
  await UfcRanking.deleteMany({});
  
  await UfcRanking.create({
    divisions,
    lastRefreshedAt: new Date(),
  });

  return divisions;
}