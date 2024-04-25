import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./modules/pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/pages/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register-user',
    loadComponent: () => import('./modules/pages/auth/register-user/register-user.page').then( m => m.RegisterUserPage)
  },
  {
    path: 'register-organization',
    loadComponent: () => import('./modules/pages/auth/register-organization/register-organization.page').then( m => m.RegisterOrganizationPage)
  },
  {
    path: 'app',
    loadChildren: () => import('./modules/pages/tabs/tabs.routes').then((m) => m.routes),
  },
];
