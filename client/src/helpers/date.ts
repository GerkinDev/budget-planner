import {Temporal, toTemporalInstant} from '@js-temporal/polyfill';

export const toPlainDate = (date: Date) =>
  toTemporalInstant
    .call(date)
    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDate();
export const toPlainDateString = (date: Date) =>
  toPlainDate(date).toLocaleString();

export const roundDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
