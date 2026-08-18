/**
 * Yandex Maps API response types.
 */

export interface ApiResult<T = unknown> {
  data: T | null;
  error: string | null;
}

// Geocoder
export interface GeocoderResponse {
  response: {
    GeoObjectCollection: {
      metaDataProperty: {
        GeocoderResponseMetaData: {
          found: string;
          request: string;
        };
      };
      featureMember: GeocoderFeatureMember[];
    };
  };
}

export interface GeocoderFeatureMember {
  GeoObject: {
    metaDataProperty: {
      GeocoderMetaData: {
        kind: string;
        text: string;
        precision: string;
        Address: {
          formatted: string;
          Components: Array<{ kind: string; name: string }>;
          country_code: string;
          postal_code?: string;
        };
      };
    };
    name: string;
    description: string;
    Point: { pos: string };
    boundedBy?: {
      Envelope: { lowerCorner: string; upperCorner: string };
    };
  };
}

// Router
export interface RouterResponse {
  properties: {
    RouterMetaData: {
      Waypoints: Array<{ coordinates: number[] }>;
    };
  };
  features: RouteFeature[];
}

export interface RouteFeature {
  properties: {
    RouteMetaData: {
      type: string;
      Duration: { value: number; text: string };
      Distance: { value: number; text: string };
    };
  };
  geometry: {
    coordinates: number[][];
  };
}

// Route Matrix
export interface MatrixResponse {
  rows: Array<{
    elements: Array<{
      status: string;
      duration: { value: number; text: string };
      distance: { value: number; text: string };
    }>;
  }>;
}

// Search (Geosearch)
export interface SearchResponse {
  type: string;
  properties: {
    ResponseMetaData: {
      SearchResponse: {
        found: number;
        display: string;
      };
    };
  };
  features: SearchFeature[];
}

export interface SearchFeature {
  type: string;
  properties: {
    name: string;
    description?: string;
    CompanyMetaData?: {
      id: string;
      name: string;
      address: string;
      url?: string;
      Phones?: Array<{ type: string; formatted: string }>;
      Hours?: { text: string; Availabilities: unknown[] };
      Categories?: Array<{ name: string; class: string }>;
    };
  };
  geometry: {
    type: string;
    coordinates: number[];
  };
}

// Suggest
export interface SuggestResponse {
  results: Array<{
    title: { text: string; hl?: Array<[number, number]> };
    subtitle?: { text: string };
    tags?: string[];
    distance?: { value: number; text: string };
    uri?: string;
  }>;
}

// Static Map
export interface StaticMapParams {
  center: string;
  zoom: number;
  size: string;
  markers?: string;
}
