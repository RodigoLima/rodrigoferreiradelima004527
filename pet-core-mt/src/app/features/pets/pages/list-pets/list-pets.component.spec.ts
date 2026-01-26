import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { ListPetsComponent } from './list-pets.component';

describe('ListPetsComponent', () => {
  it('deve criar e chamar fetchPets com query params', async () => {
    const fetchPets = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ListPetsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { nome: 'Rex', page: '2' } } } },
        {
          provide: PetsFacade,
          useValue: {
            pets$: of([]),
            loading$: of(false),
            error$: of(null),
            pageCount$: of(0),
            currentPage$: of(0),
            total$: of(0),
            fetchPets,
            searchByName: vi.fn(),
            goToPage: vi.fn(),
            deletePet: vi.fn()
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ListPetsComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fetchPets).toHaveBeenCalledWith({ nome: 'Rex', page: 2, size: 10 });
  });
});

