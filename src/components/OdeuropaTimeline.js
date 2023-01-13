import { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'next-i18next';

import Button from '@components/Button';

const Container = styled.div`
  width: 100%;
  background-color: #f5f5f5;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Line = styled.li`
  width: 100%;
  height: 2px;
  background-color: #b9d59b;
  position: absolute;
  bottom: 60px;
`;

const Chart = styled.ul`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: unset;
  grid-template-rows: unset;
  align-items: flex-end;
  overflow-x: scroll;
  padding: 60px;
  height: 220px;
  position: relative;
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

const CrossIcon = (props) => (
  <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" {...props}>
    <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z" />
  </svg>
);

const ClearButton = styled(Button)`
  cursor: pointer;
  border-radius: 30px;

  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background-color: transparent;
  color: #000;

  &:hover {
    color: #000;
    border-radius: 0;
    box-shadow: none;
    text-decoration: underline;
  }
`;

const calculateSelectionBox = (startPoint, endPoint) => ({
  left: Math.min(startPoint.x, endPoint.x),
  top: Math.min(startPoint.y, endPoint.y),
  width: Math.abs(startPoint.x - endPoint.x),
  height: Math.abs(startPoint.y - endPoint.y),
});

const boxesIntersect = (boxA, boxB) =>
  boxA.left <= boxB.left + boxB.width &&
  boxA.left + boxA.width >= boxB.left &&
  boxA.top <= boxB.top + boxB.height &&
  boxA.top + boxA.height >= boxB.top;

const OdeuropaTimeline = ({
  options,
  defaultValues,
  interval = 20,
  minValue,
  maxValue,
  onChange,
  ...props
}) => {
  const { t } = useTranslation(['search']);
  const [activeItems, setActiveItems] = useState(defaultValues);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const itemRef = useRef([]);

  const limitedOptions = Object.fromEntries(
    Object.entries(options).filter(([date]) => {
      if (minValue && maxValue) return date >= minValue && date <= maxValue;
      if (minValue) return date >= minValue;
      if (maxValue) return date <= maxValue;
      return false;
    })
  );

  const histogramItems = { ...limitedOptions };

  const min = Math.min(...Object.keys(limitedOptions));
  const max = Math.max(...Object.keys(limitedOptions));

  for (let i = min - interval * 2; i < max + interval * 2; i += interval) {
    if (!histogramItems[i]) histogramItems[i] = 0;
  }

  const keys = Object.keys(histogramItems);
  const labels = [...new Set(keys.map((v) => (Math.round(v / 100) * 100).toString()))];

  const histogramOptions = Object.values(histogramItems);

  const maxHistogramOptions = Math.max(...histogramOptions);

  const histogram = Object.entries(histogramItems).reduce((acc, [label, value], index) => {
    const height = Math.ceil((value / maxHistogramOptions) * 100);
    return [
      ...acc,
      <Item
        ref={(el) => (itemRef.current[index] = el)}
        key={label}
        label={label}
        value={value}
        active={activeItems.includes(label)}
        onClick={() => {
          const newItems = [...defaultValues];
          if (defaultValues.includes(label)) {
            newItems.splice(newItems.indexOf(label), 1);
          } else {
            newItems.push(label);
          }
          setActiveItems(newItems);
          handleOnChange(newItems);
        }}
        style={{ height: `${height}%`, pointerEvents: value === 0 ? 'none' : 'auto' }}
      >
        <span
          style={{
            position: 'absolute',
            bottom: -40,
            left: -10,
            userSelect: 'none',
            visibility: labels.includes(label) ? 'visible' : 'hidden',
          }}
        >
          {label}
        </span>
      </Item>,
    ];
  }, []);

  const handleMouseEvent = (event) => {
    const { type } = event;
    const x = (event.touches?.[0]?.pageX || event.pageX) - event.currentTarget.offsetLeft;
    const y = (event.touches?.[0]?.pageY || event.pageY) - event.currentTarget.offsetTop;
    switch (type) {
      case 'mousedown':
      case 'touchstart': {
        // Prevent scroll on mobile devices
        if (type === 'touchstart') {
          document.body.style.overflow = 'hidden';
        }

        setDragStart({ x, y });
        if (!event.shiftKey) {
          setActiveItems([]);
        }
        break;
      }
      case 'mouseup':
      case 'touchend': {
        // Re-enable scroll on mobile devices
        if (type === 'touchend') {
          document.body.style.overflow = 'auto';
        }

        setDragStart(null);
        setDragEnd(null);

        const selectedItems = itemRef.current
          .filter((item) => {
            if (event.shiftKey && defaultValues.includes(item.getAttribute('label'))) return true;
            return (
              dragStart &&
              dragEnd &&
              item.getAttribute('value') > 0 &&
              boxesIntersect(calculateSelectionBox(dragStart, dragEnd), {
                left: item.offsetLeft,
                top: item.offsetTop,
                width: item.offsetWidth,
                height: item.offsetHeight,
              })
            );
          })
          .map((item) => item.getAttribute('label'));

        if (
          selectedItems.length === defaultValues.length &&
          selectedItems.every((v, i) => v === defaultValues[i])
        ) {
          return;
        }

        handleOnChange(selectedItems);
        break;
      }
      case 'mousemove':
      case 'touchmove': {
        if (!dragStart) break;
        setDragEnd({ x, y });
        setActiveItems(
          itemRef.current
            .filter((item) => {
              if (event.shiftKey && defaultValues.includes(item.getAttribute('label'))) return true;
              return (
                dragStart &&
                dragEnd &&
                item.getAttribute('value') > 0 &&
                boxesIntersect(calculateSelectionBox(dragStart, dragEnd), {
                  left: item.offsetLeft,
                  top: item.offsetTop,
                  width: item.offsetWidth,
                  height: item.offsetHeight,
                })
              );
            })
            .map((item) => item.getAttribute('label'))
        );
      }
      default:
        break;
    }
  };

  const handleOnChange = (values) => {
    onChange?.(values);
  };

  const handleOnClear = () => {
    handleOnChange([]);
  };

  return (
    <Container
      {...props}
      onMouseDown={handleMouseEvent}
      onTouchStart={handleMouseEvent}
      onMouseUp={handleMouseEvent}
      onTouchEnd={handleMouseEvent}
      onMouseMove={handleMouseEvent}
      onTouchMove={handleMouseEvent}
    >
      {defaultValues.length > 0 && (
        <ClearButton primary onClick={handleOnClear}>
          <CrossIcon /> {t('search:buttons.clear')}
        </ClearButton>
      )}
      <Chart>
        {histogram}
        <Line />
      </Chart>
      {dragStart && dragEnd && (
        <div
          style={{
            border: '1px solid rgb(76, 133, 216)',
            background: 'rgba(155, 193, 239, 0.4)',
            position: 'absolute',
            zIndex: 99,
            pointerEvents: 'none',
            ...calculateSelectionBox(dragStart, dragEnd),
          }}
        ></div>
      )}
    </Container>
  );
};

export default OdeuropaTimeline;
