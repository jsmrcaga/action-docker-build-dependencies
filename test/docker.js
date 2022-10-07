const fs = require('fs/promises');

const { expect } = require('chai');
const Sinon = require('sinon');

const Docker = require('../lib/docker');

describe('Docker', () => {
	it('Should return url with user-given hash if dockerfile hash is disabled', done => {
		Docker.compute_intermediary_url({
			// read is mocked
			dockerfile: '',
			intermediary_hash: 'myhash',
			intermediary_url: 'myurl',
			should_compute_dockerifle_hash: false
		}).then(hash => {
			expect(hash).to.be.eql('myurl:myhash');
			done();
		}).catch(e => done(e));
	});

	it('Should compute an intermediary hash from a dockerfile', done => {

		const dockerfile1 = `
			FROM node:16-buster-slim as builder

			RUN build my dokcer image
			ENV some env
			IDK something else

			FROM builder
			actual docker image
		`;

		const dockerfile2 = `
			FROM node:16-buster-slim as builder

			RUN build my dokcer image
			ENV some env
			IDK something else

			FROM builder as plep
			something else
			but something else
		`;

		let readfile_stub = Sinon.stub(fs, 'readFile').callsFake(() => Promise.resolve(dockerfile1));
		const hash1 = Docker.compute_intermediary_url({
			// read is mocked
			dockerfile: '',
			intermediary_hash: 'myhash',
			intermediary_url: 'myurl',
			should_compute_dockerifle_hash: true
		}).then(hash1 => {
			readfile_stub.restore();
			readfile_stub = Sinon.stub(fs, 'readFile').callsFake(() => Promise.resolve(dockerfile2));

			const hash2 = Docker.compute_intermediary_url({
				// read is mocked
				dockerfile: '',
				intermediary_hash: 'myhash',
				intermediary_url: 'myurl',
				should_compute_dockerifle_hash: true
			});

			return Promise.all([hash1, hash2]);
		}).then(([h1, h2]) => {
			expect(h1).to.be.eql(h2);
			expect(/^myurl/.test(h1)).to.be.true;
			done();
		}).catch(e => {
			readfile_stub.restore();
			done(e);
		}).finally(() => {
			readfile_stub.restore();
		});
	});
});
