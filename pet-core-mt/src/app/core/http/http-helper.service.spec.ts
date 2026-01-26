import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ErrorHandlerService } from './error-handler.service';
import { HttpHelperService } from './http-helper.service';

describe('HttpHelperService', () => {
  it('deve montar URL e params corretamente no GET', async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpHelperService,
        { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:8080/api' } },
        { provide: ErrorHandlerService, useValue: { handleError: vi.fn(), logError: vi.fn() } }
      ]
    });

    const service = TestBed.inject(HttpHelperService);
    const httpMock = TestBed.inject(HttpTestingController);

    const resultPromise = firstValueFrom(service.get('/v1/pets', { nome: 'Rex', page: 1, size: 10 }));

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === 'http://localhost:8080/api/v1/pets');
    expect(req.request.params.get('nome')).toBe('Rex');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ ok: true });

    await expect(resultPromise).resolves.toEqual({ ok: true });
    httpMock.verify();
  });

  it('deve propagar mensagem tratada em caso de erro', async () => {
    const handleError = vi.fn(() => 'Falha ao chamar API');
    const logError = vi.fn();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpHelperService,
        { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:8080/api' } },
        { provide: ErrorHandlerService, useValue: { handleError, logError } }
      ]
    });

    const service = TestBed.inject(HttpHelperService);
    const httpMock = TestBed.inject(HttpTestingController);

    const resultPromise = firstValueFrom(service.get('/v1/pets'));

    const req = httpMock.expectOne('http://localhost:8080/api/v1/pets');
    req.flush({ message: 'erro' }, { status: 500, statusText: 'Internal Server Error' });

    await expect(resultPromise).rejects.toBe('Falha ao chamar API');
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledTimes(1);
    httpMock.verify();
  });
});

