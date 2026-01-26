import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHelperService } from '../../../core/http/http-helper.service';
import { PetResponse, PetQuery, PetDetail, PetRequest, Pet, PetFoto } from '../models/pet.models';

@Injectable({
  providedIn: 'root'
})
export class PetsApiService {
  private httpHelper = inject(HttpHelperService);

  getPets(query: PetQuery = {}): Observable<PetResponse> {
    const params: Record<string, string | number> = {};

    if (query.nome) {
      params['nome'] = query.nome;
    }
    if (query.raca) {
      params['raca'] = query.raca;
    }
    if (query.page !== undefined) {
      params['page'] = query.page;
    }
    if (query.size !== undefined) {
      params['size'] = query.size;
    }

    return this.httpHelper.get<PetResponse>('/v1/pets', params);
  }

  getPetById(id: number): Observable<PetDetail> {
    return this.httpHelper.get<PetDetail>(`/v1/pets/${id}`);
  }

  createPet(pet: PetRequest): Observable<Pet> {
    return this.httpHelper.post<Pet>('/v1/pets', pet);
  }

  updatePet(id: number, pet: PetRequest): Observable<Pet> {
    return this.httpHelper.put<Pet>(`/v1/pets/${id}`, pet);
  }

  uploadPetPhoto(id: number, file: File): Observable<PetFoto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpHelper.postMultipart<PetFoto>(`/v1/pets/${id}/fotos`, formData);
  }

  deletePet(id: number): Observable<void> {
    return this.httpHelper.delete<void>(`/v1/pets/${id}`);
  }
}
