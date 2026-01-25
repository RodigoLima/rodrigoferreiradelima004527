import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { API_CONFIG, ApiConfig } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private config = inject(API_CONFIG);

  handleError(error: HttpErrorResponse): string {
    let message = 'Ocorreu um erro inesperado. Tente novamente.';

    if (error.error instanceof ErrorEvent) {
      console.error('Erro do cliente:', error.error.message);
      message = 'Erro de comunicação. Verifique sua conexão.';
    } else {
      console.error(`Erro do servidor [${error.status}]:`, error.error);

      switch (error.status) {
        case 0:
          message = 'Não foi possível conectar na API. Verifique se ela está rodando e se a URL está correta.';
          break;
        case 400:
          message = error.error?.message || 'Dados inválidos. Verifique as informações.';
          break;
        case 401:
          message = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          message = 'Acesso negado.';
          break;
        case 404:
          message = 'Recurso não encontrado.';
          break;
        case 422:
          message = error.error?.message || 'Dados inválidos. Verifique as informações.';
          break;
        case 500:
          message = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        default:
          message = error.error?.message || `Erro ${error.status}. Tente novamente.`;
      }
    }

    return message;
  }

  logError(error: HttpErrorResponse, context?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = context
      ? `[${timestamp}] [${context}] Erro HTTP ${error.status}: ${error.message}`
      : `[${timestamp}] Erro HTTP ${error.status}: ${error.message}`;

    console.error(logMessage, {
      url: error.url,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    });
  }
}
