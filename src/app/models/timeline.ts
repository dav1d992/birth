export interface TimelinePhase {
  id: string;
  titleKey: string;
  locationKey?: string;
  happeningKey: string;
  firstTimeKey?: string;
  birthingPersonKey: string;
  partnerKey: string;
  callWardKey?: string;
  callFirstKey?: string;
  callAgainKey?: string;
  redFlagsKey?: string;
}

export interface TimelineBlock {
  titleKey: string;
  bodyKey: string;
}

export const PREGNANCY_OVERVIEW: ReadonlyArray<TimelineBlock> = [
  { titleKey: 'timeline.trimester1.title', bodyKey: 'timeline.trimester1.body' },
  { titleKey: 'timeline.trimester2.title', bodyKey: 'timeline.trimester2.body' },
  { titleKey: 'timeline.trimester3.title', bodyKey: 'timeline.trimester3.body' },
  { titleKey: 'timeline.term.title', bodyKey: 'timeline.term.body' },
];

export const BIRTH_PHASES: ReadonlyArray<TimelinePhase> = [
  {
    id: 'near-labour',
    titleKey: 'timeline.phase.nearLabour.title',
    locationKey: 'timeline.location.home',
    happeningKey: 'timeline.phase.nearLabour.happening',
    birthingPersonKey: 'timeline.phase.nearLabour.birthingPerson',
    partnerKey: 'timeline.phase.nearLabour.partner',
    callWardKey: 'timeline.phase.nearLabour.callWard',
    redFlagsKey: 'timeline.phase.nearLabour.redFlags',
  },
  {
    id: 'latent',
    titleKey: 'timeline.phase.latent.title',
    locationKey: 'timeline.location.home',
    happeningKey: 'timeline.phase.latent.happening',
    birthingPersonKey: 'timeline.phase.latent.birthingPerson',
    partnerKey: 'timeline.phase.latent.partner',
    callWardKey: 'timeline.phase.latent.callWard',
    callFirstKey: 'timeline.phase.latent.callFirst',
    callAgainKey: 'timeline.phase.latent.callAgain',
    redFlagsKey: 'timeline.phase.latent.redFlags',
  },
  {
    id: 'active',
    titleKey: 'timeline.phase.active.title',
    locationKey: 'timeline.location.hospital',
    happeningKey: 'timeline.phase.active.happening',
    firstTimeKey: 'timeline.phase.active.firstTime',
    birthingPersonKey: 'timeline.phase.active.birthingPerson',
    partnerKey: 'timeline.phase.active.partner',
    redFlagsKey: 'timeline.phase.active.redFlags',
  },
  {
    id: 'transition',
    titleKey: 'timeline.phase.transition.title',
    locationKey: 'timeline.location.hospital',
    happeningKey: 'timeline.phase.transition.happening',
    birthingPersonKey: 'timeline.phase.transition.birthingPerson',
    partnerKey: 'timeline.phase.transition.partner',
    redFlagsKey: 'timeline.phase.transition.redFlags',
  },
  {
    id: 'pushing',
    titleKey: 'timeline.phase.pushing.title',
    locationKey: 'timeline.location.hospital',
    happeningKey: 'timeline.phase.pushing.happening',
    firstTimeKey: 'timeline.phase.pushing.firstTime',
    birthingPersonKey: 'timeline.phase.pushing.birthingPerson',
    partnerKey: 'timeline.phase.pushing.partner',
  },
  {
    id: 'placenta',
    titleKey: 'timeline.phase.placenta.title',
    locationKey: 'timeline.location.hospital',
    happeningKey: 'timeline.phase.placenta.happening',
    birthingPersonKey: 'timeline.phase.placenta.birthingPerson',
    partnerKey: 'timeline.phase.placenta.partner',
  },
  {
    id: 'golden-hour',
    titleKey: 'timeline.phase.goldenHour.title',
    locationKey: 'timeline.location.hospital',
    happeningKey: 'timeline.phase.goldenHour.happening',
    birthingPersonKey: 'timeline.phase.goldenHour.birthingPerson',
    partnerKey: 'timeline.phase.goldenHour.partner',
  },
  {
    id: 'first-days',
    titleKey: 'timeline.phase.firstDays.title',
    locationKey: 'timeline.location.home',
    happeningKey: 'timeline.phase.firstDays.happening',
    birthingPersonKey: 'timeline.phase.firstDays.birthingPerson',
    partnerKey: 'timeline.phase.firstDays.partner',
    callWardKey: 'timeline.phase.firstDays.callWard',
    redFlagsKey: 'timeline.phase.firstDays.redFlags',
  },
];
