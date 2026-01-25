import { Pet, PetFoto } from '../../pets/models/pet.models';

export interface Tutor {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpf?: number;
  foto?: PetFoto | null;
}

export interface TutorDetail extends Tutor {
  pets: Pet[];
}

export interface TutorRequest {
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
  cpf?: number;
}

export interface TutorFoto {
  id: number;
  nome: string;
  contentType: string;
  url: string;
}

export interface TutorResponse {
  page: number;
  size: number;
  total: number;
  pageCount: number;
  content: Tutor[];
}

export interface TutorQuery {
  nome?: string;
  page?: number;
  size?: number;
}
