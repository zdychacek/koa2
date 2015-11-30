import 'core-js';
import 'harmony-reflect';
import { install } from 'source-map-support';
import Koa from 'koa';
import Router from 'koa-router';
import logger from 'lib/logger';
import registerControllers from 'controllers';

install();

const app = new Koa();
const router = new Router({ prefix: '/api' });

app.use(logger);
app.use(router.routes());

registerControllers(router);

if (!module.parent) {
	const port = process.env.PORT || 6060;

	app.listen(port, () => console.log(`✅  Listening on port ${port}...`));
}
