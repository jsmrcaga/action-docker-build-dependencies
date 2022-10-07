const Crypto = require('crypto');
const fs = require('fs/promises');
const Process = require('child_process');

class Docker {
	run(command, options) {
		return new Promise((resolve, reject) => {
			console.log('Running:', command);
			Process.exec(command, options, (err, stdout, stderr) => {
				process.stdout.write(stdout);
				process.stderr.write(stderr);

				if(err) {
					return reject(err);
				}

				return resolve();
			});
		});
	}

	login({ registry, username, password }) {
		return this.run(`echo ${password} | docker login ${registry} -u ${username} --password-stdin`);
	}

	compute_intermediary_url({ dockerfile, intermediary_hash, intermediary_url, should_compute_dockerifle_hash }) {
		if(!should_compute_dockerifle_hash) {
			return Promise.resolve(`${intermediary_url}:${intermediary_hash}`);
		}

		return fs.readFile(`${dockerfile}/Dockerfile`, {
			encoding: 'utf-8'
		}).then(file => {
			// Nothing sensitive here we can use md5
			const hash = Crypto.createHash('md5');

			const lines = file.split('\n');
			const from_regex = /FROM\s/;

			let seen_from = false;
			for(const line of lines) {
				if(from_regex.test(line)) {
					if(seen_from) {
						break;
					} else {
						seen_from = true;
					}
				}

				hash.update(line);
			}

			// Add original user hash
			hash.update(intermediary_hash);

			const dockerfile_hash = hash.digest('hex');
			return `${intermediary_url}:${dockerfile_hash}`;
		});
	}

	pull_or_build_intermediary({ intermediary_image_name, intermediary_url, extra_options='', dockerfile='.' }) {
		// pull image if it exists, otherwise built it
		return this.run(`docker pull ${intermediary_url} || docker build --no-cache --target ${intermediary_image_name} -t ${intermediary_url} ${extra_options} ${dockerfile}`);
	}

	build_final({ image_url, arg_name, intermediary_url, extra_options='', dockerfile }) {
		return this.run(`DOCKER_BUILDKIT=1 docker build -t ${image_url} --build-arg ${arg_name}=${intermediary_url} ${extra_options} ${dockerfile}`);
	}

	push({ image_url }) {
		return this.run(`docker push ${image_url}`);
	}
}

let docker = new Docker();
module.exports = docker;
