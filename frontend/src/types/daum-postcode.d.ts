interface Window {
  daum: typeof daum;
}

interface DaumPostcodeData {
  address: string;
  zonecode: string;
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  width?: string | number;
  height?: string | number;
}

declare namespace daum {
  class Postcode {
    constructor(options: DaumPostcodeOptions);
    embed(element: HTMLElement): void;
  }
}
