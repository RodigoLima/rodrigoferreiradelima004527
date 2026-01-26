import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/pets',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'pets',
    loadChildren: () => import('./features/pets/pets.routes').then(m => m.petsRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'tutores',
    loadChildren: () => import('./features/tutores/tutores.routes').then(m => m.tutoresRoutes),
    canActivate: [authGuard]
  }
];
