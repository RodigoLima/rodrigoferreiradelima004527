import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpHelperService } from '../../../core/http/http-helper.service';
import { PetsApiService } from './pets-api.service';

describe('PetsApiService', () => {
  it('getPets deve montar params e chamar HttpHelperService.get', () => {
    const get = vi.fn(() => of({ page: 0, size: 10, total: 0, pageCount: 0, content: [] }));

    TestBed.configureTestingModule({
      providers: [PetsApiService, { provide: HttpHelperService, useValue: { get } }]
    });

    const service = TestBed.inject(PetsApiService);
    service.getPets({ nome: 'Rex', raca: 'Poodle', page: 2, size: 20 }).subscribe();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/v1/pets', { nome: 'Rex', raca: 'Poodle', page: 2, size: 20 });
  });

  it('uploadPetPhoto deve enviar FormData com arquivo', async () => {
    const postMultipart = vi.fn((_url: string, _formData: FormData) =>
      of({ id: 1, nome: 'foto.png', contentType: 'image/png', url: 'http://img' })
    );

    TestBed.configureTestingModule({
      providers: [PetsApiService, { provide: HttpHelperService, useValue: { postMultipart } }]
    });

    const service = TestBed.inject(PetsApiService);
    const file = new File(['x'], 'foto.png', { type: 'image/png' });

    await new Promise<void>((resolve, reject) => {
      service.uploadPetPhoto(9, file).subscribe({
        next: () => resolve(),
        error: reject
      });
    });

    expect(postMultipart).toHaveBeenCalledTimes(1);
    const [url, formData] = postMultipart.mock.calls[0] as [string, FormData];
    expect(url).toBe('/v1/pets/9/fotos');
    expect(formData).toBeInstanceOf(FormData);
    const sent = formData.get('foto');
    expect(sent).toBeInstanceOf(File);
    expect((sent as File).name).toBe('foto.png');
  });
});

