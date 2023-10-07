import {Temporal, toTemporalInstant} from '@js-temporal/polyfill';

export const toPlainDate = (date: Date) =>
  toTemporalInstant
    .call(date)
    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDate()
    .toLocaleString();
