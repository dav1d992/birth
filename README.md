# Birth

Angular 22 + Firebase Realtime Database web app for birth guidance and encrypted oxytocin lists.

## Stack
- Angular standalone components with signals and zone.js
- Firebase modular SDK (Auth + Realtime Database)
- SCSS
- GitHub Actions FTP deploy to Hostinger

## Routes
- / timeline
- /oxytocin create/open encrypted lists
- /oxytocin/:id unlock/edit a list
- /admin admin login and list deletion

## Local setup
1. pnpm install
2. Fill Firebase web config in src/environments/environment.ts
3. Set Firebase project id in .firebaserc
4. In Firebase console create secrets/adminCode in Realtime Database
5. pnpm start

## Build
- pnpm run build
- Output is in dist/birth with index.html at dist/birth/index.html

## Firebase rules
- Rules file: database.rules.json
- Deploy rules manually from a trusted local machine:
  npx firebase deploy --only database

## Hostinger deployment
- Workflow file: .github/workflows/ci-cd.yml
- Requires secrets: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT
- FTP user root must be the exact dist folder target.
