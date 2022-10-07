const Docker = require('../lib/docker');
const GitHub = require('../lib/github');
const ProcessManager = require('../lib/process-manager');

const {
	INPUT_DOCKERFILE_PATH,
	INPUT_INTERMEDIARY_HASH,
	INPUT_COMPUTE_DOCKERFILE_HASH,
	INPUT_INTERMEDIARY_IMAGE_AS,
	INPUT_INTERMEDIARY_IMAGE_URL,
	INPUT_INTERMEDIARY_BUILD_FLAGS,
	INPUT_FINAL_IMAGE_BUILD_COMMAND,
} = process.env;


const pipeline = () => {
	// login done on pre.js
	// 1 - compute hash
	// 2 - pull or build
	// 3 - build real image
	// push dependency done on post

	return Docker.compute_intermediary_url({
		dockerfile: INPUT_DOCKERFILE_PATH,
		intermediary_hash: INPUT_INTERMEDIARY_HASH,
		intermediary_url: INPUT_INTERMEDIARY_IMAGE_URL,
		should_compute_dockerifle_hash: JSON.parse(INPUT_COMPUTE_DOCKERFILE_HASH),
	}).then(intermediary_url => {
		// Set intermediary hash output for other actions to use
		GitHub.command('set-output', `name=intermediary_tag::${intermediary_url}\n`);

		// Set intermediary hash as state for post action to use
		GitHub.command('save-state', `name=INTERMEDIARY_TAG::${intermediary_url}\n`);

		return Docker.pull_or_build_intermediary({
			intermediary_image_name: INPUT_INTERMEDIARY_IMAGE_AS,
			intermediary_url: intermediary_url,
			extra_options: INPUT_INTERMEDIARY_BUILD_FLAGS,
			dockerfile: INPUT_DOCKERFILE_PATH
		});
	}).then(() => {
		ProcessManager.exit(0);
	}).catch(e => {
		console.error(e);
		ProcessManager.exit(1);
	});
};

module.exports = pipeline();
