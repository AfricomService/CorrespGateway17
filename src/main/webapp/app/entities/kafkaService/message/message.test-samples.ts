import dayjs from 'dayjs/esm';

import { IMessage, NewMessage } from './message.model';

export const sampleWithRequiredData: IMessage = {
  id: 29027,
  content: 'turn-key SQL Midi-Pyrénées',
  timestamp: dayjs('2025-08-16T00:13'),
};

export const sampleWithPartialData: IMessage = {
  id: 88709,
  content: 'Metal du customized',
  timestamp: dayjs('2025-08-16T06:22'),
};

export const sampleWithFullData: IMessage = {
  id: 42830,
  content: 'contingency cross-platform',
  timestamp: dayjs('2025-08-15T17:50'),
};

export const sampleWithNewData: NewMessage = {
  content: 'quantify cyan',
  timestamp: dayjs('2025-08-16T02:37'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
