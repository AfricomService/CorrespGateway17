export interface IEmploye {
  id: number;
  jobTitle?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export type NewEmploye = Omit<IEmploye, 'id'> & { id: null };
