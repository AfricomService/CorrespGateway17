import { ISmtpConfig, NewSmtpConfig } from './smtp-config.model';

export const sampleWithRequiredData: ISmtpConfig = {
  id: 70476,
};

export const sampleWithPartialData: ISmtpConfig = {
  id: 12158,
  name: 'Handmade Persistent Riel',
  smtpHost: 'extensible Awesome synthesizing',
  username: 'Chicken Seamless Tools',
  useAuth: true,
  fromAddress: 'Games maroon',
  fromName: 'Poitou-Charentes c bus',
  lacalhostName: 'a optical',
  connectionTimeout: 89601,
  timeout: 82802,
  active: false,
};

export const sampleWithFullData: ISmtpConfig = {
  id: 41540,
  name: 'orange',
  smtpHost: 'primary Ergonomic indexing',
  smtpPort: 44628,
  username: 'Awesome',
  password: 'XML Bénin withdrawal',
  useAuth: false,
  useTls: false,
  useSsl: true,
  fromAddress: 'a neutral',
  fromName: 'purple copy Tuna',
  lacalhostName: 'Wooden',
  connectionTimeout: 36521,
  timeout: 92285,
  active: false,
  description: 'Decentralized',
};

export const sampleWithNewData: NewSmtpConfig = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
