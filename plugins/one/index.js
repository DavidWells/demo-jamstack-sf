
/* Netlify plugin example */
function netlifyPlugin(config) {
  return {
    name: 'my-plugin-one',
    onInit: () => {
      console.log('Hi from init')
    },
    onPreBuild: () => {
      console.log('Hi from preBuild')
    },
    onPostBuild: () => {
      console.log('Hi from postBuild')
    },
    onSuccess: () => {
      console.log('Hi from onSuccess')
    }
  }
}

module.exports = netlifyPlugin
