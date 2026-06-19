import MapView from './components/KakaoMap';
import './App.css';

function App() {
  const handleMapClick = (lat: number, lng: number, address: string) => {
    console.log('클릭한 위치:', lat, lng, address);
    // 다음 단계에서 핀 추가 폼 연결 예정
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>FoodPin</h1>
      </header>
      <main className="map-container">
        <MapView onMapClick={handleMapClick} />
      </main>
    </div>
  );
}

export default App;
