const fs = require('fs/promises');
const { expect } = require('chai');
const Sinon = require('sinon');

const GitHub = require('../lib/github');
const ProcessManager = require('../lib/process-manager');
const Docker = require('../lib/docker');

describe('Main script', () => {
	let exit_stub;
	let github_stub;
	beforeEach(() => {
		// Do this here to reset actual stub every time, otherwise node keeps this in cache
		delete require.cache[require.resolve('../scripts/main')];
		exit_stub = Sinon.stub(ProcessManager, 'exit');
		github_stub = Sinon.stub(GitHub, 'command');
	});

	afterEach(() => {
		exit_stub.restore();
		github_stub.restore();
	});

	it('Should run pull/build commands without special cache', done => {
		process.env.INPUT_DOCKERFILE_PATH = 'INPUT_DOCKERFILE_PATH';
		process.env.INPUT_INTERMEDIARY_HASH = 'INPUT_INTERMEDIARY_HASH';
		process.env.INPUT_COMPUTE_DOCKERFILE_HASH = 'false';
		process.env.INPUT_INTERMEDIARY_IMAGE_AS = 'INPUT_INTERMEDIARY_IMAGE_AS';
		process.env.INPUT_INTERMEDIARY_IMAGE_URL = 'INPUT_INTERMEDIARY_IMAGE_URL';
		process.env.INPUT_INTERMEDIARY_BUILD_FLAGS = 'INPUT_INTERMEDIARY_BUILD_FLAGS';
		process.env.INPUT_FINAL_IMAGE_BUILD_COMMAND = 'INPUT_FINAL_IMAGE_BUILD_COMMAND';

		const commands = [
			`docker pull ${process.env.INPUT_INTERMEDIARY_IMAGE_URL}:${process.env.INPUT_INTERMEDIARY_HASH} || docker build --no-cache --target ${process.env.INPUT_INTERMEDIARY_IMAGE_AS} -t ${process.env.INPUT_INTERMEDIARY_IMAGE_URL}:${process.env.INPUT_INTERMEDIARY_HASH} ${process.env.INPUT_INTERMEDIARY_BUILD_FLAGS} ${process.env.INPUT_DOCKERFILE_PATH}`,
			process.env.INPUT_FINAL_IMAGE_BUILD_COMMAND
		];

		const docker_run_stub = Sinon.stub(Docker, 'run').callsFake((command) => {
			const expected_command = commands.shift();
			expect(command).to.be.eql(expected_command);

			return Promise.resolve();
		});

		require('../scripts/main').then(() => {
			expect(exit_stub.calledOnceWith(0)).to.be.true;
			expect(github_stub.callCount).to.be.eql(2);
			done();
		}).catch(e => done(e)).finally(() => {
			docker_run_stub.restore();
		});
	});

	it('Should run pull/build commands computing special cache first', done => {
		process.env.INPUT_DOCKERFILE_PATH = 'INPUT_DOCKERFILE_PATH';
		process.env.INPUT_INTERMEDIARY_HASH = 'INPUT_INTERMEDIARY_HASH';
		process.env.INPUT_COMPUTE_DOCKERFILE_HASH = 'true';
		process.env.INPUT_INTERMEDIARY_IMAGE_AS = 'INPUT_INTERMEDIARY_IMAGE_AS';
		process.env.INPUT_INTERMEDIARY_IMAGE_URL = 'INPUT_INTERMEDIARY_IMAGE_URL';
		process.env.INPUT_INTERMEDIARY_BUILD_FLAGS = 'INPUT_INTERMEDIARY_BUILD_FLAGS';
		process.env.INPUT_FINAL_IMAGE_BUILD_COMMAND = 'INPUT_FINAL_IMAGE_BUILD_COMMAND';

		const fake_dockerfile = `
			FROM node:16-buster-slim as builder

			RUN build my dokcer image
			ENV some env
			IDK something else

			FROM builder
			actual docker image
		`;

		// Combined hash is 416036f94321ab167e7f991ad847c97c

		const readfile_stub = Sinon.stub(fs, 'readFile').callsFake(() => Promise.resolve(fake_dockerfile));

		const commands = [
			`docker pull ${process.env.INPUT_INTERMEDIARY_IMAGE_URL}:416036f94321ab167e7f991ad847c97c || docker build --no-cache --target ${process.env.INPUT_INTERMEDIARY_IMAGE_AS} -t ${process.env.INPUT_INTERMEDIARY_IMAGE_URL}:416036f94321ab167e7f991ad847c97c ${process.env.INPUT_INTERMEDIARY_BUILD_FLAGS} ${process.env.INPUT_DOCKERFILE_PATH}`,
			process.env.INPUT_FINAL_IMAGE_BUILD_COMMAND
		];

		const docker_run_stub = Sinon.stub(Docker, 'run').callsFake((command) => {
			const expected_command = commands.shift();
			expect(command).to.be.eql(expected_command);

			return Promise.resolve();
		});

		require('../scripts/main').then(() => {
			expect(exit_stub.calledOnceWith(0)).to.be.true;
			expect(github_stub.callCount).to.be.eql(2);
			done();
		}).catch(e => {
			console.error(e);
			done(e);
		});
	});
});
