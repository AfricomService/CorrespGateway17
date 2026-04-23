export interface INumsequentielle {
  id: string;
  prefix?: string | null;
  nextNumber?: number | null;
  format?: string | null;
  codeNumSeq?: string | null;
}

export type NewNumsequentielle = Omit<INumsequentielle, 'id'> & { id: null };
