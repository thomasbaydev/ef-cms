const client = require('../../dynamodbClientService');

/**
 * deleteCaseNote
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.caseId the id of the case the notes are associated with
 * @param {string} providers.userId the id of the user who owns the case notes
 * @returns {Array<Promise>} the promises for the persistence delete calls
 */
exports.deleteCaseNote = async ({ applicationContext, caseId, userId }) => {
  return await client.delete({
    applicationContext,
    key: {
      pk: `case-note|${caseId}`,
      sk: `${userId}`,
    },
  });
};
