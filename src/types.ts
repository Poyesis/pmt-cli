export type EnvsJson = {
  project: string;
  category: string;
  envs: { name: string; secret: string }[];
};

export type EnvCliFlags = {
  config: string; // -c, --config
  baseUrl: string; // -u, --base-url (env fallback)
  listPath: string; // --list-path
  readPath: string; // --read-path
  createPath: string; // --create-path
  pushPath: string; // --push-path
  overwrite: boolean; // --overwrite (init)
  path: string; // -p, --path (single pull)
  mapName: string | null; // --name (single pull mapping name)
  quiet: boolean; // -q, --quiet
};

export type PMTConfig = {
  apiBaseUrl: string;
  token?: string;
  email?: string;
};

export type LoginResponse = { accessToken: string };
