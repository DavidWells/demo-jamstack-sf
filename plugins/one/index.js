
/* Netlify plugin example */

module.exports = function pluginOne() {
  return {
    // Name of plugin
    name: 'netlify-plugin-example',
    inputs: {
      foo: {
        type: 'string',
        when: ''
      }
    },
    // Config needed for plugin
    onPostBuild: ({ pluginConfig }) => {
      // Do stuff during after build
      console.log(pluginConfig.foo)

      return {
        myOutput: 'lol'
      }
    }
  }
}


















/*
module.exports = function pluginOne(pluginConfig) {
  return {
    // Name of plugin
    name: 'plugin-one',
    // Config needed for plugin
    config: {
      foo: {
        type: 'string',
        when: 'onPostBuild'
      }
    },
    config: {
      foo: {
        type: 'string',
        when: 'onPostBuild'
        required: true,
      }
    },
    config: {
      /* All fields example */
      twilioNumber: {
        /* Text used for visual displays in CLI/UI. If empty, defaults to config key */
        displayName: 'Twilio Phone number',
        /* Description text used for visual displays in CLI/UI to help users input/find values */
        description: 'Number required for service to function',
        /* Type of input accepted */
        type: 'string',
        /* When specifies when the configuration value is needed & where it will be used */
        when: 'onInit',
        /* Is the input required or optional? Default false */
        required: true,
        /* Default value used if none supplied */
        default: '1-888-888-8888',
        /* Whether to mask the value to prevent it from being displayed in the logs, CLI, or API */
        sensitive: true,
        /* Regular expression that this string should match. Only applicable to strings */
        pattern: /^([0-9\(\)\/\+ \-]*)$/,
      },
    }
    // Outputs returned for DAG resolution
    outputs: {
      myOutput: {
        type: 'string',
        when: 'onPostBuild'
      }
    },
    onPreBuild: ({ pluginConfig }) => {
      console.log(pluginConfig.biz)
      return {
        wow: 'nice'
      }
    },
  }
}
*/
