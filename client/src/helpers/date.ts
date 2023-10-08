import {Temporal, toTemporalInstant} from '@js-temporal/polyfill';

export const toPlainDateString = (date: Date) =>
  toTemporalInstant
    .call(date)
    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDate()
    .toLocaleString();

export const roundDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
