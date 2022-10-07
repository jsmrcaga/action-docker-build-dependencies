const { expect } = require('chai');
const Sinon = require('sinon');

const Docker = require('../lib/docker');

describe('Pre script', () => {
	it('Should login user via docker', () => {
		Docker.login = Sinon.fake(() => Promise.resolve());

		process.env.INPUT_DOCKER_USERNAME = 'username';
		process.env.INPUT_DOCKER_PASSWORD = 'password';
		process.env.INPUT_DOCKER_REGISTRY = 'registry';

		// Run pre script
		require('../scripts/pre');

		expect(Docker.login.calledOnceWith({
			username: 'username',
			password: 'password',
			registry: 'registry'
		})).to.be.true;

		// Teardown
		delete process.env.INPUT_DOCKER_PASSWORD;
		delete process.env.INPUT_DOCKER_USERNAME;
		delete process.env.INPUT_DOCKER_REGISTRY;
	});
});
