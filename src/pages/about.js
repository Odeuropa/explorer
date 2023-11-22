import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Layout from '@components/Layout';
import Header from '@components/Header';
import Footer from '@components/Footer';
import Body from '@components/Body';
import PageTitle from '@components/PageTitle';

const AboutPage = () => {
  const { t } = useTranslation(['common']);

  return (
    <Layout>
      <PageTitle title={t('common:home.title')} />
      <Header />
      <Body>
        <article
          style={{ width: '70%', margin: '2em auto' }}
          itemtype="https://schema.org/CreativeWork"
          itemscope=""
        >
          <div class="inside-article">
            <header class="entry-header" aria-label="Content">
              <h1 class="entry-title" itemprop="headline">
                Smell Explorer
              </h1>{' '}
            </header>

            <div class="entry-content" itemprop="text">
              <p>
                The <em>Odeuropa Smell Explorer</em> is a brand-new web tool developed for the
                exploration of smell as a cultural phenomenon. This searchable website enables you
                to discover the smells the past and understand how they shaped European history and
                culture. The Smell Explorer is the result of three years of intensive research and
                development by an international team of computer scientists, AI experts and
                humanities scholars. Its target audiences are scholars, perfumers, heritage
                professionals, artists, and basically anyone with an interest in the world of
                scents, in olfactory language and imagery, and in the important role scents play in
                our daily lives.
              </p>
              <p>
                <a href="https://odeuropa.eu/wp-content/uploads/2023/08/explorer-overview.png">
                  <img
                    decoding="async"
                    fetchpriority="high"
                    class="aligncenter wp-image-2230"
                    src="https://odeuropa.eu/wp-content/uploads/2023/08/explorer-overview-1024x708.png"
                    alt=""
                    width="613"
                    height="424"
                    srcset="https://odeuropa.eu/wp-content/uploads/2023/08/explorer-overview-1024x708.png 1024w, https://odeuropa.eu/wp-content/uploads/2023/08/explorer-overview-300x208.png 300w, https://odeuropa.eu/wp-content/uploads/2023/08/explorer-overview-768x531.png 768w, https://odeuropa.eu/wp-content/uploads/2023/08/explorer-overview.png 1184w"
                    sizes="(max-width: 613px) 100vw, 613px"
                    style={{
                      clear: 'both',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </a>
              </p>
              <h4>Where can I find the Explorer?</h4>
              <p>
                An early version of the<em>&nbsp;Smell Explorer</em> is already accessible online at{' '}
                <a href="https://explorer.odeuropa.eu">https://explorer.odeuropa.eu</a> (please note
                that the tool is still under development and may contain errors). The official
                launch will be on November 28, 2023. The underlying open access data and open source
                software can be found on Odeuropa’s{' '}
                <a href="https://github.com/Odeuropa">Github repositories</a>.
              </p>
              <h4>How was the Explorer developed?</h4>
              <p>
                The data in the <em>Smell Explorer</em> was extracted from 23,000 images and 62,000
                historic texts in six languages (English, Italian, French, Dutch, German and
                Slovene) available in the public domain.
              </p>
              <p>
                The Odeuropa computer vision team developed techniques to detect objects associated
                with smell in images. After a set of 5000 images were manually annotated, the team
                trained the computer to recognise similar smell-related elements and used machine
                learning techniques to expend the database. Thus, the computer captures ‘smell
                sources’ (odorants and objects with smells such as perfume bottles), fragrant places
                and smell gestures (smelling, pinching the nose).
              </p>
              <p>
                To complement the images with mentions to smells and smell experiences in texts, our
                computer science teams manually annotated thousands of historic books including
                novels, theatre scripts, travel writing, botanical textbooks, court records,
                sanitary reports, sermons, and medical handbooks. Using these examples, we developed
                an automated system that can replicate the manual annotation by identifying in texts
                smell-related information (who smells what where and what characteristics are used
                to describe the scent?), including smell-related emotions.
              </p>
              <p>
                <a href="https://odeuropa.eu/wp-content/uploads/2023/08/explorer-results.png">
                  <img
                    decoding="async"
                    class="aligncenter wp-image-2231"
                    src="https://odeuropa.eu/wp-content/uploads/2023/08/explorer-results-1024x782.png"
                    alt=""
                    width="613"
                    height="468"
                    srcset="https://odeuropa.eu/wp-content/uploads/2023/08/explorer-results-1024x782.png 1024w, https://odeuropa.eu/wp-content/uploads/2023/08/explorer-results-300x229.png 300w, https://odeuropa.eu/wp-content/uploads/2023/08/explorer-results-768x586.png 768w, https://odeuropa.eu/wp-content/uploads/2023/08/explorer-results.png 1180w"
                    sizes="(max-width: 613px) 100vw, 613px"
                    style={{
                      clear: 'both',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </a>
              </p>
              <p>
                Our semantic web experts have used these results to develop a user-friendly
                interface to search and browse through smell-related text and images. For this, they
                first designed an event-based ontology. The Explorer is organised as a Knowledge
                Graph, a semantically rich database where the multi-modal information has been
                curated and stored, following semantic web standards. In July 2023 it already held
                nearly 800.000 olfactory depictions and descriptions.
              </p>
              <h4>What kind of questions can the Smell Explorer answer?</h4>
              <p>
                What are the most significant smells and smellscapes of Europe? What scents are most
                discussed in historical texts and what reactions did they evoke? What odorants were
                used in a pomander or in potpourri? What olfactory objects and fragrant places are
                most depicted in paintings and prints? Are woody smells more appreciated than
                fruity, or animalistic smells? How did ‘nose witnesses’ describe their smell
                experiences? Are smell words in Italian comparable to those in English, French,
                Slovenian or Dutch? Where could one smell civet or sulphur in the 18th century? What
                emotions can be evoked by the smell of incense? How are scents classified?
              </p>
              <p>
                The <em>Odeuropa Smell Explorer</em> can provide answers to all these questions. It
                is the first database that can be queried ‘nose-first’ (using the sense of smell as
                an entry point), thanks to the unique technologies used to design the tool. This
                makes it a valuable resource for anyone interested in understanding how the past
                smelled and how smell experiences were described and depicted.
              </p>
              <p>
                Whereas most websites focus on fine fragrances, the Explorer will help you nosedive
                into all kinds of significant smellscapes, foul or fragrant. It can help perfumers
                discover how scents were classified into different scent families and what
                sentiments were attached to what aromas. It can help scientists compute odour
                landscapes. Art historians may find new olfactory allegories and iconographies.
                Aromatherapists can discover ancient recipes. The Explorer generates insightful
                quotes about the values of smell. In general, the Explorer provides a unique
                opportunity to tap into the nose wisdom of the past. You can also review the{' '}
                <a href="https://github.com/Odeuropa/ontology/tree/master/competency_questions">
                  competency questions
                </a>{' '}
                the Odeuropa team used to develop the Explorer.
              </p>
              <h4>How can I browse or search the database?</h4>
              <p>The Smell Explorer provides two major options for querying the data:</p>
              <p>1. Browse by smell sources and fragrant spaces</p>
              <p>
                The Explorer provides the opportunity to browse over 550 smell sources, 115 fragrant
                spaces and 35 olfactory gestures. Separate pages give entry to these searches. The
                Smell Source page lists objects and substances which are recognised to emit on
                odour. Visitors can order them alphabetically or by occurrence. Clicking on a smell
                source will lead to a new page dedicated to that source. This provides: 1. A
                timeline of the descriptions of the source, 2. A map locating the references, 3. A
                word cloud summarizing the most used characteristics to describe the source, 4. An
                overview of all the textual and visual occurrences of the source. The ‘Fragrant
                Spaces’ (smellscapes) page follows the same rationale. A page with an overview of
                olfactory gestures will be added later.
              </p>
              <p>2. Use the elaborate search environment</p>
              <p>
                In the open search environment visitors can search the explorer for either texts or
                images, or both. You can search for the word ‘incense’ (which will mostly deliver
                English language results), or for the category ‘rose’ (which also provides results
                for the other 6 languages incorporated in the Explorer). Searches can be further
                limited by categories such as language, collection, place (where the smell is
                mentioned), time (year, period or season), or emotion.
              </p>
              <p>
                The Explorer displays your findings as cards or text snippits. Each ‘nose witness
                report’ (be it textual or visual) is presented in its original context: the book
                from whence the quote comes, or the painting that depicts the smell source.
                Permalinks provide the opportunity to browse to the original digital heritage
                collection which holds the resource.
              </p>
              <h4>Can I download the results or design more elaborate queries?</h4>
              <p>
                Yes you can! You can sign up as a member. This creates the opportunity to save your
                results into your own smell library, and export them. Furthermore, the{' '}
                <em>European Olfactory Knowledge Graph</em>, which forms the ‘data backbone’ of the
                Explorer can be queried through a SPARQL endpoint. The overview of the vocabularies
                and taxonomies we incorporated in the Knowledge Graph may provide a starting point
                for queries of a more flavour analytics nature. By engaging with these datasets you
                can pose queries such as ‘What descriptions of smell qualities can be found to
                coincide with the Flavornet database ‘Odor’ column or with Dravnieks 146 odour
                descriptors?’ ‘Is the smell of goats more often described through the Linaeus
                taxonomy as caprylic, or through the Dravnieks descriptors as rancid?’
              </p>
              <h4>Can you help me calculate the data?</h4>
              <p>
                Yes we can! The Odeuropa team is developing interactive notebooks which can make
                odour analytics easier for you. These notebooks can for instance provide a
                spreadsheet with all the relevant quotes about a specific smell source, listing:
                Smell Word, Smell Source, Quality, Location, Perceiver, Time, Effect,
                SentenceBefore, Sentence, SentenceAfter, Year. You will also able able to review
                n-Gram visualisations of the relative frequency of their use over time. The
                notebooks will be published in November 2023.
              </p>
            </div>
          </div>
        </article>
      </Body>
      <Footer />
    </Layout>
  );
};

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'home', 'project', 'search'])),
  },
});

export default AboutPage;
