export interface IDetailInfo {
  id: number;
  status?: boolean | null;
  label?: string | null;
  code?: string | null;
  required?: boolean | null;
  inputType?: string | null;
  multipleChoiceOption?: Record<string, string>[] | null;
}

export type NewDetailInfo = Omit<IDetailInfo, 'id'> & { id: null };
