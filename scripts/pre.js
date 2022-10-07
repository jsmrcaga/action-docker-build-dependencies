const Docker = require('../lib/docker');

const {
	INPUT_DOCKER_USERNAME,
	INPUT_DOCKER_PASSWORD,
	INPUT_DOCKER_REGISTRY
} = process.env;

if(INPUT_DOCKER_USERNAME) {
	Docker.login({
		username: INPUT_DOCKER_USERNAME,
		password: INPUT_DOCKER_PASSWORD,
		registry: INPUT_DOCKER_REGISTRY
	});
}
