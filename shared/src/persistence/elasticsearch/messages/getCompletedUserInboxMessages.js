const { calculateISODate } = require('../../../business/utilities/DateHandler');
const { search } = require('../searchClient');

exports.getCompletedUserInboxMessages = async ({
  applicationContext,
  userId,
}) => {
  const filterDate = calculateISODate({ howMuch: -7 });

  const query = {
    body: {
      query: {
        bool: {
          must: [
            {
              term: { 'completedByUserId.S': userId },
            },
            {
              term: { 'isCompleted.BOOL': true },
            },
            {
              range: {
                'completedAt.S': {
                  format: 'strict_date_time', // ISO-8601 time stamp
                  gte: filterDate,
                },
              },
            },
          ],
        },
      },
      size: 5000,
    },
    index: 'efcms-message',
  };

  const { results } = await search({
    applicationContext,
    searchParameters: query,
  });

  return results;
};
