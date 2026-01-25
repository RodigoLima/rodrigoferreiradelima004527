import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHelperService } from '../../../core/http/http-helper.service';
import { Tutor, TutorDetail, TutorRequest, TutorFoto, TutorResponse, TutorQuery } from '../models/tutor.models';

@Injectable({
  providedIn: 'root'
})
export class TutoresApiService {
  private httpHelper = inject(HttpHelperService);

  getTutores(query: TutorQuery = {}): Observable<TutorResponse> {
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

    return this.httpHelper.get<TutorResponse>('/v1/tutores', params);
  }

  getTutorById(id: number): Observable<TutorDetail> {
    return this.httpHelper.get<TutorDetail>(`/v1/tutores/${id}`);
  }

  createTutor(tutor: TutorRequest): Observable<Tutor> {
    return this.httpHelper.post<Tutor>('/v1/tutores', tutor);
  }

  updateTutor(id: number, tutor: TutorRequest): Observable<Tutor> {
    return this.httpHelper.put<Tutor>(`/v1/tutores/${id}`, tutor);
  }

  uploadTutorPhoto(id: number, file: File): Observable<TutorFoto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpHelper.postMultipart<TutorFoto>(`/v1/tutores/${id}/fotos`, formData);
  }
}
