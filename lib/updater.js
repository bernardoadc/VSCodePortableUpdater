module.exports = async function updater (fileAlreadyDownloaded) {
  const fs = require('fs-extra')
  const path = require('path')
  const extract = require('extract-zip')
  const ky = require('ky-universal')

  // get path of baseDir (check if %code%)
  const baseDir = process.env.codedir
  const code = baseDir.split(path.sep).splice(-2).slice(0, -1)[0] // se last chars = path.sep, -2, otherwise, -1

  let zipfile
  if (!fileAlreadyDownloaded) {
    // get link of download
    const product = JSON.parse(fs.readFileSync(path.join(`${baseDir}`, './resources/app/product.json')))
    const platform = process.platform === 'win32' ? 'win32-x64' : process.platform === 'darwin' ? 'darwin' : 'linux-x64'
    const checkURL = `${product.updateUrl}/api/update/${platform}/${product.quality}/${product.commit}`
    const update = await ky(checkURL, {
      timeout: 3000,
      retry: 3,
      hooks: {
        beforeRequest: [
          request => {
            console.log(`Checking ${request.url}`) // via ${request.method}
          }
        ],
        beforeRetry: [
          async (request, options, error, retryCount) => {
            console.log(`Retrying ${retryCount}...`)
          }
        ],
        afterResponse: [
          async (request, options, response) => {
            console.log(response)
          }
        ]
      }
    }).json().catch((e) => {
      console.log(e.message)
    })
    if (!update) return 1
    // console.log('Got:', update)
    /*
      https://update.code.visualstudio.com/api/update/win32-x64/stable/e5e9e69aed6e1984f7499b7af85b3d05f9a6883a
      {
        "url":"https://az764295.vo.msecnd.net/stable/d2e414d9e4239a252d1ab117bd7067f125afd80a/VSCodeSetup-x64-1.50.1.exe",
        "name":"1.50.1",
        "version":"d2e414d9e4239a252d1ab117bd7067f125afd80a",
        "productVersion":"1.50.1",
        "hash":"08fda7e39157019989c78a8553eab2ee45a6b597",
        "timestamp":1602599889649,
        "sha256hash":"0180288d4a51497224997ce0491b1f7335747df3ce858ae9f73458f81f782156",
        "supportsFastUpdate":true
      }
    */

    // check for updates
    if (product.commit !== update.commit) console.log(`New version ${update.productVersion} available! ${update.url}`)
    else {
      console.log(`You have the latest version installed (${update.productVersion})`)
      return 0
    }

    // check if already downloaded it, or download it
    const filename = update.url.split('/').pop()
    zipfile = path.join(process.env.USERPROFILE, 'Downloads', filename)
    if (!fs.existsSync(zipfile)) await ky(update.url, {
      onDownloadProgress: (progress, chunk) => {
        // Example output:
        // `0% - 0 of 1271 bytes`
        // `100% - 1271 of 1271 bytes`
        console.log(`[30;106m ${progress.percent * 100}% - ${progress.transferredBytes} of ${progress.totalBytes} bytes [0m`)
      }
    }).then(() => { console.log('Finished download') }).catch(function (e) {
      console.log(e)
    })
  } else zipfile = path.normalize(fileAlreadyDownloaded)

  // check if vscode is opened

  // take data one level up (rename to ${code}_data_tmp)
  const upDir = path.join(...baseDir.split(path.sep).slice(0, -2)) // se last chars = path.sep, -2, otherwise, -1
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
  await fs.remove(path.join(`${upDir}`, `${code}_old_tmp`)) // fs.rmdirSync(dir, { recursive: true })

  console.log('VSCode is now updated')
  return 0
}
