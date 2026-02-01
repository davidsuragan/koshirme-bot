const { getTikTokData} = require('./tt');
const { getInstaData } = require('./ig');
// const { getFbData } = require('./fb');
const { getYtData } = require('./yt');
const { getThreadsData } = require('./th');

module.exports = {
  getTikTokData,
  getInstaData,
  getThreadsData,
  // getFbData,
  getYtData
};