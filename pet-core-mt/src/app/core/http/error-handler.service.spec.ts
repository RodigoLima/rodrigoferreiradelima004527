import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api.config';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:8080/api' } }
      ]
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar mensagem de comunicação para erro do cliente', () => {
    const service = TestBed.inject(ErrorHandlerService);
    const error = new HttpErrorResponse({
      error: new ErrorEvent('error', { message: 'Falha' }),
      status: 0,
      statusText: '',
      url: 'http://x'
    });

    expect(service.handleError(error)).toBe('Erro de comunicação. Verifique sua conexão.');
  });

  it('deve retornar mensagem do backend para 400 quando existir', () => {
    const service = TestBed.inject(ErrorHandlerService);
    const error = new HttpErrorResponse({
      error: { message: 'Dados inválidos' },
      status: 400,
      statusText: 'Bad Request',
      url: 'http://x'
    });

    expect(service.handleError(error)).toBe('Dados inválidos');
  });

  it('deve retornar mensagem de indisponibilidade para status 0', () => {
    const service = TestBed.inject(ErrorHandlerService);
    const error = new HttpErrorResponse({
      error: {},
      status: 0,
      statusText: '',
      url: 'http://x'
    });

    expect(service.handleError(error)).toContain('Não foi possível conectar na API');
  });

  it('logError deve registrar no console', () => {
    const service = TestBed.inject(ErrorHandlerService);
    const error = new HttpErrorResponse({
      error: { message: 'X' },
      status: 500,
      statusText: 'Internal Server Error',
      url: 'http://x'
    });

    service.logError(error, 'Teste');
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

