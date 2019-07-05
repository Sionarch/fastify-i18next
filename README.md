# Introduction

This is a plugin to use i18next in Fastify, based on [i18next-express-middleware](https://www.npmjs.com/package/i18next-express-middleware).

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/fastify-i18next).

```
# npm package
$ npm install fastify-i18next
```

## wire up i18next to request object

```js
var i18next = require("i18next");
var fastifyi18next = require("fastify-i18next");
var fastify = require("fastify")({ logger: true });

i18next.use(fastifyi18next.LanguageDetector).init({
  preload: ["en", "de"],
  resources: {
    en: {
      translation: {
        "title": "Hello World!"
      }
    },
    de: {
      translation: {
        "title": "Hallo Welt!"
      }
    }
  },
  ...otherOptions
});

fastify.register(fastifyi18next.plugin, { i18next });

fastify.get('/', async (request, reply) => {
  return request.t('title');
});

const start = async () => {
  try {
    await fastify.listen(3000)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()

```

## language detection

Detects user language from current request. Comes with support for:

- path
- cookie
- header
- querystring
- session

Wiring up:

```js
var i18next = require("i18next");
var fastifyi18next = require("fastify-i18next");

i18next.use(fastifyi18next.LanguageDetector).init(i18nextOptions);
```

As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.

## Detector Options

```js
{
  // order and from where user language should be detected
  order: [/*'path', 'session', */ 'querystring', 'cookie', 'header'],

  // keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupHeader: 'accept-language',
  lookupSession: 'lng',
  lookupPath: 'lng',
  lookupFromPathIndex: 0,

  // cache user language
  caches: false, // ['cookie']

  // optional expire and domain for set cookie
  cookieExpirationDate: new Date(),
  cookieDomain: 'myDomain',
  cookieSecure: true // if need secure cookie
}
```

Options can be passed in:

**preferred** - by setting options.detection in i18next.init:

```js
var i18next = require("i18next");
var fastifyi18next = require("fastify-i18next");

i18next.use(fastifyi18next.LanguageDetector).init({
  detection: options
});
```

on construction:

```js
var fastifyi18next = require("fastify-i18next");
var lngDetector = new fastifyi18next.LanguageDetector(null, options);
```

via calling init:

```js
var fastifyi18next = require("fastify-i18next");

var lngDetector = new fastifyi18next.LanguageDetector();
lngDetector.init(options);
```

## Adding own detection functionality

### interface

```js
module.exports {
  name: 'myDetectorsName',

  lookup: function(req, res, options) {
    // options -> are passed in options
    return 'en';
  },

  cacheUserLanguage: function(req, res, lng, options) {
    // options -> are passed in options
    // lng -> current language, will be called after init and on changeLanguage

    // store it
  }
};
```

### adding it

```js
var i18next = require("i18next");
var fastifyi18next = require("fastify-i18next");

var lngDetector = new fastifyi18next.LanguageDetector();
lngDetector.addDetector(myDetector);

i18next.use(lngDetector).init({
  detection: options
});
```
