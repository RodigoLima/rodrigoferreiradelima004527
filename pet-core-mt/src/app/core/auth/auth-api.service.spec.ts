import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpHelperService } from '../http/http-helper.service';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  it('refreshToken deve enviar refresh no header Authorization', async () => {
    const put = vi.fn(() => of({ access_token: 'a', refresh_token: 'r', expires_in: 10, refresh_expires_in: 20 }));

    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        {
          provide: HttpHelperService,
          useValue: {
            post: vi.fn(),
            put
          }
        }
      ]
    });

    const service = TestBed.inject(AuthApiService);
    await new Promise<void>((resolve, reject) => {
      service.refreshToken('refresh-123').subscribe({
        next: () => resolve(),
        error: reject
      });
    });

    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith('/autenticacao/refresh', null, { Authorization: 'Bearer refresh-123' });
  });
});

