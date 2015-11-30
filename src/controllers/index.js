import path from 'path';
import { readdirSync } from 'fs';

/**
 * Register all controllers with provided router
 * @param  {KoaRouter} router API mount point
 */
export default function registerControllers (router) {
	readdirSync(__dirname)
		.filter((fileName) => fileName.endsWith('Ctrl.js'))
		.forEach((fileName) => {
			const ctrlFilePath = path.join(__dirname, fileName);

			require(ctrlFilePath).default(router);
		});
}
