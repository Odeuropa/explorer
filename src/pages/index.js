import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styled, { css } from 'styled-components';
import { SearchAlt2 } from '@styled-icons/boxicons-regular/SearchAlt2';
import { Button as ReakitButton } from 'ariakit';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Layout from '@components/Layout';
import Header from '@components/Header';
import Footer from '@components/Footer';
import Body from '@components/Body';
import SearchInput from '@components/SearchInput';
import PageTitle from '@components/PageTitle';
import breakpoints, { customBreakpoint } from '@styles/breakpoints';
import config from '~/config';

const Hero = styled.div`
  width: 100%;
  min-height: calc(
    100vh - ${({ theme }) => `${theme.header.height} - ${theme.header.borderBottomWidth}`}
  );
  position: relative;

  display: flex;
  flex-direction: column;
`;

const HeroTop = styled.div`
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: #fff;
  position: relative;
  background-image: url(${config.home.hero.image});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  padding: 1em 0;

  ${breakpoints.tablet`
    flex-direction: row;
  `}
`;

const Title = styled.h1`
  text-align: left;
  color: #735dae;
  line-height: 100%;
  padding: 0 3rem;
  font-size: 5rem;
  white-space: pre-line;
  margin-bottom: 1rem;

  ${({ theme }) => theme?.pages?.HomePage?.Title};
`;

const SubTitle = styled.h2`
  text-align: left;
  color: #735dae;
  line-height: 100%;
  padding: 0 3rem;
  font-size: 3rem;
  white-space: pre-line;

  ${({ theme }) => theme?.pages?.HomePage?.SubTitle};
`;

const Logo = styled.div`
  background-image: url(${config.metadata.logo});
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  width: 50%;
  height: 50%;
  max-width: 350px;

  ${breakpoints.tablet`
    height: 100%;
  `}
`;

const HeroBottom = styled.div`
  display: flex;
  width: 100%;
  background-color: #fff;
  padding-bottom: 1em;
  overflow: hidden;
`;

const Subtitle = styled.span`
  display: block;
  font-size: 2rem;
  color: #fff;
  margin: 2rem 0 0.5rem 0;
  white-space: pre-line;
  text-align: center;
  text-transform: uppercase;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
`;

const BigButton = styled.a`
  background-color: ${({ background }) => background};
  text-decoration: none;
  color: ${({ color }) => color};
  text-transform: uppercase;
  padding: 0.75em;
  text-align: center;
  border-radius: 8px;
  font-size: 1.5em;

  &:hover {
    color: ${({ color }) => color};
    text-decoration: underline;
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 8px 0px rgba(0, 0, 0, 0.1);
  border-radius: 70px;
  height: 70px;
`;

const StyledSearchInput = styled(SearchInput)`
  height: 70px;
  width: auto;

  .react-autosuggest__input {
    appearance: none;
    background-color: transparent;
    border: none;
    font-size: 2rem;
    letter-spacing: 0.1rem;
    padding: 0 30px;
    min-width: 0;
    width: 100%;
    outline: 0;
    color: #b9d59b;

    &::placeholder {
      color: #b9d59b;
    }
  }

  .react-autosuggest__container--open .react-autosuggest__suggestions-container {
    border: none;
    max-width: auto;
    min-width: 100%;
    right: auto;
    left: 0;
    top: 45px;

    background-color: #ffffff;
    outline: 0;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12),
      0 1px 5px 0 rgba(0, 0, 0, 0.2);
    color: #212121;
    border-bottom-left-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
`;

const SearchButton = styled(ReakitButton)`
  display: flex;
  justify-content: center;
  align-items: center;
  appearance: none;
  border: none;
  border-radius: 70px;
  height: 60%;
  background-color: ${({ theme }) => theme.home.textSearchButton.background};
  color: ${({ theme }) => theme.home.textSearchButton.text};
  margin-right: 20px;
  border: 1px solid #b1c998;
  width: 80px;
  cursor: pointer;
`;

