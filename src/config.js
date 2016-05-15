const config = {
  token: process.env.TOKEN,
  options: {
    webHook: {
      port: process.env.PORT || 443,
      host: process.env.HOST || '0.0.0.0'
    }
  },
  telegram: {
    port: 443,
    host: process.env.URL || 'https://rollrobot.herokuapp.com'
  }
};

module.exports = config;
