import type { HomeInformation } from "./types/api";

const API_URL = "https://api.coffee-panel.mitrix.online/api/home/information";

export async function fetchHomeInformation(): Promise<HomeInformation> {
  const res = await fetch(API_URL, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,pt;q=0.8",
      origin: "https://www.paineldocafe.com.br",
      referer: "https://www.paineldocafe.com.br/",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
