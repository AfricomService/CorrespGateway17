import dayjs from 'dayjs/esm';

import { IModelNotif, NewModelNotif } from './model-notif.model';

export const sampleWithRequiredData: IModelNotif = {
  id: 'cbd6211a-32b8-4603-abd7-36da51cc9a18',
  name: 'Rosiers Richelieu',
  senderEmailFormule: 'Generic Guinée Nord-Pas-de-Calais',
  createdDate: dayjs('2025-08-15T16:53'),
};

export const sampleWithPartialData: IModelNotif = {
  id: 'efbc934b-825f-4e72-916e-e1ceea6805a9',
  name: 'turquoise',
  code: 'wireless pink de',
  subjectFormula: 'Wooden backing Tilsitt',
  senderEmailFormule: 'Plastic b synthesizing',
  createdDate: dayjs('2025-08-16T00:06'),
};

export const sampleWithFullData: IModelNotif = {
  id: '6b1d853d-58af-4b80-99aa-93f914d6b1ae',
  name: 'transmitter',
  famille: 'Rubber moratorium',
  code: 'Intelligent cyan',
  content: '../fake-data/blob/hipster.txt',
  subjectFormula: 'Chilean',
  senderEmailFormule: 'Panoramas transform Self-enabling',
  recepientEmailFormule: 'Plastic',
  createdDate: dayjs('2025-08-16T01:17'),
};

export const sampleWithNewData: NewModelNotif = {
  name: 'Mouse system',
  senderEmailFormule: 'Richelieu',
  createdDate: dayjs('2025-08-16T08:31'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
