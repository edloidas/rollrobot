const Botan = require('botanio');
const CONFIG = require('./config');

const { token } = CONFIG.botan;
const analytics = Botan(token);

function track(msg, name, callback) {
  analytics.track(msg, name, callback);
}

function trackInline(msg, callback) {
  analytics.track(msg, 'Inline', callback);
}

module.exports = {
  track,
  trackInline
};
