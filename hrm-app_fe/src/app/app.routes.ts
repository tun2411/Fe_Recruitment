import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'create-post',
    loadComponent: () =>
      import('./pages/create-post/create-post.page').then((m) => m.CreatePostPage),
  },
  {
    path: 'select-rounds',
    loadComponent: () =>
      import('./pages/select-rounds/select-rounds.page').then((m) => m.SelectRoundsPage),
  },
  {
    path: 'configure-rounds',
    loadComponent: () =>
      import('./pages/configure-rounds/configure-rounds.page').then((m) => m.ConfigureRoundsPage),
  },
  {
    path: 'candidates',
    loadComponent: () =>
      import('./pages/candidates/candidates.page').then((m) => m.CandidatesPage),
  },
  {
    path: 'edit-post/:id',
    loadComponent: () =>
      import('./pages/edit-post/edit-post.page').then((m) => m.EditPostPage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'personal-info',
    loadComponent: () =>
      import('./pages/personal-info/personal-info.page').then((m) => m.PersonalInfoPage),
  },
  {
    path: 'email-templates',
    loadComponent: () =>
      import('./pages/email-templates/email-templates.page').then((m) => m.EmailTemplatesPage),
  },
  {
    path: 'template-editor',
    loadComponent: () =>
      import('./pages/template-editor/template-editor.page').then((m) => m.TemplateEditorPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
