const Docker = require('../lib/docker');

const {
	STATE_INTERMEDIARY_TAG,
	INPUT_SHOULD_PUSH_INTERMEDIARY_IMAGE
} = process.env;

if(!INPUT_SHOULD_PUSH_INTERMEDIARY_IMAGE) {
	console.log('intermediary push disabled');
}

module.exports = Docker.push({
	image_url: STATE_INTERMEDIARY_TAG
});
