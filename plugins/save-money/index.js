const fetch = require('node-fetch')

/* Netlify plugin example */
function netlifyPlugin(config) {
  return {
    name: 'save-me-money',
    onInit: async ({ pluginConfig, constants }) => {
      const { netlifyToken, siteId } = pluginConfig
      if (!netlifyToken) {
        throw new Error(`Missing Netlify API token. Please include or generate one here https://app.netlify.com/user/applications`)
      }

      const id = constants.SITE_ID || siteId
      const siteInfo = await getSiteInfo(id, netlifyToken)

      const teamName = siteInfo.account_slug
      const stats = await getBuildStats(teamName, netlifyToken)

      const account = await getAccountDetails(teamName, netlifyToken)
      const capabilities = account.capabilities || { build_minutes: { included: 300 } }
      const allowedBuildMinutes = capabilities.build_minutes.included
      const currentBuildMinutes = stats.minutes.current

      console.log(`Allowed Build minutes per month ${allowedBuildMinutes}`)
      console.log(`Current build minute usage ${currentBuildMinutes}`)

      if (currentBuildMinutes > allowedBuildMinutes) {
        console.log('Ooops we are at the limit. Do stuff')
        // Exit build early
        // Pause builds
        // Send me an email
      }
    },
  }
}

async function getSiteInfo(siteId, apiToken) {
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })
  return response.json()
}

async function getBuildStats(teamName, apiToken) {
  const response = await fetch(`https://api.netlify.com/api/v1/${teamName}/builds/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })
  return response.json()
}

async function getAccountDetails(teamName, apiToken) {
  const response = await fetch(`https://api.netlify.com/api/v1/accounts/${teamName}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })
  return response.json()
}

module.exports = netlifyPlugin
