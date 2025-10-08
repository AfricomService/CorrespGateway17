export interface CustomSearchView {
  name: string;
  filters: { [key: string]: string };
  active?: boolean;
}
