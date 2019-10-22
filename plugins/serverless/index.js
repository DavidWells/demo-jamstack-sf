const { resolve, dirname, join } = require('path')
const { promisify } = require('util')
const fs = require('fs')
const execa = require('execa')

module.exports = function serverlessPlugin(opts) {
  return {
    name: 'serverless-plugin',
    // Deploy backend on preBuild
    preBuild: async () => {
      try {
        await runServerless('serverless deploy --verbose', opts)
      } catch (err) {
        console.log('err', err)
        // throw new Error(err.message)
      }
    },
  }
}

async function isDirectory(filePath) {
  try {
    return (await promisify(fs.lstat)(filePath)).isDirectory()
  } catch (e) {
    return false // or custom the error
  }
}

function fileExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.F_OK, (err) => {
      if (err) {
        return resolve(false)
      }
      return resolve(true)
    })
  })
}

async function resolveConfigPath(relativePath) {
  const filePath = resolve(relativePath)
  const isDir = isDirectory(filePath)
  if (isDir) {
    const slsFile = join(filePath, 'serverless.yml')
    if (await fileExists(slsFile)) {
      return filePath
    }
    return dirname(filePath)
  }
  return filePath
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

  // Todo fix bug with path resolution
  const cwdPath = await resolveConfigPath(opts.path)
  console.log(`Running command "${cmd}"\nin directory ${cwdPath}`)
  const subprocess = execa(`${cmd}`, {
    cwd: cwdPath,
    shell: true,
    preferLocal: true,
    localDir: resolve(__dirname),
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
    if (err.stdout.match(/The security token included in the request is invalid/)) {
      console.log('Incorrect AWS credentials. Please double check AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY values')
    }
    throw new Error(err)
  }
}
