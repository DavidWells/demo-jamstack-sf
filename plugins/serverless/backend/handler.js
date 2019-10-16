'use strict';

module.exports.hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hi jamstack conf SF! I was deployed with a Netlify Plugin',
        joinTheBeta: 'http://netlify.com/build/plugins-beta/'
      },
      null,
      2
    ),
  };
};
