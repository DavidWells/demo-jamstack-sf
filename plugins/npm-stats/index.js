const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const npmtotal = require('npmtotal')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const NAME = 'netlify-plugin-my-npm-stats'

module.exports = (conf) => {
  return {
    name: NAME,
    async onBuild({ netlifyConfig, utils }) {
      const { cache } = utils
      const { npmUserName, excludePackages } = conf
      const npmStatsDataPath = getDataFilePath(netlifyConfig.build.publish, npmUserName)
      if (!npmUserName) {
        throw new Error(`Missing npmUserName in ${NAME}`)
      }

      const hasFileCached = await cache.has([ npmStatsDataPath ])
      if (!hasFileCached) {
        console.log('No cache found. Fetch data from NPM')
        let options = {}
        if (excludePackages) {
          options.exclude = excludePackages
        }
        console.log(`Fetching NPM data for ${npmUserName}`)
        console.log(`This can take a while depending on the number of packages ${npmUserName} has`)
        const stats = await npmtotal(npmUserName, options)
        // Write file
        await writeFile(npmStatsDataPath, JSON.stringify(stats, null, 2))
        // Then save to cache for later
        await cache.save([ npmStatsDataPath ], { ttl: 3600 })
        return
      }
      // Has cache, go fast
      console.log(`Found NPM stats cache`)
      console.log(`Restore cache to ${npmStatsDataPath}`)
      await cache.restore([ npmStatsDataPath ])
      console.log('Loaded a previous cache. ⚡️')
    },
    async onPostBuild({ netlifyConfig, constants, utils }) {
      const { npmUserName } = conf
      const npmStatsDataPath = getDataFilePath(netlifyConfig.build.publish, npmUserName)

      const contents = await readFile(npmStatsDataPath, 'utf-8')
      const data = JSON.parse(contents)

      const htmlPage = generateHtmlPage(conf.npmUserName, data)

      const outputPage = path.join(netlifyConfig.build.publish, 'npm-stats.html')
      console.log(`Creating NPM stats page`)
      console.log(outputPage)
      await writeFile(outputPage, htmlPage)
    },
  }
}

function getDataFilePath(buildDir, username) {
  return `${buildDir}/npm-stats-${username}.json`
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/* Utility function for rendering HTML */
function generateHtmlPage(username, data) {
  const list = data.stats.map((pkg) => {
    const [name, count] = pkg
    return `<li>${name} - ${numberWithCommas(count)}</li>`
  })
  return `
    <html>
      <title>${username} NPM stats</title>
      <style>
        h1 { color: #73757d }
      </style>
      <body>
        <h1>${username} NPM Stats</h1>
        <h3>Total downloads: ${numberWithCommas(data.sum)}</h3>
        <ul>
          ${list.join('\n')}
        </ul>
      </body>
    </html>`
}
