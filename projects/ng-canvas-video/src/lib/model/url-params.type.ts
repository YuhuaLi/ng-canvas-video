import { UrlQueryParams } from './url-query-params.type';

export type UrlParams = {
  url: string;
  schema: string;
  server: string;
  port: number;
  vhost: string;
  app: string;
  stream: string;
  user_query?: UrlQueryParams;
  domain?: string;
};
