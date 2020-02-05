const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const npmtotal = require('npmtotal')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const NAME = 'netlify-plugin-npm-stats-page'

module.exports = (conf) => {
  return {
    name: NAME,
    async onBuild({ netlifyConfig, utils }) {
      const { cache } = utils
      const npmStatsDataPath = `${netlifyConfig.build.publish}/npm-stats.json`
      if (!conf.npmUserName) {
        throw new Error(`Missing npmUserName in ${NAME}`)
      }

      const hasFileCached = await cache.has([ npmStatsDataPath ])
      if (!hasFileCached) {
        console.log('No cache found. Fetch data from NPM')
        let options = {}
        if (conf.exclude) {
          options.exclude = conf.exclude
        }
        console.log(`Fetching NPM data for ${conf.npmUserName}`)
        console.log(`This can take a while depending on the number of packages ${conf.npmUserName} has`)
        const stats = await npmtotal(conf.npmUserName, options)
        console.log('stats', stats)
        // Write file
        await writeFile(npmStatsDataPath, JSON.stringify(stats, null, 2))
        // Then save to cache for later
        await cache.save([ npmStatsDataPath ], { ttl: 3600 })
        return
      }

      console.log(`Found cache`)
      console.log(`Restore cache to ${npmStatsDataPath}`)
      await cache.restore([ npmStatsDataPath ])
      console.log('Loaded a previous cache. ⚡️')
    },
    async onPostBuild({ netlifyConfig, utils }) {
      const npmStatsDataPath = `${netlifyConfig.build.publish}/npm-stats.json`

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

/* Utility function for rendering HTML */
function generateHtmlPage(username, data) {
  const list = data.stats.map((pkg) => {
    const [name, count] = pkg
    return `<li>${name} - ${count}</li>`
  })
  return `
    <html>
      <style>
        h1 { color: #73757d }
      </style>
      <body>
        <h1>${username} NPM Stats</h1>
        <h3>Total downloads: ${data.sum}</h3>
        <ul>
          ${list.join('\n')}
        </ul>
      </body>
    </html>`
}
