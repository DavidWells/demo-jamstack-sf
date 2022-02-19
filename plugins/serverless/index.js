const fs = require('fs')
const path = require('path')
const execa = require('execa')
const { promisify } = require('util')
const mkdirp = require('mkdirp')
const copy = require('copy-dir')
const isInvalidPath = require('is-invalid-path')
const hashDir = require('./utils/hashDir')
const hashFile = require('./utils/hashFile')
const makeDir = promisify(mkdirp)
const statP = promisify(fs.stat)

async function isDirectory(filePath) {
  validateFilePaths(filePath)
  try {
    const stats = await statP(filePath)
    return stats.isDirectory()
  } catch (e) {
    return false
  }
}

/**
 * validate File Paths
 * @param  {array|string} filePaths - paths to validate
 * @return {null}
 */
function validateFilePaths(filePaths) {
  const paths = (Array.isArray(filePaths)) ? filePaths : [filePaths]
  const invalidPaths = paths.filter((p) => {
    return isInvalidPath(p)
  }).map((p) => {
    return `${p} is an invalid file path`
  })

  if (invalidPaths.length) {
    throw new Error(invalidPaths.join(', '))
  }
}

async function copyDir(src, dest) {
  // Validate file paths
  validateFilePaths([ src, dest ])
  // Ensure directory is created
  await makeDir(dest)
  // Then copy file
  await copy(src, dest, {
    utimes: true, // keep add time and modify time
    mode: true, // keep file mode
    cover: true // cover file when exists, default is true
  })
}

async function getFileDirectory(filePath) {
  validateFilePaths(filePath)
  if (await isDirectory(filePath)) {
    return filePath
  }
  return path.dirname(filePath)
}

function fileExists(filePath) {
  validateFilePaths(filePath)
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.F_OK, (err) => {
      if (err) return resolve(false)
      return resolve(true)
    })
  })
}

module.exports = function serverlessPlugin(opts) {
  return {
    name: 'serverless-plugin',
    onInit: async ({ constants, utils }) => {
      const SERVERLESS_CACHE_DIR = path.resolve(constants.CACHE_DIR, '.serverless')
      const SERVERLESS_HIDDEN_DIR = path.resolve(await getFileDirectory(opts.path), '.serverless')
      const hasFileCached = await utils.cache.has(SERVERLESS_HIDDEN_DIR)
      
      if (hasFileCached && constants.IS_LOCAL) {
        await utils.cache.restore(SERVERLESS_HIDDEN_DIR)
      }

      if (await fileExists(SERVERLESS_CACHE_DIR)) {
        console.log('Previous deployment here. Restore from cache')
      } else {
        console.log('nothing to restore')
      }
    },
    // Deploy backend on preBuild
    onPreBuild: async ({ constants, utils }) => {
      try {
        await runServerless('serverless deploy --verbose', opts)
      } catch (err) {
        throw new Error(err.message)
      }

      const destination = path.resolve(constants.CACHE_DIR, '.serverless')
      console.log('Cache dest', destination)
      const source = path.resolve(await getFileDirectory(opts.path), '.serverless')
      console.log('Cache source', source)

      // If .serverless src dir exists, do stuff with it
      if (await fileExists(source)) {
        await utils.cache.save([ source ], { ttl: 3600 })
        // Copy over the files
        await copyDir(source, destination)
        console.log(`${source} copied to ${destination}`)
        const hash = await hashDir(source)
        console.log('hash', hash)
        const stateHash = await hashFile(path.resolve(source, 'serverless-state.json'))
        console.log('stateHash', stateHash)
      }
    },
  }
}

async function getServerlessDirectory(relativePath) {
  const filePath = path.resolve(relativePath)
  const slsPath = await getServerlessConfigPath(filePath)
  return path.dirname(slsPath)
}

async function getServerlessConfigPath(filePath) {
  const isDir = await isDirectory(filePath)
  if (!isDir && !isServerlessFile(filePath)) {
    throw new Error(`
    Error with serverless "path" passed into the serverless plugin config.
    Value "${filePath}" is invalid.
    No serverless config found in that location.
    Please double check this value and try again`)
  }
  const cleanPath = (isDir) ? filePath : path.dirname(filePath)
  const yml = path.resolve(cleanPath, 'serverless.yml')
  const yaml = path.resolve(cleanPath, 'serverless.yaml')
  const json = path.resolve(cleanPath, 'serverless.json')
  const js = path.resolve(cleanPath, 'serverless.js')
  if (await fileExists(yml)) {
    return yml
  } else if (await fileExists(yaml)) {
    return yaml
  } else if (await fileExists(json)) {
    return json
  } else if (await fileExists(js)) {
    return js
  }
  throw new Error(`No serverless config file found in ${filePath}`)
}

function isServerlessFile(filePath) {
  return filePath.match(/serverless\.(yml|yaml|json|js\.yml)$/)
}

async function runServerless(cmd, opts) {
  if (!opts.path) {
    throw new Error('No serverless config set')
  }
  if (!opts.AWS_ACCESS_KEY_ID || !opts.AWS_SECRET_ACCESS_KEY) {
    console.log('No AWS keys provided. Skipping Serverless deploy')
  }

  if (typeof opts.serverlessConfig === 'object') {
    // const yml = formatUtils.yaml.dump(opts.serverlessConfig)
    // console.log(yml)
  }

  // Resolve the cwd of where serverless project lives
  const cwdPath = await getServerlessDirectory(opts.path)
  console.log(`Running command "${cmd}"\nin directory ${cwdPath}`)
  const subprocess = execa(`${cmd}`, {
    cwd: cwdPath,
    shell: true,
    preferLocal: true,
    localDir: path.resolve(__dirname),
    env: Object.assign({}, process.env, {
      AWS_ACCESS_KEY_ID: opts.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: opts.AWS_SECRET_ACCESS_KEY
    })
  })
  subprocess.stdout.pipe(process.stdout, { end: true })
  try {
    const { stdout } = await subprocess
    return stdout
  } catch (err) {
    if (err.stdout && err.stdout.match(/The security token included in the request is invalid/)) {
      const msg = 'Incorrect AWS credentials. Please double check AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY values'
      console.log(`>  ${msg}`)
      throw new Error(msg)
    }
    throw new Error(err)
  }
}
