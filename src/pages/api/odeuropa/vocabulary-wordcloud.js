import SparqlClient from '@helpers/sparql';
import { getQueryObject, removeEmptyObjects } from '@helpers/utils';
import { withRequestValidation } from '@helpers/api';
import config from '~/config';

export default withRequestValidation({
  allowedMethods: ['GET'],
})(async (req, res) => {
  const { query } = req;

  const route = config.routes[query.type];
  if (!route) {
    res.status(404).json({ error: { message: 'Route not found' } });
    return;
  }

  const configQuery = query.cloud
    ? route.plugins?.['odeuropa-vocabulary']?.wordCloud?.[query.cloud]?.query
    : route.plugins?.['odeuropa-vocabulary']?.wordCloud?.query;

  if (!configQuery) {
    res.status(404).json({ error: { message: 'Query not found' } });
    return;
  }

  const wordCloudQuery = JSON.parse(
    JSON.stringify(
      getQueryObject(configQuery, {
        id: query.id,
        date: query.date,
        tag: query.tag,
        language: query.locale,
      })
    )
  );
  if (!wordCloudQuery.$values) {
    wordCloudQuery.$values = {};
  }
  wordCloudQuery.$values['?id'] = [query.id];

  const debugSparqlQuery = await SparqlClient.getSparqlQuery(wordCloudQuery);

  const wordCloudQueryRes = await SparqlClient.query(wordCloudQuery, {
    endpoint: config.api.endpoint,
    debug: config.debug,
    params: config.api.params,
  });

  const wordCloud = wordCloudQueryRes['@graph'][0]
    ? removeEmptyObjects([].concat(wordCloudQueryRes['@graph'])).reduce((acc, cur) => {
        acc[cur['@id']] = cur.count;
        return acc;
      }, {})
    : {};

  res.status(200).json({
    results: wordCloud,
    debugSparqlQuery,
  });
});
