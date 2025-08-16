import dayjs from 'dayjs/esm';

export interface ICompany {
  id: number;
  name?: string | null;
  registrationNumber?: string | null;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  foundedDate?: dayjs.Dayjs | null;
  createdDate?: dayjs.Dayjs | null;
  updatedDate?: dayjs.Dayjs | null;
}

export type NewCompany = Omit<ICompany, 'id'> & { id: null };
