import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth.facade';
import { LoginComponent } from './login.component';
import { MessageService } from 'primeng/api';

describe('LoginComponent', () => {
  it('deve navegar para returnUrl após login', async () => {
    const navigate = vi.fn();
    const login = vi.fn(() => of(true));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        MessageService,
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { returnUrl: '/pets' } } } },
        { provide: AuthFacade, useValue: { login } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.loginForm.setValue({ username: 'admin', password: '123' });
    component.onSubmit();

    await fixture.whenStable();

    expect(login).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/pets']);
  });

  it('não deve chamar login se formulário inválido', async () => {
    const navigate = vi.fn();
    const login = vi.fn(() => of(true));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        MessageService,
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        { provide: AuthFacade, useValue: { login } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onSubmit();

    expect(login).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});

