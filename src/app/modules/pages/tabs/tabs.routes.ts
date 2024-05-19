import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'board',
        loadComponent: () => import('../dashboard/board/board.page').then((m) => m.BoardPage),
      },
      {
        path: 'backlog',
        loadComponent: () => import('../dashboard/backlog/backlog.page').then((m) => m.BacklogPage),
      },
      {
        path: 'projects',
        loadComponent: () => import('../dashboard/projects/projects.page').then((m) => m.ProjectsPage),
      },
      {
        path: 'item',
        redirectTo: 'board',
      },
      {
        path: 'item/:id',
        loadComponent: () => import('../dashboard/item/item.page').then((m) => m.ItemPage),
      },
      {
        path: 'docs',
        loadComponent: () => import('../dashboard/docs/docs.page').then((m) => m.DocsPage),
      },
      {
        path: 'docs/:path',
        loadComponent: () => import('../dashboard/docs/docs.page').then((m) => m.DocsPage),
        children: [{
          path: '**',
          loadComponent: () => import('../dashboard/docs/docs.page').then((m) => m.DocsPage),
        }]
      },
      {
        path: 'pages',
        loadComponent: () => import('../dashboard/docs/docs.page').then((m) => m.DocsPage),
      },
      {
        path: 'pages/:docId',
        loadComponent: () => import('../dashboard/docs/pages/pages.page').then((m) => m.PagesPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('../dashboard/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'organization',
        loadComponent: () => import('../dashboard/organization/organization.page').then((m) => m.OrganizationPage),
      },
      {
        path: 'more',
        loadComponent: () => import('../dashboard/more/more.page').then((m) => m.MorePage),
      },
      {
        path: 'sprint-planner',
        loadComponent: () => import('../dashboard/sprint-planner/sprint-planner.page').then((m) => m.SprintPlannerPage),
      },
      {
        path: 'project-settings',
        loadComponent: () => import('../dashboard/project-settings/project-settings.page').then((m) => m.ProjectSettingsPage),
      },
      {
        path: 'manage-members',
        loadComponent: () => import('../dashboard/manage-members/manage-members.page').then((m) => m.ManageMembersPage),
      },
      {
        path: 'logs',
        loadComponent: () => import('../dashboard/logs/logs.page').then((m) => m.LogsPage),
      },
      {
        path: 'charts',
        loadComponent: () => import('../dashboard/charts/charts.page').then((m) => m.ChartsPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'board',
    pathMatch: 'full',
  },
];
