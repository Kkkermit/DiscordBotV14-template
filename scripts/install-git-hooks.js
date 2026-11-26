'use strict';

// Runs on `npm install` (the "prepare" script) and sets up the Git hooks in .husky/.
// Production installs (`npm ci --omit=dev`) don't include Husky, so it's skipped there instead of failing.

if (process.env.CI) process.exit(0);

import('husky')
	.then(({ default: installHooks }) => {
		const problem = installHooks();
		if (problem) console.warn(`Git hooks were not installed: ${problem}`);
	})
	.catch((error) => {
		if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
	});
