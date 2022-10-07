module.exports = {
  view: 'odeuropa-vocabulary',
  showInNavbar: true,
  showInHome: true,
  details: {
    view: 'odeuropa-vocabulary-details',
    showPermalink: false,
    excludedMetadata: [],
    route: 'texts',
    query: ({ language }) => ({
      $from: 'http://www.ontotext.com/disable-sameAs', // Prevent returning Wikidata entities
      '@graph': [
        {
          '@id': '?id',
          label: '?label',
          related: {
            '@id': '?related',
            label: '?relatedLabel',
          },
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

        # Properties
        {
          ?id skos:prefLabel ?label .
          FILTER(LANG(?label) = "${language}" || LANG(?label) = "")
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
            ?assignment crm:P141_assigned/rdfs:label ?adjective .
            ?assignment crm:P140_assigned_attribute_to ?smell .
          }
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
  query: ({ language }) => ({
    $from: 'http://www.ontotext.com/disable-sameAs', // Prevent returning Wikidata entities
    '@graph': [
      {
        '@id': '?id',
        label: '?sourceLabel',
      },
    ],
    $where: [
      `
      {
        SELECT DISTINCT ?id WHERE {
          ?emission od:F3_had_source / crm:P137_exemplifies ?id .
        }
      }
      {
        ?id skos:prefLabel ?sourceLabel .
        FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
      }
      `,
    ],
    $orderby: 'ASC(?sourceLabel)',
    $langTag: 'hide',
  }),
};
