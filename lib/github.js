module.exports = {
	command: (command, data) => {
		process.stdout.write(`::${command} ${data}\n`);
	}
};
