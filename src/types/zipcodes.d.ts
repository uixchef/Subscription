declare module "zipcodes" {
  type ZipLookupResult = {
    zip: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
  };

  const zipcodes: {
    lookup(zip: string | number): ZipLookupResult | undefined;
    states: {
      normalize(state: string): string;
    };
  };

  export default zipcodes;
}
