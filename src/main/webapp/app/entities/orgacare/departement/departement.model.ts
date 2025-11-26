import dayjs from 'dayjs/esm';

export interface IDepartement {
  id: number;
  code?: string | null;
  name?: string | null;
  nom?: string | null;
  email?: string | null;
  description?: string | null;
  createdDate?: dayjs.Dayjs | null;
  updatedDate?: dayjs.Dayjs | null;
  organigrammeId?: number | null;
}

export type NewDepartement = Omit<IDepartement, 'id'> & { id: null };
