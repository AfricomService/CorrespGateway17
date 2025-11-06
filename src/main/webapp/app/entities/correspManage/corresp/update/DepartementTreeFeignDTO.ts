export interface DepartementTreeFeignDTO {
  id: number;
  code: string;
  nom: string;
  children: DepartementTreeFeignDTO[];
}
