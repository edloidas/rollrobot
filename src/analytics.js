/* eslint-disable no-unused-vars */
// const Analytics = require('analytics');
const CONFIG = require('./config');

const { token } = CONFIG.analytics;
// const analytics = Analytics(token);

function track(msg, name, callback) {
  // analytics.track(msg, name, callback);
}

function trackInline(msg, callback) {
  // analytics.track(msg, 'Inline', callback);
}

module.exports = {
  track,
  trackInline
};
