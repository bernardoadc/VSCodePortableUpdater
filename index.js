#! /usr/bin/env node
const updater = require('./lib/updater')

const fileAlreadyDownloaded = process.argv[2]
updater(fileAlreadyDownloaded).then((status) => process.exit())
