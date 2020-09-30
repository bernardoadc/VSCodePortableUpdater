module.exports = async function updater () {
  const fs = require('fs-extra')
  const path = require('path')
  const extract = require('extract-zip')

  // check if vscode is opened
  // check for updates
  // get link of download
  // download it
  const zipfile = 'C:\\Users\\c082647\\Downloads\\VSCode-win32-x64-1.49.2.zip'

  // get path of baseDir (check if %code%)
  const baseDir = 'U:\\Code\\Apps\\VsCodePortableUpdater\\test\\VSCode\\' // process.env.codedir
  const code = baseDir.split(path.sep).splice(-2).slice(0, -1)[0] // se last chars = path.sep, -2, otherwise, -1
  const upDir = path.join(...baseDir.split(path.sep).slice(0, -2)) // se last chars = path.sep, -2, otherwise, -1

  // take data one level up (rename to ${code}_data_tmp)
  await fs.rename(path.join(`${baseDir}`, 'data'), path.join(`${baseDir}`, `${code}_data_tmp`))
  await fs.move(path.join(`${baseDir}`, `${code}_data_tmp`), path.join(`${upDir}`, `${code}_data_tmp`))

  // unzip download
  await extract(zipfile, {dir: path.join(`${upDir}`, `${code}-new-tmp`)})

  // rename current version
  await fs.rename(`${baseDir}`, path.join(`${upDir}`, `${code}_old_tmp`))

  // rename new version to same name pattern
  await fs.rename(path.join(`${upDir}`, `${code}-new-tmp`), path.join(`${upDir}`, `${code}`))

  // move
  await fs.move(path.join(`${upDir}`, `${code}_data_tmp`), path.join(`${baseDir}`, `${code}_data_tmp`))
  await fs.rename(path.join(`${baseDir}`, `${code}_data_tmp`), path.join(`${baseDir}`, 'data'))

  // del current version
  await fs.rmdir(path.join(`${upDir}`, `${code}_old_tmp`))

  console.log('VSCode is now updated')
}
