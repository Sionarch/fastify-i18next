import * as utils from './utils';
import LD from './LanguageDetector';
import fp from 'fastify-plugin';

// export var LanguageDetector = LD;

function fastifyPlugin (instance, options, next) {
  const i18next = options.i18next;

  // i18next.use(LD).init({
  //   preload: options.preload || [],
  // });

  instance.addHook('preHandler', (request, reply, done) => {
    return new Promise(resolve => {
    if (typeof options.ignoreRoutes === 'function') {
      if (options.ignoreRoutes(request, reply, options, i18next)) {
        return resolve(done());
      }
    } else {
      let ignores = options.ignoreRoutes instanceof Array&&options.ignoreRoutes || [];
      for (var i=0;i< ignores.length;i++){
        if (request.path.indexOf(ignores[i]) > -1) return resolve(done());
      }
    }

    let i18n = i18next.cloneInstance({ initImmediate: false });
    i18n.on('languageChanged', (lng) => { // Keep language in sync
        request.language = request.locale = request.lng = lng;

        if (reply.locals) {
          reply.locals.language = lng;
          reply.locals.languageDir = i18next.dir(lng);
        }

        // if (!reply.headersSent) {
        //   reply.set('Content-Language', lng);
        // }

        request.languages = i18next.services.languageUtils.toResolveHierarchy(lng);

        if (i18next.services.languageDetector) {
          i18next.services.languageDetector.cacheUserLanguage(request, reply, lng);
        }
    });

    let lng = request.lng;
    if (!request.lng && i18next.services.languageDetector) lng = i18next.services.languageDetector.detect(request, reply);

    // set locale
    request.language = request.locale = request.lng = lng;
    // if (!reply.headersSent) {
    //   reply.set('Content-Language', lng);
    // }
    request.languages = i18next.services.languageUtils.toResolveHierarchy(lng);

    // trigger sync to instance - might trigger async load!
    i18n.changeLanguage(lng || i18next.options.fallbackLng[0]);

    if(request.i18nextLookupName === 'path' && options.removeLngFromUrl) {
      request.url = utils.removeLngFromUrl(request.url, i18next.services.languageDetector.options.lookupFromPathIndex);
    }

    let t = i18n.t.bind(i18n);
    let exists = i18n.exists.bind(i18n);

    // assert for request
    request.i18n = i18n;
    request.t = t;

    // assert for res -> template
    if (reply.locals) {
      reply.locals.t = t;
      reply.locals.exists = exists;
      reply.locals.i18n = i18n;
      reply.locals.language = lng;
      reply.locals.languageDir = i18next.dir(lng);
    }

    if (i18next.services.languageDetector) i18next.services.languageDetector.cacheUserLanguage(request, reply, lng);

    // load resources
    if (!request.lng) return resolve(done());
    return i18next.loadLanguages(request.lng)
    .then(() => done());
    });
  });

  next();
}

export function handle(i18next, options = {}) {
  return function i18nextMiddleware(req, res, next) {

  };
};

export function getResourcesHandler(i18next, options) {
  options = options || {};
  let maxAge = options.maxAge || 60 * 60 * 24 * 30;

  return function(req, res) {
    if (!i18next.services.backendConnector) return res.status(404).send('i18next-express-middleware:: no backend configured');

    let resources = {};

    res.contentType('json');
    if (options.cache !== undefined ? options.cache : process.env.NODE_ENV === 'production') {
      res.header('Cache-Control', 'public, max-age=' + maxAge);
      res.header('Expires', (new Date(new Date().getTime() + maxAge * 1000)).toUTCString());
    } else {
      res.header('Pragma', 'no-cache');
      res.header('Cache-Control', 'no-cache');
    }

    let languages = req.query[options.lngParam || 'lng'] ? req.query[options.lngParam || 'lng'].split(' ') : [];
    let namespaces = req.query[options.nsParam || 'ns'] ? req.query[options.nsParam || 'ns'].split(' ') : [];

    // extend ns
    namespaces.forEach(ns => {
      if (i18next.options.ns && i18next.options.ns.indexOf(ns) < 0) i18next.options.ns.push(ns);
    });

    i18next.services.backendConnector.load(languages, namespaces, function() {
      languages.forEach(lng => {
        namespaces.forEach(ns => {
          utils.setPath(resources, [lng, ns], i18next.getResourceBundle(lng, ns));
        });
      });

      res.send(resources);
    });
  };
};

export function missingKeyHandler(i18next, options) {
  options = options || {};

  return function(req, res) {
    let lng = req.params[options.lngParam || 'lng'];
    let ns = req.params[options.nsParam || 'ns'];

    if (!i18next.services.backendConnector) return res.status(404).send('i18next-express-middleware:: no backend configured');

    for (var m in req.body) {
      i18next.services.backendConnector.saveMissing([lng], ns, m, req.body[m]);
    }
    res.send('ok');
  };
};

export function addRoute(i18next, route, lngs, app, verb, fc) {
  if (typeof verb === 'function') {
    fc = verb;
    verb = 'get';
  }

  // Combine `fc` and possible more callbacks to one array
  var callbacks = [fc].concat(Array.prototype.slice.call(arguments, 6));

  for (var i = 0, li = lngs.length; i < li; i++) {
    var parts = String(route).split('/');
    var locRoute = [];
    for (var y = 0, ly = parts.length; y < ly; y++) {
      var part = parts[y];
      // if the route includes the parameter :lng
      // this is replaced with the value of the language
      if (part === ':lng') {
        locRoute.push(lngs[i]);
      } else if (part.indexOf(':') === 0 || part === '') {
        locRoute.push(part);
      } else {
        locRoute.push(i18next.t(part, { lng: lngs[i] }));
      }
    }

    var routes = [locRoute.join('/')];
    app[verb || 'get'].apply(app, routes.concat(callbacks));
  }
};

module.exports = {
  plugin: fp(fastifyPlugin),
  LanguageDetector: LD,
};

// export default fp(fastifyPlugin, {
//   fastify: '>=2.0.0',
//   name: 'i18next-fastify-plugin'
// })

// export default {
//   handle,
//   getResourcesHandler,
//   missingKeyHandler,
//   addRoute,
//   LanguageDetector
// }
