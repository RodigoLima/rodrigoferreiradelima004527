import { Routes } from '@angular/router';
import { ListPetsComponent } from './pages/list-pets/list-pets.component';
import { PetDetailComponent } from './pages/pet-detail/pet-detail.component';
import { authGuard } from '../../core/auth/auth.guard';

export const petsRoutes: Routes = [
  {
    path: '',
    component: ListPetsComponent,
    canActivate: [authGuard]
  },
  {
    path: ':id',
    component: PetDetailComponent,
    canActivate: [authGuard]
  }
];
