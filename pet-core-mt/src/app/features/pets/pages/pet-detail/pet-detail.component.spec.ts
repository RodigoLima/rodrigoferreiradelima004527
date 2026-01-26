import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { TutoresApiService } from '../../../tutores/services/tutores-api.service';
import { PetDetailComponent } from './pet-detail.component';
import { ConfirmationService, MessageService } from 'primeng/api';

describe('PetDetailComponent', () => {
  it('deve criar e chamar fetchPetDetail quando houver id na rota', async () => {
    const fetchPetDetail = vi.fn(() =>
      of({ id: 1, nome: 'Rex', raca: 'Vira-lata', idade: 2, foto: null, tutores: [] })
    );

    await TestBed.configureTestingModule({
      imports: [PetDetailComponent],
      providers: [
        provideNoopAnimations(),
        ConfirmationService,
        MessageService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        {
          provide: PetsFacade,
          useValue: {
            petDetail$: of(null),
            petDetailLoading$: of(false),
            petDetailError$: of(null),
            fetchPetDetail,
            deletePet: vi.fn(),
            deletePetPhoto: vi.fn(() => of(void 0))
          }
        },
        { provide: TutoresApiService, useValue: { getTutorById: vi.fn(() => of(null)) } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PetDetailComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fetchPetDetail).toHaveBeenCalledWith(1);
  });
});

