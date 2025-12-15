import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/main-shell/main-shell.component').then(
        (m) => m.MainShellComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'email-management',
        loadComponent: () =>
          import('./pages/email-management/email-management.page').then(
            (m) => m.EmailManagementPage
          ),
      },
      {
        path: 'personal-info',
        loadComponent: () =>
          import('./pages/personal-info/personal-info.page').then(
            (m) => m.PersonalInfoPage
          ),
      },
      {
        path: 'create-post',
        loadComponent: () =>
          import('./pages/create-post/create-post.page').then(
            (m) => m.CreatePostPage
          ),
      },
      {
        path: 'select-rounds',
        loadComponent: () =>
          import('./pages/select-rounds/select-rounds.page').then(
            (m) => m.SelectRoundsPage
          ),
      },
      {
        path: 'configure-rounds',
        loadComponent: () =>
          import('./pages/configure-rounds/configure-rounds.page').then(
            (m) => m.ConfigureRoundsPage
          ),
      },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./pages/candidates/candidates.page').then(
            (m) => m.CandidatesPage
          ),
      },
      {
        path: 'application-detail/:applicationId',
        loadComponent: () =>
          import('./pages/application-detail/application-detail.page').then(
            (m) => m.ApplicationDetailPage
          ),
      },
      {
        path: 'job-detail/:id',
        loadComponent: () =>
          import('./pages/job-detail/job-detail.page').then(
            (m) => m.JobDetailPage
          ),
      },
      {
        path: 'edit-post/:id',
        loadComponent: () =>
          import('./pages/edit-post/edit-post.page').then(
            (m) => m.EditPostPage
          ),
      },
      {
        path: 'email-templates',
        loadComponent: () =>
          import('./pages/email-templates/email-templates.page').then(
            (m) => m.EmailTemplatesPage
          ),
      },
      {
        path: 'template-editor',
        loadComponent: () =>
          import('./pages/template-editor/template-editor.page').then(
            (m) => m.TemplateEditorPage
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.page').then(
            (m) => m.NotificationsPage
          ),
      },
      {
        path: 'confirm-email',
        loadComponent: () =>
          import('./pages/confirm-email/confirm-email.page').then(
            (m) => m.ConfirmEmailPage
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
