const path = require('path')
const getCacheInfo = require('whats-in-the-cache')

module.exports = function netlifyPlugin(config) {
  return {
    name: 'netlify-plugin-debug-cache',
    onInit: async ({ pluginConfig, constants }) => {
      console.log('For diffing')
    },
    onEnd: async ({ constants, pluginConfig }) => {
      const { BUILD_DIR, CACHE_DIR } = constants
      const cacheManifestFileName = pluginConfig.outputFile || 'cache-output.json'
      const cacheManifestPath = path.join(BUILD_DIR, cacheManifestFileName)
      console.log('Saving cache file manifest for debugging...')
      let files = []
      try {
        files = await getCacheInfo({
          cacheDirectory: CACHE_DIR,
          outputPath: cacheManifestPath,
        })
      } catch (err) {
        console.log(`netlify-plugin-debug-cache error`)
        console.log(err)
      }
      console.log(`Cache file count: ${files.length}`)
      console.log(`Cache manifest saved to ${cacheManifestPath}`)
      console.log(`Please download the build to inspect ${cacheManifestFileName}. http://bit.ly/netlify-dl-cache`)
    }
  }
}
