import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TutoresFacade } from '../../services/tutores.facade';
import { TutorDetailComponent } from './tutor-detail.component';

describe('TutorDetailComponent', () => {
  it('deve criar e carregar dados quando houver id na rota', async () => {
    const fetchTutorDetail = vi.fn(() => of({ id: 10, nome: 'Ana', pets: [] }));

    await TestBed.configureTestingModule({
      imports: [TutorDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '10' } } } },
        { provide: TutoresFacade, useValue: { fetchTutorDetail, deleteTutor: vi.fn() } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TutorDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(fetchTutorDetail).toHaveBeenCalledWith(10);
    expect(component.tutor()?.nome).toBe('Ana');
  });
});

