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

export interface Tutor {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpf?: number;
  foto?: PetFoto | null;
}

export interface PetDetail extends Pet {
  tutores: Tutor[];
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
