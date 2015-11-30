import { sleep } from 'lib/utils';

class Model {
	constructor(name, age) {
		this.name = name;
		this.age = age;
	}

	static async load() {
		await sleep(3000);

		return [ new this('Ondřej', 27), new this('Franta', 101) ];
	}
}

export default Model;
