const { put } = require('../../dynamodbClientService');

/**
 * saveUserConnection
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.connectionId the websocket connection id
 * @param {string} providers.endpoint the websocket endpoint url
 * @param {string} providers.userId the user id
 * @returns {Promise} the promise of the call to persistence
 */
exports.saveUserConnection = async ({
  applicationContext,
  connectionId,
  endpoint,
  userId,
}) => {
  const TIME_TO_EXIST = 60 * 60 * 24;
  return await put({
    Item: {
      connectionId,
      endpoint,
      gsi1pk: `connection|${connectionId}`,
      pk: `user|${userId}`,
      sk: `connection|${connectionId}`,
      // eslint-disable-next-line @miovision/disallow-date/no-static-date
      ttl: Math.floor(Date.now() / 1000) + TIME_TO_EXIST,
    },
    applicationContext,
  });
};
