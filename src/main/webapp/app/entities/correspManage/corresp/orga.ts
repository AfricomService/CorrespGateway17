export interface IOrga {
  id: number;
  company?: string | null;
  organigramme?: string | null;
  status?: string | null;
  orgaCode?: string | null;
}

export type NewOrga = Omit<IOrga, 'id'> & { id: null };
