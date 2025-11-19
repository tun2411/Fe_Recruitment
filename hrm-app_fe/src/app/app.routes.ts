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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
