export interface Pet {
  id: number;
  nome: string;
  raca: string;
  idade?: number;
  foto?: PetFoto | null;
}

export interface PetFoto {
  id: number;
  nome: string;
  contentType: string;
  url: string;
}

export interface PetResponse {
  page: number;
  size: number;
  total: number;
  pageCount: number;
  content: Pet[];
}

export interface PetQuery {
  nome?: string;
  page?: number;
  size?: number;
}
