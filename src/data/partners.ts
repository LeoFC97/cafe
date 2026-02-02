export interface Partner {
  id: string;
  name: string;
  description: string;
  logo?: string; // caminho em public/ ou URL
  url?: string;  // link do site (opcional)
}

export const partners: Partner[] = [
  {
    id: "ellepot",
    name: "Ellepot",
    description: "Sistema integrado de plantio com máquinas, papéis biodegradáveis e bandejas para propagação de mudas. Atua em silvicultura, ornamentais, legumes, frutas e outras culturas, incluindo café.",
    url: "https://www.ellepot.com/pt",
  },
  {
    id: "parceiro-1",
    name: "Marca Parceira 1",
    description: "Descrição da marca parceira 1 e o que ela oferece ao setor.",
    logo: "/partners/logo1.png",
    url: "https://exemplo.com",
  },
  {
    id: "parceiro-2",
    name: "Marca Parceira 2",
    description: "Descrição da marca parceira 2 e o que ela oferece ao setor.",
    logo: "/partners/logo2.png",
    url: "https://exemplo.com",
  },
  {
    id: "parceiro-3",
    name: "Marca Parceira 3",
    description: "Descrição da marca parceira 3 e o que ela oferece ao setor.",
    url: "https://exemplo.com",
  },
];
