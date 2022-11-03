import styled, { css } from 'styled-components';
import breakpoints from '@styles/breakpoints';

const Container = styled.div`
  width: 100%;
  background-color: #f5f5f5;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Line = styled.div`
  width: 100%;
  height: 2px;
  background-color: #b9d59b;
  position: absolute;
  bottom: calc(5em - 2px);
`;

const Chart = styled.ul`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: unset;
  grid-template-rows: unset;
  align-items: flex-end;
  overflow-x: scroll;
  padding: 4em;
  height: calc(100px + 4em * 2);
`;

const Item = styled.li`
  width: 20px;
  transition: background-color 250ms ease-in-out;
  cursor: pointer;
  background-color: ${({ active }) => (active ? '#735dae' : '#b9d59b')};

  &:hover {
    background-color: ${({ active }) => (active ? '#735dae' : '#a6bf8b')};
  }
  position: relative;

  ${({ active, value, label }) =>
    css`
      &::before {
        content: '${value}';
        color: ${active ? '#735dae' : '#a6bf8b'};
        font-size: 0.9em;
        font-weight: bold;
        display: ${value > 0 ? 'block' : 'none'};
        transition: opacity 250ms ease-in-out;
        text-align: center;
        margin-top: -20px;
      }

      &::after {
        content: ${JSON.stringify(label)};
        color: ${active ? '#735dae' : '#a6bf8b'};
        font-weight: bold;
        display: block;
        opacity: ${active ? 1 : 0};
        transition: opacity 250ms ease-in-out;
        position: absolute;
        bottom: -40px;
        margin-left: -10px;
        background-color: #f5f5f5;
        padding-bottom: 10px;
      }
    `}

  &:hover::after {
    opacity: 1;
  }
`;

const OdeuropaTimeline = ({
  values,
  defaultValue,
  interval = 20,
  minValue,
  maxValue,
  onChange,
  ...props
}) => {
  const limitedValues = Object.fromEntries(
    Object.entries(values).filter(([date]) => {
      if (minValue && maxValue) return date >= minValue && date <= maxValue;
      if (minValue) return date >= minValue;
      if (maxValue) return date <= maxValue;
      return false;
    })
  );

  const histogramItems = { ...limitedValues };

  const min = Math.min(...Object.keys(limitedValues));
  const max = Math.max(...Object.keys(limitedValues));

  for (let i = min - interval * 2; i < max + interval * 2; i += interval) {
    if (!histogramItems[i]) histogramItems[i] = 0;
  }

  const keys = Object.keys(histogramItems);
  const labels = [...new Set(keys.map((v) => (Math.round(v / 100) * 100).toString()))];

  const histogramValues = Object.values(histogramItems);

  const maxHistogramValues = Math.max(...histogramValues);

  const histogram = Object.entries(histogramItems).reduce((acc, [label, value]) => {
    const height = Math.ceil((value / maxHistogramValues) * 100);
    return [
      ...acc,
      <Item
        key={label}
        label={label}
        value={value}
        active={label === defaultValue}
        onClick={() => onChange(label === defaultValue ? undefined : label)}
        style={{ height: `${height}%`, pointerEvents: value === 0 ? 'none' : 'auto' }}
      >
        <span
          style={{
            position: 'absolute',
            bottom: -40,
            left: -10,
            visibility: labels.includes(label) ? 'visible' : 'hidden',
          }}
        >
          {label}
        </span>
      </Item>,
    ];
  }, []);

  return (
    <Container {...props}>
      <Chart>{histogram}</Chart>
      <Line />
    </Container>
  );
};

export default OdeuropaTimeline;
