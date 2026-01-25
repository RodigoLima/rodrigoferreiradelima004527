import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class HttpHelperService {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private errorHandler = inject(ErrorHandlerService);

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<T>(`${this.config.baseUrl}${endpoint}`, { params: httpParams }).pipe(
      catchError((error) => {
        this.errorHandler.logError(error, `GET ${endpoint}`);
        return throwError(() => this.errorHandler.handleError(error));
      })
    );
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.config.baseUrl}${endpoint}`, body).pipe(
      catchError((error) => {
        this.errorHandler.logError(error, `POST ${endpoint}`);
        return throwError(() => this.errorHandler.handleError(error));
      })
    );
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.config.baseUrl}${endpoint}`, body).pipe(
      catchError((error) => {
        this.errorHandler.logError(error, `PUT ${endpoint}`);
        return throwError(() => this.errorHandler.handleError(error));
      })
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.config.baseUrl}${endpoint}`).pipe(
      catchError((error) => {
        this.errorHandler.logError(error, `DELETE ${endpoint}`);
        return throwError(() => this.errorHandler.handleError(error));
      })
    );
  }

  postMultipart<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.config.baseUrl}${endpoint}`, formData).pipe(
      catchError((error) => {
        this.errorHandler.logError(error, `POST ${endpoint} (multipart)`);
        return throwError(() => this.errorHandler.handleError(error));
      })
    );
  }
}
