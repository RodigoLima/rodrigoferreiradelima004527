import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TutoresFacade } from '../../services/tutores.facade';
import { ListTutoresComponent } from './list-tutores.component';

describe('ListTutoresComponent', () => {
  it('deve criar e chamar fetchTutores com query params', async () => {
    const fetchTutores = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ListTutoresComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { nome: 'Ana', page: '1' } } } },
        {
          provide: TutoresFacade,
          useValue: {
            tutores$: of([]),
            loading$: of(false),
            error$: of(null),
            pageCount$: of(0),
            currentPage$: of(0),
            total$: of(0),
            fetchTutores,
            searchByName: vi.fn(),
            goToPage: vi.fn(),
            deleteTutor: vi.fn()
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ListTutoresComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fetchTutores).toHaveBeenCalledWith({ nome: 'Ana', page: 1, size: 10 });
  });
});

