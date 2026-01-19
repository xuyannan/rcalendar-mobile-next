import React, { useEffect, useRef, useState } from 'react';
import { Paper, Title, Accordion, Tabs, Text, Loader, Center, Box, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as toGeoJSON from '@tmcw/togeojson';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import { transformCoord, transformGeoJSON } from '../utils/coordTransform';
import type { EventGroup, RoutePoint, CheckPoint } from '../types';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Elevation data types
interface ElevationPoint {
  distance: number;
  elevation: number;
  lng?: number;
  lat?: number;
}

// Calculate distance between two coordinates using Haversine formula
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Extract elevation data from GeoJSON
const extractElevationData = (geojson: any): ElevationPoint[] => {
  const points: ElevationPoint[] = [];
  let totalDistance = 0;

  if (!geojson?.features) return points;

  for (const feature of geojson.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    let coordinates: number[][] = [];

    if (geometry.type === 'LineString') {
      coordinates = geometry.coordinates;
    } else if (geometry.type === 'MultiLineString') {
      coordinates = geometry.coordinates.flat();
    }

    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const elevation = coord.length >= 3 ? coord[2] : 0;

      if (i > 0) {
        const prevCoord = coordinates[i - 1];
        const dist = haversineDistance(prevCoord[1], prevCoord[0], coord[1], coord[0]);
        totalDistance += dist;
      }

      points.push({
        distance: Math.round(totalDistance * 100) / 100,
        elevation: Math.round(elevation),
        lng: coord[0],
        lat: coord[1],
      });
    }
  }

  if (points.length > 500) {
    const step = Math.ceil(points.length / 500);
    return points.filter((_, index) => index % step === 0);
  }

  return points;
};

// Elevation Chart Component
interface ElevationChartProps {
  data: ElevationPoint[];
  height?: number;
  routePoints?: RoutePoint[];
  checkpoints?: CheckPoint[];
}

