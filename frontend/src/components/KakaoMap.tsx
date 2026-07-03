import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import type { Restaurant, Pin } from '../api/restaurants';

const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string;

function loadKakaoScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) { resolve(); return; }
    const existing = document.getElementById('kakao-map-script');
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(resolve));
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false&libraries=services`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function makeLabel(restaurant: Restaurant, isPinned: boolean, rating?: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    display: flex;
    align-items: center;
    gap: 5px;
    background: ${isPinned ? 'rgba(255,107,53,0.95)' : 'rgba(15,20,42,0.88)'};
    border: 1.5px solid ${isPinned ? '#ff6b35' : 'rgba(255,255,255,0.13)'};
    border-radius: 20px;
    padding: 5px 11px 5px 8px;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    backdrop-filter: blur(4px);
    user-select: none;
    pointer-events: auto;
  `;

  const icon = document.createElement('span');
  icon.textContent = '📍';
  icon.style.cssText = 'font-size: 13px; line-height: 1;';

  const name = document.createElement('span');
  name.textContent = restaurant.name;
  name.style.cssText = `
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.3px;
  `;

  wrap.appendChild(icon);
  wrap.appendChild(name);

  if (isPinned && rating != null) {
    const star = document.createElement('span');
    star.textContent = `★${rating}`;
    star.style.cssText = `
      color: #ffe066;
      font-size: 11px;
      font-weight: 700;
      margin-left: 2px;
    `;
    wrap.appendChild(star);
  }

  return wrap;
}

export interface MapViewHandle {
  moveTo: (lat: number, lng: number) => void;
}

interface Props {
  onMapClick?: (lat: number, lng: number, address: string) => void;
  onMarkerClick?: (restaurant: Restaurant) => void;
  restaurants?: Restaurant[];
  pinnedIds?: Set<number>;
  myPins?: Pin[];
  ref?: Ref<MapViewHandle>;
}

export default function MapView({
  onMapClick,
  onMarkerClick,
  restaurants = [],
  pinnedIds = new Set(),
  myPins = [],
  ref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useImperativeHandle(ref, () => ({
    moveTo: (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.setLevel(4);
      map.panTo(new kakao.maps.LatLng(lat, lng));
    },
  }), []);

  useEffect(() => {
    let destroyed = false;

    loadKakaoScript().then(() => {
      if (destroyed || !containerRef.current || mapRef.current) return;

      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      });
      mapRef.current = map;

      kakao.maps.event.addListener(map, 'click', (e?: kakao.maps.MouseEvent) => {
        if (!onMapClick || !e) return;
        onMapClick(e.latLng.getLat(), e.latLng.getLng(), '');
      });

      setMapReady(true);
    }).catch(console.error);

    return () => {
      destroyed = true;
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const ratingMap = new Map(myPins.map((p) => [p.restaurantId, p.rating]));

    restaurants.forEach((r) => {
      const isPinned = pinnedIds.has(r.id);
      const rating = ratingMap.get(r.id);
      const el = makeLabel(r, isPinned, rating);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick?.(r);
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(r.latitude, r.longitude),
        content: el,
        yAnchor: 1,
        map,
      });

      overlaysRef.current.push(overlay);
    });
  }, [mapReady, restaurants, pinnedIds, myPins]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
