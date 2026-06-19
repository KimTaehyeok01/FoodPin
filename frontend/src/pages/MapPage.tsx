import { useState, useEffect } from 'react';
import { Navigation, Search } from 'lucide-react';
import MapView from '../components/KakaoMap';
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
        <Search size={15} strokeWidth={2} className="map-search-icon" />
        <input className="map-search" placeholder="지역이나 맛집 검색..." readOnly />
      </div>
      <div className="map-view">
        <MapView
          restaurants={restaurants}
          pinnedIds={pinnedIds}
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
