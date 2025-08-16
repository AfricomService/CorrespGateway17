import dayjs from 'dayjs/esm';

import { IHistConsult, NewHistConsult } from './hist-consult.model';

export const sampleWithRequiredData: IHistConsult = {
  id: 13422,
};

export const sampleWithPartialData: IHistConsult = {
  id: 82648,
  dateTransaction: dayjs('2025-08-15T20:29'),
  categorie: 'Car Pataca Leone',
  navigateur: 'Checking fuchsia Licensed',
  ip: 'a override systemic',
  terminal: 'grey',
};

export const sampleWithFullData: IHistConsult = {
  id: 25137,
  labelAction: 'navigate services',
  user: 'Rial',
  dateTransaction: dayjs('2025-08-15T16:19'),
  categorie: 'Assimilated Balboa',
  navigateur: 'microchip hub',
  ip: 'payment Languedoc-Roussillon',
  terminal: 'Pays-Bas secured',
};

export const sampleWithNewData: NewHistConsult = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
