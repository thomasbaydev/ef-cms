const { genericHandler } = require('../genericHandler');

/**
 * used for fetching a single case
 *
 * @param {object} event the AWS event object
 * @returns {Promise<*|undefined>} the api gateway response object containing the statusCode, body, and headers
 */
exports.getPublicDocumentDownloadUrlLambda = event =>
  genericHandler(
    event,
    async ({ applicationContext }) => {
      return await applicationContext
        .getUseCases()
        .getPublicDownloadPolicyUrlInteractor(applicationContext, {
          ...event.pathParameters,
        });
    },
    { user: {} },
  );
