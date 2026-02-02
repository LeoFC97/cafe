export interface Expert {
  id: string;
  name: string;
  role: string;
  photo: string;
  email: string;
  whatsapp: string; // número só dígitos para wa.me (55 + DDD + número)
  whatsappDisplay: string; // ex: (22) 99867-0162
}

export interface ExpertRegion {
  region: string;
  specialists: Expert[];
}

export const expertsByRegion: ExpertRegion[] = [
  {
    region: "Sudeste (ES)",
    specialists: [
      {
        id: "bruno-pestana",
        name: "Bruno Pestana",
        role: "Especialista em mercado de café",
        photo: "/bruno-pestana.png",
        email: "contato@paineldocafe.com.br",
        whatsapp: "5522998670162",
        whatsappDisplay: "(22) 99867-0162",
      },
    ],
  },
  {
    region: "Sul",
    specialists: [
      {
        id: "sul-placeholder",
        name: "Em breve",
        role: "Especialista — região Sul",
        photo: "",
        email: "#",
        whatsapp: "#",
        whatsappDisplay: "—",
      },
    ],
  },
  {
    region: "Nordeste",
    specialists: [
      {
        id: "nordeste-placeholder",
        name: "Em breve",
        role: "Especialista — região Nordeste",
        photo: "",
        email: "#",
        whatsapp: "#",
        whatsappDisplay: "—",
      },
    ],
  },
  {
    region: "Centro-Oeste",
    specialists: [
      {
        id: "centro-oeste-placeholder",
        name: "Em breve",
        role: "Especialista — região Centro-Oeste",
        photo: "",
        email: "#",
        whatsapp: "#",
        whatsappDisplay: "—",
      },
    ],
  },
  {
    region: "Sudeste (SP/MG/RJ)",
    specialists: [
      {
        id: "sudeste-placeholder",
        name: "Em breve",
        role: "Especialista — SP, MG ou RJ",
        photo: "",
        email: "#",
        whatsapp: "#",
        whatsappDisplay: "—",
      },
    ],
  },
];
