export interface IRules {
  id: number;
  name?: string | null;
  code?: string | null;
  isActif?: boolean | null;
  file?: string | null;
  fileContentType?: string | null;
}

export type NewRules = Omit<IRules, 'id'> & { id: null };
