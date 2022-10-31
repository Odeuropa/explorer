import styled from 'styled-components';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import { GestureHandling } from 'leaflet-gesture-handling';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import '@changey/react-leaflet-markercluster/dist/styles.min.css';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';

const StyledMapContainer = styled(MapContainer)`
  .leaflet-popup-content-wrapper {
    ${({ popupContentWrapperStyle }) => popupContentWrapperStyle}
  }
`;

// eslint-disable-next-line no-underscore-dangle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

// Prevent zooming while scrolling by using leaflet-gesture-handling
L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

const OdeuropaMap = ({ markers, renderPopup, popupContentWrapperStyle, ...props }) => {
  return (
    <StyledMapContainer
      center={[51.0, 19.0]}
      zoom={4}
      maxZoom={18}
      scrollWheelZoom={false}
      doubleClickZoom={true}
      gestureHandling={true}
      popupContentWrapperStyle={popupContentWrapperStyle}
      {...props}
      style={{ width: '100%', height: '100%', ...props.style }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      />
      <MarkerClusterGroup>
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.long]}>
            {typeof renderPopup === 'function' && (
              <Popup autoPan={false}>{renderPopup(marker)}</Popup>
            )}
          </Marker>
        ))}
      </MarkerClusterGroup>
    </StyledMapContainer>
  );
};

export default OdeuropaMap;
