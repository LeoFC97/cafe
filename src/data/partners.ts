export interface Partner {
  id: string;
  name: string;
  logo?: string; // caminho em public/ ou URL
  url?: string;  // link do site (opcional)
}

export const partners: Partner[] = [
  {
    id: "parceiro-1",
    name: "Marca Parceira 1",
    logo: "/partners/logo1.png",
    url: "https://exemplo.com",
  },
  {
    id: "parceiro-2",
    name: "Marca Parceira 2",
    logo: "/partners/logo2.png",
    url: "https://exemplo.com",
  },
  {
    id: "parceiro-3",
    name: "Marca Parceira 3",
    url: "https://exemplo.com",
  },
];
