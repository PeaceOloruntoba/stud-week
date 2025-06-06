import { Routes } from '@angular/router';
import { AuthGuard } from './modules/auth/guards/auth.guard';
// import { DashboardComponent } from './modules/user/components/dashboard/dashboard.component'; // Remove direct imports of components
// import { ProfileComponent } from './modules/user/components/profile/profile.component'; // Remove direct imports

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/user/user.module').then((m) => m.UserModule),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./modules/admin/admin.module').then((m) => m.AdminModule),
  },
  { path: '**', redirectTo: '/login' },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./components/unauthorised/unauthorised.component').then(
        (m) => m.UnauthorisedComponent
      ),
  },
];
