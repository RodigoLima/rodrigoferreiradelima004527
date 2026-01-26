import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PetsApiService } from './pets-api.service';
import { PetsFacade } from './pets.facade';

describe('PetsFacade', () => {
  it('fetchPets deve carregar e atualizar estado de paginação', async () => {
    const getPets = vi.fn(() =>
      of({
        page: 0,
        size: 10,
        total: 1,
        pageCount: 1,
        content: [{ id: 1, nome: 'Rex', raca: 'Vira-lata', idade: 2, foto: null }]
      })
    );

    TestBed.configureTestingModule({
      providers: [PetsFacade, { provide: PetsApiService, useValue: { getPets } }]
    });

    const facade = TestBed.inject(PetsFacade);
    facade.fetchPets({ page: 0, size: 10 });

    await expect(firstValueFrom(facade.pets$.pipe(filter(pets => pets.length > 0)))).resolves.toEqual([
      { id: 1, nome: 'Rex', raca: 'Vira-lata', idade: 2, foto: null }
    ]);

    await expect(firstValueFrom(facade.total$)).resolves.toBe(1);
    await expect(firstValueFrom(facade.pageCount$)).resolves.toBe(1);
    await expect(firstValueFrom(facade.currentPage$)).resolves.toBe(0);
  });

  it('searchByName deve chamar API com nome trimado e page 0', () => {
    const getPets = vi.fn(() =>
      of({
        page: 0,
        size: 10,
        total: 0,
        pageCount: 0,
        content: []
      })
    );

    TestBed.configureTestingModule({
      providers: [PetsFacade, { provide: PetsApiService, useValue: { getPets } }]
    });

    const facade = TestBed.inject(PetsFacade);
    facade.searchByName('  Rex  ');

    expect(getPets).toHaveBeenCalledTimes(1);
    expect(getPets).toHaveBeenCalledWith({ nome: 'Rex', page: 0, size: 10 });
  });
});

