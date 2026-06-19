interface Window {
  kakao: typeof kakao;
}

declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    getLevel(): number;
    setLevel(level: number): void;
    addOverlayMapTypeId(type: MapTypeId): void;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
    setTitle(title: string): void;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker: Marker): void;
    close(): void;
    setContent(content: string): void;
  }

  interface MapOptions {
    center: LatLng;
    level: number;
  }

  interface MarkerOptions {
    map?: Map;
    position: LatLng;
    title?: string;
  }

  interface InfoWindowOptions {
    content?: string;
    removable?: boolean;
  }

  enum MapTypeId {
    ROADMAP,
    SKYVIEW,
    HYBRID,
  }

  namespace event {
    function addListener(
      target: Map | Marker,
      type: string,
      handler: (e?: MouseEvent) => void,
    ): void;
    function removeListener(
      target: Map | Marker,
      type: string,
      handler: (e?: MouseEvent) => void,
    ): void;
  }

  interface MouseEvent {
    latLng: LatLng;
  }

  namespace services {
    class Geocoder {
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: Address[], status: Status) => void,
      ): void;
    }

    interface Address {
      address: {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
      };
      road_address: {
        address_name: string;
        building_name: string;
      } | null;
    }

    enum Status {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      ERROR = 'ERROR',
    }
  }
}
