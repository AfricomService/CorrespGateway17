export interface DepartementTreeFeignDTO {
  id: number;
  code: string;
  nom: string;
  selected: boolean;
  children: DepartementTreeFeignDTO[];
  selected: boolean;
  organigrammeId?: number | null;
}
