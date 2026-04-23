export interface CustomSearchView {
  id: number;
  name: string;
  filters: { [key: string]: string };
  active?: boolean;
}
