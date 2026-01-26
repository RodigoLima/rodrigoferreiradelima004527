import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpHelperService } from '../../../core/http/http-helper.service';
import { TutoresApiService } from './tutores-api.service';

describe('TutoresApiService', () => {
  it('getTutores deve montar params e chamar HttpHelperService.get', () => {
    const get = vi.fn(() => of({ page: 0, size: 10, total: 0, pageCount: 0, content: [] }));

    TestBed.configureTestingModule({
      providers: [TutoresApiService, { provide: HttpHelperService, useValue: { get } }]
    });

    const service = TestBed.inject(TutoresApiService);
    service.getTutores({ nome: 'Ana', page: 1, size: 20 }).subscribe();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/v1/tutores', { nome: 'Ana', page: 1, size: 20 });
  });

  it('linkPet deve chamar POST com body vazio', async () => {
    const post = vi.fn(() => of(void 0));

    TestBed.configureTestingModule({
      providers: [TutoresApiService, { provide: HttpHelperService, useValue: { post } }]
    });

    const service = TestBed.inject(TutoresApiService);
    await new Promise<void>((resolve, reject) => {
      service.linkPet(10, 2).subscribe({
        next: () => resolve(),
        error: reject
      });
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/v1/tutores/10/pets/2', {});
  });

  it('uploadTutorPhoto deve enviar FormData com arquivo', async () => {
    const postMultipart = vi.fn((_url: string, _formData: FormData) =>
      of({ id: 1, nome: 'foto.png', contentType: 'image/png', url: 'http://img' })
    );

    TestBed.configureTestingModule({
      providers: [TutoresApiService, { provide: HttpHelperService, useValue: { postMultipart } }]
    });

    const service = TestBed.inject(TutoresApiService);
    const file = new File(['x'], 'foto.png', { type: 'image/png' });

    await new Promise<void>((resolve, reject) => {
      service.uploadTutorPhoto(9, file).subscribe({
        next: () => resolve(),
        error: reject
      });
    });

    expect(postMultipart).toHaveBeenCalledTimes(1);
    const [url, formData] = postMultipart.mock.calls[0] as [string, FormData];
    expect(url).toBe('/v1/tutores/9/fotos');
    expect(formData).toBeInstanceOf(FormData);
    const sent = formData.get('foto');
    expect(sent).toBeInstanceOf(File);
    expect((sent as File).name).toBe('foto.png');
  });
});

