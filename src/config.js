module.exports = {
  token: process.env.TOKEN || '1234567890abcdef',
  settings: {
    webHook: {
      port: process.env.PORT || 443,
      host: process.env.HOST || '0.0.0.0'
    }
  },
  telegram: {
    port: 443,
    host: process.env.URL || 'https://rollrobot.vercel.app/'
  }
};
