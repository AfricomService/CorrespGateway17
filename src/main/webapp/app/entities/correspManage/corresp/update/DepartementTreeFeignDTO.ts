export interface DepartementTreeFeignDTO {
  id: number;
  code: string;
  nom: string;
  children: DepartementTreeFeignDTO[];
  selected: boolean;
  organigrammeId?: number | null;
}
