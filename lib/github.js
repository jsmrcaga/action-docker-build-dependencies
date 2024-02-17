const Process = require('node:child_process');

module.exports = {
	save_state: (name, value) => {
		const command = `echo "${name}=${value}" >> $GITHUB_STATE`;
		return Process.execSync(command);
	},

	set_output: (name, value) => {
		const command = `echo "${name}=${value}" >> $GITHUB_OUTPUT`;
		return Process.execSync(command);
	}
};
