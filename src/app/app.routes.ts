import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/timeline-page.component').then((module) => module.TimelinePageComponent),
		data: { titleKey: 'timeline.pageTitle' },
	},
	{
		path: 'oxytocin',
		loadComponent: () => import('./pages/oxytocin-home-page.component').then((module) => module.OxytocinHomePageComponent),
		data: { titleKey: 'oxytocin.pageTitle' },
	},
	{
		path: 'oxytocin/:id',
		loadComponent: () => import('./pages/oxytocin-list-page.component').then((module) => module.OxytocinListPageComponent),
		data: { titleKey: 'oxytocin.list.pageTitle' },
	},
	{
		path: '**',
		redirectTo: '',
	},
];
