import { UrlParams } from '../model';

export function isString(obj: unknown): boolean {
  return (
    Object.prototype.toString.call(obj).toLocaleLowerCase() ===
    '[object string]'
  );
}

export function isBlob(obj: unknown): boolean {
  return (
    Object.prototype.toString.call(obj).toLocaleLowerCase() === '[object blob]'
  );
}

export function parseUrl(url: string): UrlParams {
  // @see: http://stackoverflow.com/questions/10469575/how-to-use-location-object-to-parse-url-without-redirecting-the-page-in-javascri
  const a = document.createElement('a');
  a.href = url
    .replace('rtmp://', 'http://')
    .replace('webrtc://', 'http://')
    .replace('rtc://', 'http://');

  let vhost = a.hostname;
  let app = a.pathname.substr(1, a.pathname.lastIndexOf('/') - 1);
  const stream = a.pathname.substr(a.pathname.lastIndexOf('/') + 1);

  // parse the vhost in the params of app, that srs supports.
  app = app.replace('...vhost...', '?vhost=');
  if (app.indexOf('?') >= 0) {
    const params = app.substr(app.indexOf('?'));
    app = app.substr(0, app.indexOf('?'));

    if (params.indexOf('vhost=') > 0) {
      vhost = params.substr(params.indexOf('vhost=') + 'vhost='.length);
      if (vhost.indexOf('&') > 0) {
        vhost = vhost.substr(0, vhost.indexOf('&'));
      }
    }
  }

  // when vhost equals to server, and server is ip,
  // the vhost is __defaultVhost__
  if (a.hostname === vhost) {
    const pattern = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
    if (pattern.test(a.hostname)) {
      vhost = '__defaultVhost__';
    }
  }

  // parse the schema
  let schema = 'rtmp';
  if (url.indexOf('://') > 0) {
    schema = url.substr(0, url.indexOf('://'));
  }

  let port = +a.port;
  if (!port) {
    if (schema === 'http') {
      port = 80;
    } else if (schema === 'https') {
      port = 443;
    } else if (schema === 'rtmp') {
      port = 1935;
    }
  }

  const ret: UrlParams = {
    url,
    schema,
    server: a.hostname,
    port,
    vhost,
    app,
    stream,
    user_query: {},
  };
  fillQuery(a.search, ret);

  // For webrtc API, we use 443 if page is https, or schema specified it.
  if (!ret.port) {
    if (schema === 'webrtc' || schema === 'rtc') {
      if (ret.user_query && ret.user_query.schema === 'https') {
        ret.port = 443;
      } else if (window.location.href.indexOf('https://') === 0) {
        ret.port = 443;
      } else {
        // For WebRTC, SRS use 1985 as default API port.
        ret.port = 1985;
      }
    }
  }
  return ret;
}

export function fillQuery(queryString: string, obj: UrlParams): void {
  // pure user query object.
  obj.user_query = {};

  if (queryString.length === 0) {
    return;
  }

  // split again for angularjs.
  if (queryString.indexOf('?') >= 0) {
    queryString = queryString.split('?')[1];
  }

  const queries = queryString.split('&');
  for (const elem of queries) {
    const query = elem.split('=');
    obj.user_query[query[0]] = query[1];
  }
  // alias domain for vhost.
  if (obj.domain) {
    obj.vhost = obj.domain;
  }
}

export function prepareWebRTCUrl(webrtcUrl: string): {
  apiUrl: string;
  streamUrl: string;
  schema: string;
  urlObject: UrlParams;
  port: number;
  tid: string;
} {
  const urlObject = parseUrl(webrtcUrl);

  // If user specifies the schema, use it as API schema.
  let schema = urlObject.user_query ? urlObject.user_query.schema : '';
  schema = schema ? schema + ':' : window.location.protocol;

  let port = urlObject.port || 1985;
  if (schema === 'https:') {
    port = urlObject.port || 443;
  }

  // @see https://github.com/rtcdn/rtcdn-draft
  let api =
    (urlObject.user_query && urlObject.user_query.play) || '/rtc/v1/play/';
  if (api.lastIndexOf('/') !== api.length - 1) {
    api += '/';
  }

  let apiUrl = `${schema}//${urlObject.server}:${port}${api}`;
  for (const key in urlObject.user_query) {
    if (key !== 'api' && key !== 'play') {
      apiUrl += `&${key}=${urlObject.user_query[key]}`;
    }
  }
  // Replace /rtc/v1/play/&k=v to /rtc/v1/play/?k=v
  apiUrl = apiUrl.replace(api + '&', api + '?');

  const streamUrl = urlObject.url;

  return {
    apiUrl,
    streamUrl,
    schema,
    urlObject,
    port,
    tid: (+(new Date().getTime() * Math.random() * 100))
      .toString(16)
      .substr(0, 7),
  };
}
