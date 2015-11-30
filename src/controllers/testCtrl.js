import Model from 'models/Model';

const sayHi = async (ctx) => {
	ctx.body = 'Hello World';
};

async function loadData(ctx) {
	ctx.body = await Model.load();
}

export default function(router) {
	router.get('/load-data', loadData);
	router.get('/say-hi', sayHi);
}
