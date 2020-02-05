
module.exports = () => {
  return {
    name: 'netlify-plugin-cache-test',
    async onPreBuild({ netlifyConfig, utils }) {
      const { cache } = utils
      const filePath = `${netlifyConfig.build.publish}/test-dir`

      const hasCache = await cache.has([ filePath ])

      if (hasCache) {
        console.log(`Found cache`)
        console.log(`Restore cache to ${filePath}`)
        await cache.restore([ filePath ])
        console.log('Loaded a previous cache. ⚡️')
      } else {
        console.log('No cache found. Do expensive thing')
      }
    },
    async onPostBuild({ netlifyConfig, utils }) {
      const { cache } = utils
      const filePath = `${netlifyConfig.build.publish}/test-dir`

      // Save the files to cache
      const hasItSaved = await cache.save([ filePath ])
      if (hasItSaved) {
        console.log('Cache saved for next run')
      } else {
        console.log('No changes detected, skipping save to speed things up')
      }

      // Verify the files are there in cache
      if (await cache.has(filePath)) {
        console.log(`Found cache ${filePath}`)
      } else {
        console.log('No cache dir!')
      }
    },
  }
}
