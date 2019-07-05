const fastify = require('fastify')({ logger: true });
const i18next = require('i18next');
const fastifyi18next = require('fastify-i18next');
const Backend = require('i18next-node-fs-backend');

i18next
  .use(Backend)
  .use(fastifyi18next.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    },
    fallbackLng: 'en',
    preload: ['en', 'de'],
    saveMissing: true
  });

fastify.register(fastifyi18next.plugin, { i18next });

fastify.get('/', async (request, reply) => {
  return request.t('home.title');
});

const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 8080)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
