const { exec } = require('child_process');
exec('wmic process where "name=\'node.exe\'" get ProcessId, CommandLine, ExecutablePath', (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});
