import { useState, useEffect, useRef } from 'react';
import { Navigation, Search } from 'lucide-react';
import MapView from '../components/KakaoMap';
import type { MapViewHandle } from '../components/KakaoMap';
import AddRestaurantForm from '../components/AddPinForm';
import PinForm from '../components/PinForm';
import { restaurantsApi, pinsApi } from '../api/restaurants';
import type { Restaurant, Pin, CreateRestaurantDto, CreatePinDto } from '../api/restaurants';
import './MapPage.css';

interface PendingLocation {
  lat: number;
  lng: number;
  address: string;
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [myPins, setMyPins] = useState<Pin[]>([]);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mapViewRef = useRef<MapViewHandle>(null);

  useEffect(() => {
    Promise.all([restaurantsApi.getAll(), pinsApi.getMyPins()])
      .then(([r, p]) => { setRestaurants(r); setMyPins(p); })
      .catch(console.error);
  }, []);

  const pinnedIds = new Set(myPins.map((p) => p.restaurantId));

  const handleAddRestaurant = async (dto: CreateRestaurantDto) => {
    try {
      const created = await restaurantsApi.create(dto);
      setRestaurants((prev) => [created, ...prev]);
      setPendingLocation(null);
      setSelectedRestaurant(created);
    } catch {
      alert('식당 추가에 실패했습니다.');
    }
  };

  const handlePin = async (dto: CreatePinDto) => {
    if (!selectedRestaurant) return;
    try {
      const existingPin = myPins.find((p) => p.restaurantId === selectedRestaurant.id);
      if (existingPin) {
        const updated = await pinsApi.update(selectedRestaurant.id, dto);
        setMyPins((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      } else {
        const newPin = await pinsApi.pin(selectedRestaurant.id, dto);
        setMyPins((prev) => [...prev, newPin]);
      }
      setSelectedRestaurant(null);
    } catch {
      alert('핀 저장에 실패했습니다.');
    }
  };

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    // 1순위: 등록된 식당에서 검색
    const found = restaurants.find(
      (r) => r.name.includes(query) || r.address?.includes(query),
    );
    if (found) {
      mapViewRef.current?.moveTo(found.latitude, found.longitude);
      return;
    }

    // 2순위: 카카오 장소 검색으로 지역/장소 이동
    if (!window.kakao?.maps?.services) return;
    const places = new kakao.maps.services.Places();
    places.keywordSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        mapViewRef.current?.moveTo(Number(result[0].y), Number(result[0].x));
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  const handleUnpin = async () => {
    if (!selectedRestaurant) return;
    try {
      await pinsApi.unpin(selectedRestaurant.id);
      setMyPins((prev) => prev.filter((p) => p.restaurantId !== selectedRestaurant.id));
      setSelectedRestaurant(null);
    } catch {
      alert('핀 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="map-page">
      <header className="map-header">
        <h1>지도</h1>
        <button className="map-header__location-btn">
          <Navigation size={14} strokeWidth={2.5} />
          내 위치
        </button>
      </header>
      <div className="map-search-wrap">
        <div className="map-search-box">
          <button className="map-search-btn" onClick={handleSearch} aria-label="검색">
            <Search size={15} strokeWidth={2} />
          </button>
          <input
            className="map-search"
            placeholder="지역이나 맛집 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
        </div>
      </div>
      <div className="map-view">
        <MapView
          ref={mapViewRef}
          restaurants={restaurants}
          pinnedIds={pinnedIds}
          myPins={myPins}
          onMapClick={(lat, lng, address) => setPendingLocation({ lat, lng, address })}
          onMarkerClick={(restaurant) => setSelectedRestaurant(restaurant)}
        />
      </div>

      {pendingLocation && (
        <AddRestaurantForm
          latitude={pendingLocation.lat}
          longitude={pendingLocation.lng}
          address={pendingLocation.address}
          onSave={handleAddRestaurant}
          onCancel={() => setPendingLocation(null)}
        />
      )}

      {selectedRestaurant && (
        <PinForm
          restaurant={selectedRestaurant}
          existingPin={myPins.find((p) => p.restaurantId === selectedRestaurant.id)}
          onSave={handlePin}
          onUnpin={handleUnpin}
          onCancel={() => setSelectedRestaurant(null)}
        />
      )}
    </div>
  );
}
