export interface TimelinePhase {
  id: string;
  titleKey: string;
  happeningKey: string;
  breathingKey?: string;
  painReliefKey?: string;
  firstTimeKey?: string;
  birthingPersonKey: string;
  partnerKey: string;
  callWardKey: string;
  redFlagsKey: string;
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
    happeningKey: 'timeline.phase.nearLabour.happening',
    breathingKey: 'timeline.phase.nearLabour.breathing',
    birthingPersonKey: 'timeline.phase.nearLabour.birthingPerson',
    partnerKey: 'timeline.phase.nearLabour.partner',
    callWardKey: 'timeline.phase.nearLabour.callWard',
    redFlagsKey: 'timeline.phase.nearLabour.redFlags',
  },
  {
    id: 'latent',
    titleKey: 'timeline.phase.latent.title',
    happeningKey: 'timeline.phase.latent.happening',
    breathingKey: 'timeline.phase.latent.breathing',
    painReliefKey: 'timeline.phase.latent.painRelief',
    firstTimeKey: 'timeline.phase.latent.firstTime',
    birthingPersonKey: 'timeline.phase.latent.birthingPerson',
    partnerKey: 'timeline.phase.latent.partner',
    callWardKey: 'timeline.phase.latent.callWard',
    redFlagsKey: 'timeline.phase.latent.redFlags',
  },
  {
    id: 'active',
    titleKey: 'timeline.phase.active.title',
    happeningKey: 'timeline.phase.active.happening',
    breathingKey: 'timeline.phase.active.breathing',
    painReliefKey: 'timeline.phase.active.painRelief',
    firstTimeKey: 'timeline.phase.active.firstTime',
    birthingPersonKey: 'timeline.phase.active.birthingPerson',
    partnerKey: 'timeline.phase.active.partner',
    callWardKey: 'timeline.phase.active.callWard',
    redFlagsKey: 'timeline.phase.active.redFlags',
  },
  {
    id: 'transition',
    titleKey: 'timeline.phase.transition.title',
    happeningKey: 'timeline.phase.transition.happening',
    breathingKey: 'timeline.phase.transition.breathing',
    painReliefKey: 'timeline.phase.transition.painRelief',
    birthingPersonKey: 'timeline.phase.transition.birthingPerson',
    partnerKey: 'timeline.phase.transition.partner',
    callWardKey: 'timeline.phase.transition.callWard',
    redFlagsKey: 'timeline.phase.transition.redFlags',
  },
  {
    id: 'pushing',
    titleKey: 'timeline.phase.pushing.title',
    happeningKey: 'timeline.phase.pushing.happening',
    breathingKey: 'timeline.phase.pushing.breathing',
    firstTimeKey: 'timeline.phase.pushing.firstTime',
    birthingPersonKey: 'timeline.phase.pushing.birthingPerson',
    partnerKey: 'timeline.phase.pushing.partner',
    callWardKey: 'timeline.phase.pushing.callWard',
    redFlagsKey: 'timeline.phase.pushing.redFlags',
  },
  {
    id: 'placenta',
    titleKey: 'timeline.phase.placenta.title',
    happeningKey: 'timeline.phase.placenta.happening',
    birthingPersonKey: 'timeline.phase.placenta.birthingPerson',
    partnerKey: 'timeline.phase.placenta.partner',
    callWardKey: 'timeline.phase.placenta.callWard',
    redFlagsKey: 'timeline.phase.placenta.redFlags',
  },
  {
    id: 'golden-hour',
    titleKey: 'timeline.phase.goldenHour.title',
    happeningKey: 'timeline.phase.goldenHour.happening',
    birthingPersonKey: 'timeline.phase.goldenHour.birthingPerson',
    partnerKey: 'timeline.phase.goldenHour.partner',
    callWardKey: 'timeline.phase.goldenHour.callWard',
    redFlagsKey: 'timeline.phase.goldenHour.redFlags',
  },
  {
    id: 'first-days',
    titleKey: 'timeline.phase.firstDays.title',
    happeningKey: 'timeline.phase.firstDays.happening',
    birthingPersonKey: 'timeline.phase.firstDays.birthingPerson',
    partnerKey: 'timeline.phase.firstDays.partner',
    callWardKey: 'timeline.phase.firstDays.callWard',
    redFlagsKey: 'timeline.phase.firstDays.redFlags',
  },
];
