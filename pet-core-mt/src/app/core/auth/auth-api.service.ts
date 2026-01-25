import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHelperService } from '../http/http-helper.service';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from './models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private httpHelper = inject(HttpHelperService);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.httpHelper.post<LoginResponse>('/autenticacao/login', credentials);
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.httpHelper.put<RefreshTokenResponse>(
      '/autenticacao/refresh',
      null,
      { Authorization: `Bearer ${refreshToken}` }
    );
  }
}
