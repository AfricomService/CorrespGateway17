import { IConnecteur, NewConnecteur } from './connecteur.model';

export const sampleWithRequiredData: IConnecteur = {
  id: 64116,
};

export const sampleWithPartialData: IConnecteur = {
  id: 2491,
  name: 'Berkshire',
  protocol: 'Rufiyaa Alsace Salad',
  host: 'dedicated Architecte ROI',
  port: 'neutral Bedfordshire',
  email: 'Agnan38@hotmail.fr',
  folderSource: 'feed',
  folderonOK: 'innovative',
  folderonError: 'matrix',
};

export const sampleWithFullData: IConnecteur = {
  id: 18790,
  name: 'Rupiah',
  codeRules: 'red',
  protocol: 'deposit Concrete',
  host: '1080p',
  port: 'niches',
  enable: 'Comores input',
  email: 'Taurin.Paul46@yahoo.fr',
  password: 'open-source',
  folderSource: 'République',
  folderonOK: 'Organic system Marcadet',
  folderonError: 'c Games',
  isActif: false,
};

export const sampleWithNewData: NewConnecteur = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
