export interface IConnecteur {
  id: number;
  name?: string | null;
  codeRules?: string | null;
  protocol?: string | null;
  host?: string | null;
  port?: string | null;
  enable?: string | null;
  email?: string | null;
  password?: string | null;
  folderSource?: string | null;
  folderonOK?: string | null;
  folderonError?: string | null;
  isActif?: boolean | null;
}

export type NewConnecteur = Omit<IConnecteur, 'id'> & { id: null };
