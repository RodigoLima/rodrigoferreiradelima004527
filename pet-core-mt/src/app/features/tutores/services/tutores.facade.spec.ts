import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TutoresApiService } from './tutores-api.service';
import { TutoresFacade } from './tutores.facade';

describe('TutoresFacade', () => {
  it('fetchTutores deve carregar e atualizar estado de paginação', async () => {
    const getTutores = vi.fn(() =>
      of({
        page: 0,
        size: 10,
        total: 1,
        pageCount: 1,
        content: [{ id: 10, nome: 'Ana', telefone: '1', email: 'a@a.com', endereco: 'Rua', cpf: 1, foto: null }]
      })
    );

    TestBed.configureTestingModule({
      providers: [TutoresFacade, { provide: TutoresApiService, useValue: { getTutores } }]
    });

    const facade = TestBed.inject(TutoresFacade);
    facade.fetchTutores({ page: 0, size: 10 });

    await expect(firstValueFrom(facade.tutores$.pipe(filter(list => list.length > 0)))).resolves.toHaveLength(1);
    await expect(firstValueFrom(facade.total$)).resolves.toBe(1);
    await expect(firstValueFrom(facade.pageCount$)).resolves.toBe(1);
    await expect(firstValueFrom(facade.currentPage$)).resolves.toBe(0);
  });

  it('searchByName deve chamar API com nome trimado e page 0', () => {
    const getTutores = vi.fn(() =>
      of({
        page: 0,
        size: 10,
        total: 0,
        pageCount: 0,
        content: []
      })
    );

    TestBed.configureTestingModule({
      providers: [TutoresFacade, { provide: TutoresApiService, useValue: { getTutores } }]
    });

    const facade = TestBed.inject(TutoresFacade);
    facade.searchByName('  Ana  ');

    expect(getTutores).toHaveBeenCalledTimes(1);
    expect(getTutores).toHaveBeenCalledWith({ nome: 'Ana', page: 0, size: 10 });
  });

  it('deleteTutor deve chamar API e recarregar lista', async () => {
    const getTutores = vi.fn(() =>
      of({
        page: 0,
        size: 10,
        total: 0,
        pageCount: 0,
        content: []
      })
    );
    const deleteTutor = vi.fn(() => of(void 0));

    TestBed.configureTestingModule({
      providers: [
        TutoresFacade,
        {
          provide: TutoresApiService,
          useValue: {
            getTutores,
            deleteTutor,
            getTutorById: vi.fn(),
            createTutor: vi.fn(),
            updateTutor: vi.fn(),
            uploadTutorPhoto: vi.fn(),
            deleteTutorPhoto: vi.fn(),
            linkPet: vi.fn(),
            unlinkPet: vi.fn()
          }
        }
      ]
    });

    const facade = TestBed.inject(TutoresFacade);
    facade.fetchTutores({ page: 0, size: 10 });

    await expect(firstValueFrom(facade.deleteTutor(10))).resolves.toBeUndefined();
    expect(deleteTutor).toHaveBeenCalledWith(10);
    expect(getTutores).toHaveBeenCalledTimes(2);
  });
});

