import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PetsFacade } from '../../../pets/services/pets.facade';
import { TutoresFacade } from '../../services/tutores.facade';
import { TutorFormComponent } from './tutor-form.component';
import { ConfirmationService, MessageService } from 'primeng/api';

describe('TutorFormComponent', () => {
  it('deve criar em modo novo quando não houver id', async () => {
    const fetchTutorDetail = vi.fn();

    await TestBed.configureTestingModule({
      imports: [TutorFormComponent],
      providers: [
        provideNoopAnimations(),
        ConfirmationService,
        MessageService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: TutoresFacade, useValue: { fetchTutorDetail, createTutor: vi.fn(), updateTutor: vi.fn(), uploadTutorPhoto: vi.fn(), linkPet: vi.fn(), unlinkPet: vi.fn() } },
        { provide: PetsFacade, useValue: { pets$: of([]), loading$: of(false), fetchPets: vi.fn(), searchByName: vi.fn() } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TutorFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fetchTutorDetail).not.toHaveBeenCalled();
  });

  it('deve carregar dados quando houver id na rota', async () => {
    const fetchTutorDetail = vi.fn(() =>
      of({
        id: 10,
        nome: 'Ana',
        telefone: '65999990000',
        email: 'ana@email.com',
        endereco: 'Rua 1',
        cpf: 12345678901,
        foto: { id: 1, nome: 'x', contentType: 'image/png', url: 'http://img' },
        pets: []
      })
    );

    await TestBed.configureTestingModule({
      imports: [TutorFormComponent],
      providers: [
        provideNoopAnimations(),
        ConfirmationService,
        MessageService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '10' } } } },
        { provide: TutoresFacade, useValue: { fetchTutorDetail, createTutor: vi.fn(), updateTutor: vi.fn(), uploadTutorPhoto: vi.fn(), linkPet: vi.fn(), unlinkPet: vi.fn() } },
        { provide: PetsFacade, useValue: { pets$: of([]), loading$: of(false), fetchPets: vi.fn(), searchByName: vi.fn() } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TutorFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(fetchTutorDetail).toHaveBeenCalledWith(10);
    expect(component.tutorForm.value.nome).toBe('Ana');
    expect(component.tutorForm.value.telefone).toBe('65999990000');
    expect(component.tutorForm.value.email).toBe('ana@email.com');
    expect(component.tutorForm.value.endereco).toBe('Rua 1');
    expect(component.tutorForm.value.cpf).toBe('123.456.789-01');
    expect(component.previewUrl()).toBe('http://img');
  });
});

