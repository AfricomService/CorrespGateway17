import dayjs from 'dayjs/esm';

import { IConfigexport, NewConfigexport } from './configexport.model';

export const sampleWithRequiredData: IConfigexport = {
  id: 31350,
};

export const sampleWithPartialData: IConfigexport = {
  id: 12883,
  label: 'deposit Handmade',
  configMappingJson: 'enterprise synthesizing',
};

export const sampleWithFullData: IConfigexport = {
  id: 48473,
  label: 'Berkshire Rupee',
  active: true,
  excelFile: '../fake-data/blob/hipster.png',
  excelFileContentType: 'unknown',
  dateCreated: dayjs('2025-08-15T23:57'),
  configMappingJson: 'maroon Argentine Rosiers',
  readAccess: 'Refined generating',
};

export const sampleWithNewData: NewConfigexport = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
