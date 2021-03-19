const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const { Message } = require('../../entities/Message');
const { UnauthorizedError } = require('../../../errors/errors');

/**
 * getCompletedMessagesForUserInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.userId the user to get the inbox messages
 * @returns {object} the messages in the user inbox
 */
exports.getCompletedMessagesForUserInteractor = async (
  applicationContext,
  { userId },
) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.VIEW_MESSAGES)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const messages = await applicationContext
    .getPersistenceGateway()
    .getCompletedUserInboxMessages({
      applicationContext,
      userId,
    });

  return Message.validateRawCollection(messages, {
    applicationContext,
  });
};
