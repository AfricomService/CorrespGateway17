export interface CustomSearchView {
  id: number;
  name: string;
  filters: { [key: string]: string };
  request?: string;
  active?: boolean;
}
