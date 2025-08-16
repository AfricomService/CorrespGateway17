import dayjs from 'dayjs/esm';

import { NotificationStatus } from 'app/entities/enumerations/notification-status.model';

import { INotif, NewNotif } from './notif.model';

export const sampleWithRequiredData: INotif = {
  id: '2a6625f1-a2f7-4666-94fb-781439cabe0c',
  recipientEmail: 'b Nord-Pas-de-Calais maroon',
  senderEmail: 'JSON hierarchy',
  status: NotificationStatus['PENDING'],
};

export const sampleWithPartialData: INotif = {
  id: 'f753ed63-756e-417f-9c78-28049edb32f5',
  title: 'yellow',
  recipientEmail: 'Home',
  senderEmail: 'Pays-Bas bifurcated',
  sentDate: dayjs('2025-08-15T18:07'),
  status: NotificationStatus['FAILED'],
};

export const sampleWithFullData: INotif = {
  id: '885b53e6-cacc-4cce-bcc0-7019ec64dfdf',
  title: 'productize systemic',
  body: '../fake-data/blob/hipster.txt',
  recipientEmail: 'contingency',
  recipeientccemail: 'Tuna RAM',
  receipientbccemail: 'Monetary a cutting-edge',
  senderEmail: 'Administrateur',
  sentDate: dayjs('2025-08-16T08:54'),
  status: NotificationStatus['PENDING'],
  typeNotif: 'b',
  messageID: 522,
};

export const sampleWithNewData: NewNotif = {
  recipientEmail: 'Seychelles c',
  senderEmail: 'Open-source Bike green',
  status: NotificationStatus['PENDING'],
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
