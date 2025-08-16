import dayjs from 'dayjs/esm';

import { IMyreport, NewMyreport } from './myreport.model';

export const sampleWithRequiredData: IMyreport = {
  id: 17884,
};

export const sampleWithPartialData: IMyreport = {
  id: 91162,
  loginId: 74313,
  configExportId: 57722,
};

export const sampleWithFullData: IMyreport = {
  id: 7399,
  dateCreated: dayjs('2025-08-15T12:46'),
  loginName: 'indigo Designer Designer',
  loginId: 27049,
  nameFile: 'Rubber Pre-emptive back-end',
  nameFolder: 'back content',
  configExportId: 4165,
};

export const sampleWithNewData: NewMyreport = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
