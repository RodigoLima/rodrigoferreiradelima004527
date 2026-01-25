import { Routes } from '@angular/router';
import { ListTutoresComponent } from './pages/list-tutores/list-tutores.component';
import { TutorFormComponent } from './pages/tutor-form/tutor-form.component';
import { TutorDetailComponent } from './pages/tutor-detail/tutor-detail.component';
import { authGuard } from '../../core/auth/auth.guard';

export const tutoresRoutes: Routes = [
  {
    path: '',
    component: ListTutoresComponent,
    canActivate: [authGuard]
  },
  {
    path: 'novo',
    component: TutorFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'editar/:id',
    component: TutorFormComponent,
    canActivate: [authGuard]
  },
  {
    path: ':id',
    component: TutorDetailComponent,
    canActivate: [authGuard]
  }
];
