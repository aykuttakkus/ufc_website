// src/clients/client.ts  (veya ufcClient.ts)
import axios from "axios";

export const ufcClient = axios.create({
  baseURL: "https://www.ufc.com",
  timeout: 10000,
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
    Referer: "https://www.ufc.com/",
  },
});

export async function fetchUfcHtml(path: string): Promise<string> {
  try {
    const res = await ufcClient.get(path, {
      responseType: "text",
      validateStatus: (status) => status >= 200 && status < 400,
    });

    return res.data as string;
  } catch (err: any) {
    console.error("[fetchUfcHtml] UFC isteği hata:", {
      message: err.message,
      status: err.response?.status,
      url: ufcClient.defaults.baseURL + path,
    });
    throw err;
  }
}