const SearchIcon = styled(SearchAlt2)`
  height: 32px;
`;

const SecondBlock = styled.div`
  display: none;
  width: 300px;
  position: relative;
  margin-left: 1em;
  ${breakpoints.desktop`
    display: flex;
    align-items: center;
  `}
`;

const ThirdBlock = styled.div`
  display: none;
  width: 300px;
  position: relative;
  margin-left: 1em;
  ${customBreakpoint(
    1280,
    css`
      display: flex;
      align-items: center;
    `
  )}
`;

const TopBlock = styled.div`
  display: none;
  ${breakpoints.tablet`
    display: flex;
  `}
`;

const getRandom = (arr, n) => {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len) throw new RangeError('getRandom: more elements taken than available');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};

const imagesList = Array.from(Array(16), (_, i) => `/images/odeuropa-homepage/${i + 1}.jpg`);

const numberOfImages = 4;

const HomePage = () => {
  const { t } = useTranslation(['common', 'home', 'project']);
  const [images, setImages] = useState([]);

  useEffect(() => {
    setImages(getRandom(imagesList, numberOfImages));
  }, []);

  return (
    <Layout>
      <PageTitle title={t('common:home.title')} />
      <Header />
      <Body>
        <Hero>
          <HeroTop>
            <TopBlock>
              <Image
                src={images[0]}
                alt=""
                width={330}
                height={496}
                layout="fixed"
                objectFit="cover"
              />
            </TopBlock>
            <div
              style={{
                flex: '1',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              {config.home.hero.showHeadline && (
                <>
                  <Title>{t('home:hero.headline')}</Title>
                  <SubTitle>{t('home:hero.subheading')}</SubTitle>
                </>
              )}
              {config.home.hero.showLogo && <Logo />}
            </div>
            <TopBlock>
              <Image
                src={images[1]}
                alt=""
                width={330}
                height={496}
                layout="fixed"
                objectFit="cover"
              />
            </TopBlock>
          </HeroTop>
          <HeroBottom style={{ flexWrap: 'wrap' }}>
            <div
              style={{
                backgroundColor: '#B9D59B',
                flex: '1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                padding: '2em',
              }}
            >
              {config.search.allowTextSearch ? (
                <>
                  <span
                    style={{
                      color: '#fff',
                      textTransform: 'uppercase',
                      fontSize: '2rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {t('project:home.searchTitle')}
                  </span>
                  <SearchForm method="GET" action="/browse">
                    <input type="hidden" name="type" value={config.search.route} />
                    <StyledSearchInput name="q" placeholder={t('home:search.placeholder')} />
                    <SearchButton aria-label={t('common:buttons.searchByText')} type="submit">
                      <SearchIcon />
                    </SearchButton>
                  </SearchForm>
                </>
              ) : null}
              <Subtitle>{t('home:browseBy')}</Subtitle>
              <ButtonsContainer>
                {Object.keys(config.routes)
                  .filter((routeName) => config.routes[routeName].showInHome !== false)
                  .flatMap((routeName) => (
                    <Link key={routeName} href={`/${routeName}`} passHref>
                      <BigButton background="transparent" color="#fff">
                        {t(
                          `project:routes.${routeName}`,
                          routeName.substr(0, 1).toUpperCase() + routeName.substr(1)
                        )}
                      </BigButton>
                    </Link>
                  ))}
              </ButtonsContainer>
            </div>
            <SecondBlock>
              <Image src={images[2]} alt="" layout="fill" objectFit="cover" />
            </SecondBlock>
            <ThirdBlock>
              <Image src={images[3]} alt="" layout="fill" objectFit="cover" />
            </ThirdBlock>
          </HeroBottom>
        </Hero>
      </Body>
      <Footer />
    </Layout>
  );
};

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'home', 'project', 'search'])),
  },
});

export default HomePage;
