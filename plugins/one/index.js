
/* Netlify plugin example */
function netlifyPlugin(config) {
  return {
    init: () => {
      console.log('Hi from init')
      throw new Error('ooooo no!')
    },
    preBuild: () => {
      console.log('Hi from preBuild')
    },
    postBuild: () => {
      console.log('Hi from postBuild')
    },
    finally: () => {
      console.log('Hi from finally')
    }
  }
}

module.exports = netlifyPlugin
