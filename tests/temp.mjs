// Keep browser profiles and test temporaries inside the D: project workspace.
import fs from 'node:fs';
import path from 'node:path';
const directory=path.resolve('test-results/.browser-temp');fs.mkdirSync(directory,{recursive:true});
process.env.TEMP=directory;process.env.TMP=directory;process.env.TMPDIR=directory;
