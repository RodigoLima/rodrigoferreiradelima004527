import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHelperService } from '../../../core/http/http-helper.service';
import { PetResponse, PetQuery, PetDetail } from '../models/pet.models';

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
}
