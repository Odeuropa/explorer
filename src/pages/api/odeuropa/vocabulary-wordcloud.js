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

  const wordCloudQuery = JSON.parse(
    JSON.stringify(
      getQueryObject(route.plugins['odeuropa-vocabulary'].wordCloud.query, {
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

  const wordCloud = [];
  if (wordCloudQueryRes['@graph'][0]) {
    wordCloud.push(...removeEmptyObjects([].concat(wordCloudQueryRes['@graph'][0].word)));
  }

  res.status(200).json({
    results: wordCloud,
    debugSparqlQuery,
  });
});
