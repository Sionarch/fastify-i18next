import * as fastify from 'fastify';
import i18next from 'i18next';

declare global {
  namespace Express {
    interface Request {
      language: string;
      languages: string[];
      i18n:i18next.i18n;
      t:i18next.TFunction
    }
  }
}

declare module 'i18next-fastify-middleware' {
  type I18next = i18next.i18n;
  type IgnoreRoutesFunction = (req: fastify.FastifyRequest, res: fastify.FastifyReply<any>, options: HandleOptions, i18next: I18next) => boolean;
  type App = fastify.FastifyMiddleware;

  interface HandleOptions {
    ignoreRoutes?: string[] | IgnoreRoutesFunction;
    removeLngFromUrl?: boolean;
  }
  interface GetResourcesHandlerOptions {
    maxAge?: number;
    cache?: boolean;
    lngParam?: string;
    nsParam?: string;
  }
  interface MissingKeyHandlerOptions {
    lngParam?: string;
    nsParam?: string;
  }

  export function handle(i18next: I18next, options?: HandleOptions): fastify.RequestHandler;
  export function getResourcesHandler(i18next: I18next, options?: GetResourcesHandlerOptions): fastify.RequestHandler;
  export function missingKeyHandler(i18next: I18next, options?: MissingKeyHandlerOptions): fastify.RequestHandler;
  export function addRoute(i18next: I18next, route: string, lngs: string[], app: App, verb: string, fc: fastify.RequestHandler): void;
  export function addRoute(i18next: I18next, route: string, lngs: string[], app: App, fc: fastify.RequestHandler): void;

  // LanguageDetector
  type LanguageDetectorServices = any;
  type LanguageDetectorOrder = string[];
  type LanguageDetectorCaches = boolean | string[];
  interface LanguageDetectorOptions {
    order?: LanguageDetectorOrder;
    lookupQuerystring?: string;
    lookupCookie?: string;
    lookupSession?: string;
    lookupFromPathIndex?: number;
    caches?: LanguageDetectorCaches;
    cookieExpirationDate?: Date;
    cookieDomain?: string;
  }
  interface LanguageDetectorAllOptions {
    fallbackLng: boolean | string | string[];
  }
  interface LanguageDetectorInterfaceOptions {
    [name: string]: any;
  }
  interface LanguageDetectorInterface {
    name: string;
    lookup: (req: fastify.FastifyRequest, res: fastify.FastifyReply<any>, options?: LanguageDetectorInterfaceOptions) => string | string[];

    cacheUserLanguage?: (req: fastify.FastifyRequest, res: fastify.FastifyReply<any>, lng: string, options?: object) => void;
  }

  export class LanguageDetector {
    constructor(services: LanguageDetectorServices, options?: LanguageDetectorOptions, allOptions?: LanguageDetectorAllOptions);
    constructor(options?: LanguageDetectorOptions, allOptions?: LanguageDetectorAllOptions);

    init(services: LanguageDetectorServices, options?: LanguageDetectorOptions, allOptions?: LanguageDetectorAllOptions): void;
    init(options?: LanguageDetectorOptions, allOptions?: LanguageDetectorAllOptions): void;
    addDetector(detector: LanguageDetectorInterface): void;
    detect(req: fastify.FastifyRequest, res: fastify.FastifyReply<any>, detectionOrder: LanguageDetectorOrder): void;
    cacheUserLanguage(req: fastify.FastifyRequest, res: fastify.FastifyReply<any>, lng: string, caches: LanguageDetectorCaches): void;
  }
}