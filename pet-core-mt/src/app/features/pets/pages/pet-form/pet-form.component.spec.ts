import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { PetFormComponent } from './pet-form.component';

describe('PetFormComponent', () => {
  it('deve criar em modo novo quando não houver id', async () => {
    const fetchPetDetail = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PetFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: PetsFacade, useValue: { fetchPetDetail, createPet: vi.fn(), updatePet: vi.fn(), uploadPetPhoto: vi.fn() } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PetFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fetchPetDetail).not.toHaveBeenCalled();
  });

  it('deve carregar dados quando houver id na rota', async () => {
    const fetchPetDetail = vi.fn(() =>
      of({ id: 1, nome: 'Rex', raca: 'Vira-lata', idade: 2, foto: { id: 1, nome: 'x', contentType: 'image/png', url: 'http://img' }, tutores: [] })
    );

    await TestBed.configureTestingModule({
      imports: [PetFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: PetsFacade, useValue: { fetchPetDetail, createPet: vi.fn(), updatePet: vi.fn(), uploadPetPhoto: vi.fn() } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PetFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(fetchPetDetail).toHaveBeenCalledWith(1);
    expect(component.petForm.value.nome).toBe('Rex');
    expect(component.petForm.value.raca).toBe('Vira-lata');
    expect(component.petForm.value.idade).toBe(2);
    expect(component.previewUrl()).toBe('http://img');
  });
});

