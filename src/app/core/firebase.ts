import { InjectionToken } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import type { Auth } from 'firebase/auth';
import type { Database } from 'firebase/database';
import { environment } from '../../environments/environment';

const app = initializeApp(environment.firebase);

export const FIREBASE_DB = new InjectionToken<Database>('FIREBASE_DB', {
  factory: () => getDatabase(app),
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  factory: () => getAuth(app),
});
