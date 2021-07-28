const AWS = require('aws-sdk');
const { getClient } = require('../../web-api/elasticsearch/client');
const dynamodb = new AWS.DynamoDB({
  maxRetries: 10,
  region: 'us-east-1',
  retryDelayOptions: { base: 300 },
});

const sourceDb = process.argv[2]; // 'efcms-mig-beta';
const ESClusterConfig = {
  environmentName: process.argv[3], // 'mig'
  version: 'alpha',
};
const segmentNum = process.argv[4]; // 53294;
const totalSegments = process.argv[5]; // 68057;

const dynamoDbDocumentClient = new AWS.DynamoDB.DocumentClient({
  endpoint: 'dynamodb.us-east-1.amazonaws.com',
  region: 'us-east-1',
  service: dynamodb,
});

const itemCounts = {};

const findRecordInElasticSearch = async ({ esClient, index, item }) => {
  return await esClient.search({
    _source: ['pk.S', 'sk.S'],
    body: {
      query: {
        bool: {
          must: [
            {
              term: {
                'pk.S': item.pk,
              },
            },
            {
              term: {
                'sk.S': item.sk,
              },
            },
          ],
        },
      },
    },
    index,
  });
};

const processItems = async ({ esClient, items }) => {
  for (const item of items) {
    itemCounts[item.entityName] = itemCounts[item.entityName]
      ? itemCounts[item.entityName] + 1
      : 1;
    let index;
    switch (item.entityName) {
      case 'WorkItem':
        console.log({
          pk: item.pk,
          sk: item.sk,
        });
        continue;

      case 'Case':
        index = 'efcms-case';
        break;
      case 'DocketEntry':
        index = 'efcms-docket-entry';
        break;
      default:
        // console.log(item.entityName);
        // if (!item.entityName) {
        //   console.log(item);
        // }
        continue;
    }

    const res = await findRecordInElasticSearch({ esClient, index, item });

    // if (res.hits.total.value === 0) {
    console.log({
      found: res.hits.total.value > 0,
      pk: item.pk,
      sk: item.sk,
    });
    // }
  }
};

const scanTableSegment = async (segment, { esClient }) => {
  let hasMoreResults = true;
  let lastKey = null;
  while (hasMoreResults) {
    hasMoreResults = false;
    console.log('---- getting another page of information...');
    // console.log(itemCounts);

    await dynamoDbDocumentClient
      .scan({
        ExclusiveStartKey: lastKey,
        Segment: segment,
        TableName: sourceDb,
        TotalSegments: totalSegments,
      })
      .promise()
      .then(async results => {
        hasMoreResults = !!results.LastEvaluatedKey;
        lastKey = results.LastEvaluatedKey;
        await processItems({
          esClient,
          items: results.Items,
        });
      });
  }
};

(async () => {
  const esClient = await getClient(ESClusterConfig);
  await scanTableSegment(segmentNum, { esClient });
  console.log(itemCounts);
})();