const ElevationChart: React.FC<ElevationChartProps> = ({ data, height = 200, routePoints, checkpoints }) => {
  if (data.length === 0) {
    return <Text ta="center" c="dimmed" py="md">暂无海拔数据</Text>;
  }

  const elevations = data.map(d => d.elevation);
  const minElevation = Math.floor(Math.min(...elevations) / 10) * 10 - 10;
  const maxElevation = Math.ceil(Math.max(...elevations) / 10) * 10 + 10;

  const getElevationAtDistance = (distance: number): number => {
    if (data.length === 0) return 0;
    const closest = data.reduce((prev, curr) =>
      Math.abs(curr.distance - distance) < Math.abs(prev.distance - distance) ? curr : prev
    );
    return closest.elevation;
  };

  // Find the closest data point distance for a given checkpoint distance (within 0.1km tolerance)
  const findClosestDataDistance = (targetDistance: number): number | null => {
    if (data.length === 0) return null;
    const closest = data.reduce((prev, curr) =>
      Math.abs(curr.distance - targetDistance) < Math.abs(prev.distance - targetDistance) ? curr : prev
    );
    // Allow 0.1km (100m) tolerance
    if (Math.abs(closest.distance - targetDistance) <= 0.1) {
      return closest.distance;
    }
    return closest.distance; // Return closest anyway for display
  };

  const checkpointsWithDistance = checkpoints?.filter(cp => cp.distance != null && cp.distance !== undefined) || [];
  const hasCheckpoints = checkpointsWithDistance.length > 0;

  // Custom label component for checkpoints - renders at top of chart
  const renderCheckpointLabel = (cp: CheckPoint) => {
    return (props: { viewBox?: { x: number; y: number } }) => {
      const { viewBox } = props;
      if (!viewBox) return null;
      const { x } = viewBox;
      const topY = 15;
      const lines = [cp.name];
      if (cp.description) lines.push(cp.description);
      lines.push(`${cp.distance}km`);
      
      return (
        <g>
          <circle cx={x} cy={topY} r={5} fill="#ff7300" stroke="#fff" strokeWidth={1.5} />
          {lines.map((line, i) => (
            <text
              key={i}
              x={x}
              y={topY + 12 + i * 12}
              textAnchor="middle"
              fill={i === 0 ? '#ff7300' : '#666'}
              fontSize={i === 0 ? 10 : 9}
              fontWeight={i === 0 ? 'bold' : 'normal'}
            >
              {line}
            </text>
          ))}
        </g>
      );
    };
  };

  return (
    <ResponsiveContainer width="100%" height={height + (hasCheckpoints ? 40 : 0)}>
      <AreaChart data={data} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="distance" tickFormatter={(value) => `${value}km`} fontSize={10} />
        <YAxis domain={[minElevation, maxElevation]} tickFormatter={(value) => `${value}m`} fontSize={10} />
        <Tooltip
          formatter={(value: number | undefined) => [`${value ?? 0} m`, '海拔']}
          labelFormatter={(label) => `里程: ${label} km`}
        />
        <Area type="monotone" dataKey="elevation" stroke="#3388ff" fill="#3388ff" fillOpacity={0.3} />
        {routePoints?.map((point, index) => {
          const dist = point.distance ?? 0;
          const elev = point.elevation ?? getElevationAtDistance(dist);
          return (
            <ReferenceDot
              key={point.id || index}
              x={dist}
              y={elev}
              r={4}
              fill="#52c41a"
              stroke="#fff"
              strokeWidth={2}
            />
          );
        })}
        {checkpointsWithDistance.map((cp, index) => {
          const closestDist = findClosestDataDistance(cp.distance!);
          if (closestDist === null) return null;
          return (
            <ReferenceLine
              key={cp.id || index}
              x={closestDist}
              stroke="#ff7300"
              strokeDasharray="3 3"
              label={renderCheckpointLabel(cp)}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

// GpxMap Component
interface GpxMapProps {
  gpxUrl: string;
  routePoints?: RoutePoint[];
  height?: number;
  onElevationData?: (data: ElevationPoint[]) => void;
}

const GpxMap: React.FC<GpxMapProps> = ({ gpxUrl, routePoints, height = 400, onElevationData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !gpxUrl) return;

    let isMounted = true;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Delay map creation to ensure container is rendered
    const timer = setTimeout(() => {
      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([22.3, 114.2], 10);
      mapInstanceRef.current = map;

      L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        subdomains: '1234',
        attribution: '&copy; 高德地图',
        maxZoom: 18,
      }).addTo(map);

      // Use API base URL for proxy
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const proxyUrl = `${apiBaseUrl}/api/v2/route-file-proxy?url=${encodeURIComponent(gpxUrl)}`;
      
      fetch(proxyUrl)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch file');
          return response.text();
        })
        .then(text => {
          if (!isMounted || !mapInstanceRef.current) return;

          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');

          let geojson;
          const isKml = gpxUrl.toLowerCase().endsWith('.kml') || xml.documentElement.tagName === 'kml';

          if (isKml) {
            geojson = toGeoJSON.kml(xml);
          } else {
            geojson = toGeoJSON.gpx(xml);
          }

          if (!geojson.features || geojson.features.length === 0) {
            throw new Error('No route data found in file');
          }

          // Extract elevation data before transformation
          if (onElevationData) {
            const elevationData = extractElevationData(geojson);
            onElevationData(elevationData);
          }

          const transformedGeojson = transformGeoJSON(geojson);

          const geoJsonLayer = L.geoJSON(transformedGeojson, {
            style: {
              color: '#3388ff',
              weight: 4,
              opacity: 0.8
            }
          }).addTo(mapInstanceRef.current);

          mapInstanceRef.current.fitBounds(geoJsonLayer.getBounds());

          // Add route point markers
          if (routePoints && routePoints.length > 0) {
            routePoints.forEach(point => {
              const [transformedLng, transformedLat] = transformCoord(point.longitude, point.latitude);

              const customIcon = L.divIcon({
                className: 'route-point-marker',
                html: `<div style="
                  background: #52c41a;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: bold;
                  white-space: nowrap;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  border: 2px solid white;
                ">${point.name}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              });

              L.marker([transformedLat, transformedLng], { icon: customIcon })
                .addTo(mapInstanceRef.current!);
            });
          }

          // Force map to recalculate size
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);

          if (isMounted) {
            setLoading(false);
            setMapReady(true);
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error('Error loading route file:', err);
          setError('加载轨迹文件失败: ' + err.message);
          setLoading(false);
        });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpxUrl, routePoints, onElevationData]);

  // Invalidate size when mapReady changes
  useEffect(() => {
    if (mapReady && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [mapReady]);

  return (
    <Box pos="relative" style={{ height, width: '100%' }}>
      {loading && (
        <Center pos="absolute" top={0} left={0} right={0} bottom={0} style={{ zIndex: 1000, background: 'rgba(255,255,255,0.8)' }}>
          <Loader />
        </Center>
      )}
      {error && (
        <Center pos="absolute" top={0} left={0} right={0} bottom={0} style={{ zIndex: 1000 }}>
          <Text c="red">{error}</Text>
        </Center>
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </Box>
  );
};

// Map and Elevation Content for a single group
interface MapElevationContentProps {
  group: EventGroup;
  mapHeight: number;
}

const MapElevationContent: React.FC<MapElevationContentProps> = ({ group, mapHeight }) => {
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);

  if (!group.routeFile) {
    return <Text c="dimmed" ta="center" py="md">暂无路线轨迹</Text>;
  }

  return (
    <Stack gap="md">
      <Paper p="xs" withBorder>
        <Title order={6} mb="xs">路线轨迹</Title>
        <GpxMap
          gpxUrl={group.routeFile}
          routePoints={group.routePoints}
          height={mapHeight}
          onElevationData={setElevationData}
        />
      </Paper>
      {elevationData.length > 0 && (
        <Paper p="xs" withBorder>
          <Title order={6} mb="xs">海拔图</Title>
          <ElevationChart
            data={elevationData}
            height={180}
            routePoints={group.routePoints}
            checkpoints={group.checkpoints}
          />
        </Paper>
      )}
    </Stack>
  );
};

// Main MapElevation Component
interface MapElevationProps {
  groups: EventGroup[];
}

const MapElevation: React.FC<MapElevationProps> = ({ groups }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const groupsWithRoute = groups.filter(g => g.routeFile);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Initialize activeTab when groups are available
  useEffect(() => {
    if (groupsWithRoute.length > 0 && !activeTab) {
      setActiveTab(String(groupsWithRoute[0].id));
    }
  }, [groupsWithRoute, activeTab]);

  if (groupsWithRoute.length === 0) {
    return null;
  }

  const mapHeight = isMobile ? 300 : 400;

  const tabItems = groupsWithRoute.map((group) => ({
    value: String(group.id),
    label: group.name,
  }));

  // Find current active group
  const activeGroup = groupsWithRoute.find(g => String(g.id) === activeTab) || groupsWithRoute[0];

  return (
    <Accordion mb="md" defaultValue="map">
      <Accordion.Item value="map">
        <Accordion.Control>
          <Title order={5}>地图/海拔图</Title>
        </Accordion.Control>
        <Accordion.Panel>
          {tabItems.length === 1 ? (
            <MapElevationContent group={groupsWithRoute[0]} mapHeight={mapHeight} />
          ) : (
            <Box>
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  {tabItems.map(item => (
                    <Tabs.Tab key={item.value} value={item.value}>
                      {item.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
              <Box pt="sm">
                {activeTab && <MapElevationContent key={activeTab} group={activeGroup} mapHeight={mapHeight} />}
              </Box>
            </Box>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default MapElevation;
