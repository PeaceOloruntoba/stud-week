import { Routes } from '@angular/router';
import { AuthGuard } from './modules/auth/guards/auth.guard';
// import { DashboardComponent } from './modules/user/components/dashboard/dashboard.component'; // Remove direct imports of components
// import { ProfileComponent } from './modules/user/components/profile/profile.component'; // Remove direct imports

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./modules/users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'company',
    loadChildren: () =>
      import('./modules/company/company.module').then((m) => m.CompanyModule),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./modules/admin/admin.module').then((m) => m.AdminModule),
  },
  { path: '**', redirectTo: '/auth/login' },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./components/unauthorised/unauthorised.component').then(
        (m) => m.UnauthorisedComponent
      ),
  },
];
