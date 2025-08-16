import { IEmploye, NewEmploye } from './employe.model';

export const sampleWithRequiredData: IEmploye = {
  id: 50596,
};

export const sampleWithPartialData: IEmploye = {
  id: 67140,
  email: 'Alain.Dumont@gmail.com',
  phoneNumber: 'online Account Adolphe',
};

export const sampleWithFullData: IEmploye = {
  id: 48061,
  jobTitle: 'c a Designer',
  email: 'Lonne_Louis87@gmail.com',
  phoneNumber: 'Exclusive',
};

export const sampleWithNewData: NewEmploye = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
