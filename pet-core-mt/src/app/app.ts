import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map, startWith } from 'rxjs';
import { AuthFacade } from './core/auth/auth.facade';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, ConfirmDialogModule, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);
  authFacade = inject(AuthFacade);
  isLoginRoute$ = this.router.events.pipe(
    startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    map(() => this.router.url.startsWith('/login'))
  );

  logout(): void {
    this.authFacade.logout();
  }
}
