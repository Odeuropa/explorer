module.exports = {
  view: 'odeuropa-vocabulary',
  showInNavbar: true,
  showInHome: false,
  details: {
    view: 'odeuropa-vocabulary-details',
    showPermalink: true,
    excludedMetadata: [],
  },
  query: ({ language }) => ({
    '@graph': [
      {
        '@id': '?id',
        label: '?sourceLabel',
        related: {
          '@id': '?related',
          label: '?relatedLabel',
        },
        adjective: '?adjective',
      },
    ],
    $where: [
      `
      {
        SELECT DISTINCT ?id ?smell WHERE {
          ?emission od:F1_generated ?smell .
          ?emission od:F3_had_source / crm:P137_exemplifies ?id .
        }
      }
      {
        ?id skos:prefLabel ?sourceLabel .
        FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
      }
      UNION
      {
        OPTIONAL {
          ?id skos:related ?related .
          ?related skos:prefLabel ?relatedLabel .
          FILTER(LANG(?relatedLabel) = "${language}" || LANG(?relatedLabel) = "")
        }
      }
      UNION
      {
        OPTIONAL {
          ?assignment a crm:E13_Attribute_Assignment .
          ?assignment crm:P141_assigned ?adjective .
          ?assignment crm:P140_assigned_attribute_to ?smell .
        }
      }
      `
    ],
    $orderby: 'ASC(?sourceLabel)',
    $langTag: 'hide',
  }),
};
