interface Window {
  kakao: typeof kakao;
}

declare namespace kakao.maps {
  function load(callback: () => void): void;

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    getLevel(): number;
    setLevel(level: number): void;
    addOverlayMapTypeId(type: MapTypeId): void;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    map?: Map;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: { offset?: Point });
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
    image?: MarkerImage;
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

    class Places {
      keywordSearch(
        keyword: string,
        callback: (result: PlacesSearchResultItem[], status: Status) => void,
      ): void;
    }

    interface PlacesSearchResultItem {
      place_name: string;
      address_name: string;
      x: string;
      y: string;
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
