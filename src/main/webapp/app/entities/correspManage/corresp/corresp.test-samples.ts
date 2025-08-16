import dayjs from 'dayjs/esm';

import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { CorrespType } from 'app/entities/enumerations/corresp-type.model';
import { DispatchType } from 'app/entities/enumerations/dispatch-type.model';

import { ICorresp, NewCorresp } from './corresp.model';

export const sampleWithRequiredData: ICorresp = {
  id: 21077,
  idinstance: 'fa1530ed-4daf-4807-b4e8-0b49e4a509c8',
  subject: 'haptic Alsace',
  dateCreated: dayjs('2025-08-15T22:13'),
  courrierDate: dayjs('2025-08-16T04:06'),
  status: CorrespStatus['IN_PROGRESS'],
  corresptype: CorrespType['OUTGOING'],
  sender: 'synthesizing',
  dispatchType: DispatchType['EMAIL'],
};

export const sampleWithPartialData: ICorresp = {
  id: 11660,
  idinstance: '9c27127a-e3e9-454d-b6b8-b71afe14ac36',
  reference: 'input',
  subject: 'virtual',
  dateCreated: dayjs('2025-08-16T02:21'),
  courrierDate: dayjs('2025-08-15T12:57'),
  status: CorrespStatus['CANCELLED'],
  body: '../fake-data/blob/hipster.txt',
  corresptype: CorrespType['INCOMING'],
  sender: 'microchip Soft quantify',
  needsResponse: true,
  responseTo: 'transmitting',
  senderReference: 'withdrawal Interface',
  dispatchType: DispatchType['EMAIL'],
  contactCompany: 'Steel state SQL',
  contactEmail: 'b client-server',
  contactEmailCc: 'Ameliorated',
  updatedBy: 'deposit hack integrate',
  updatedDate: dayjs('2025-08-15T23:29'),
};

export const sampleWithFullData: ICorresp = {
  id: 6666,
  idinstance: 'dbaaf690-d3ce-4257-b3af-c30172ac8566',
  reference: 'Buckinghamshire open-source Toys',
  subject: 'payment',
  dateCreated: dayjs('2025-08-15T20:10'),
  courrierDate: dayjs('2025-08-16T08:33'),
  status: CorrespStatus['CLOSED'],
  priority: true,
  body: '../fake-data/blob/hipster.txt',
  corresptype: CorrespType['OUTGOING'],
  sender: 'Limousin',
  needsResponse: true,
  responseTo: 'PNG improvement b',
  step: 'transmitting',
  stepCode: 'Cloned multi-byte bleeding-edge',
  processId: 95452,
  processVersion: 'Mauritius de',
  contact: 'bluetooth',
  senderReference: 'Generic',
  dispatchType: DispatchType['EMAIL'],
  contactCompany: 'Account online',
  personCompany: 'SDD',
  contactAddress: 'Open-source Basse-Normandie',
  contactEmail: 'indexing',
  contactEmailCc: 'Intelligent',
  createdBy: 'Pizza',
  updatedBy: 'compress',
  updatedDate: dayjs('2025-08-15T17:41'),
};

export const sampleWithNewData: NewCorresp = {
  idinstance: 'd090f517-fc02-464b-86b9-83f2bdb021f8',
  subject: 'Technicien Cambridgeshire payment',
  dateCreated: dayjs('2025-08-15T12:22'),
  courrierDate: dayjs('2025-08-15T16:49'),
  status: CorrespStatus['CANCELLED'],
  corresptype: CorrespType['INCOMING'],
  sender: 'Metal',
  dispatchType: DispatchType['LETTER'],
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
