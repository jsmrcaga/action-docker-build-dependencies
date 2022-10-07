const { expect } = require('chai');
const Sinon = require('sinon');

const Docker = require('../lib/docker');

describe('Post script', () => {
	beforeEach(() => {
		process.env.STATE_INTERMEDIARY_TAG = 'intermediary:tag';
	});

	afterEach(() => {
		delete process.env.STATE_INTERMEDIARY_TAG;
	});

	it('Should call docker push with given url', () => {
		const docker_stub = Sinon.stub(Docker, 'push');

		// Run post script
		require('../scripts/post');

		expect(docker_stub.calledOnceWith({
			image_url: 'intermediary:tag'
		})).to.be.true;
	});
});

