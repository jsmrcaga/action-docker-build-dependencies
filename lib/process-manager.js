module.exports = {
	// This is here for testability. If we mock process.exit we might break the
	// test runnr process and leave it hanging as a zombie process
	exit: (...args) => process.exit(...args)
};
