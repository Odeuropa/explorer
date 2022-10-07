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
      getQueryObject(config.plugins['odeuropa-vocabulary'].wordCloud.query, {
        language: query.locale,
      })
    )
  );
  wordCloudQuery.$filter = wordCloudQuery.$filter || [];
  wordCloudQuery.$filter.push(`?id = <${query.id}>`);

  const wordCloudQueryRes = await SparqlClient.query(wordCloudQuery, {
    endpoint: config.api.endpoint,
    debug: config.debug,
    params: config.api.params,
  });

  const wordCloud = [];
  if (wordCloudQueryRes['@graph'][0]) {
    wordCloud.push(...removeEmptyObjects(wordCloudQueryRes['@graph'][0]).word);
  }

  res.status(500).json(wordCloud);
});
