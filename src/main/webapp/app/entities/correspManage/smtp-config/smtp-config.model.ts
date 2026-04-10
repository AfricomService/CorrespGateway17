export interface ISmtpConfig {
  id: number;
  name?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  username?: string | null;
  password?: string | null;
  useAuth?: boolean | null;
  useTls?: boolean | null;
  useSsl?: boolean | null;
  fromAddress?: string | null;
  fromName?: string | null;
  lacalhostName?: string | null;
  connectionTimeout?: number | null;
  timeout?: number | null;
  active?: boolean | null;
  description?: string | null;
}

export type NewSmtpConfig = Omit<ISmtpConfig, 'id'> & { id: null };
