export type TripType = 'oneway' | 'roundtrip' | 'package'
export type CabinClass = 'M' | 'C'
export type SortOption = 'price_asc' | 'price_desc' | 'date_asc' | 'duration_asc' | 'popularity'
export type FlexMode = 'exact' | 'pm1' | 'pm3' | 'month' | 'weekends' | 'any3months' | 'any16months'
export type StopFilter = 'direct' | 'max1' | 'any'
export type BaggageFilter = 'handonly' | 'checked'
export type DepartureTime = 'morning' | 'afternoon' | 'evening' | 'any'
export type ContinentFilter = 'all' | 'europe' | 'northafrica' | 'caribbean' | 'asia'

export interface SearchParams {
  tripType: TripType
  origins: string[]
  destination: string
  destinationLabel: string
  departDateFrom: string
  departDateTo: string
  returnDateFrom?: string
  returnDateTo?: string
  flexMode: FlexMode
  adults: number
  children: number
  infants: number
  cabinClass: CabinClass
  stops: StopFilter
  baggage: BaggageFilter
  departureTime: DepartureTime
  maxPriceFlight: number
  maxPricePackage: number
  minNights?: number
  maxNights?: number
  filterFlights: boolean
  filterPackages: boolean
  continentFilter: ContinentFilter
}

export interface FlightDeal {
  id: string
  type: 'flight' | 'package'
  airline: string
  airlineCode: string
  airlineColor: string
  fromCode: string
  fromCity: string
  toCode: string
  toCity: string
  toCountry: string
  price: number
  currency: string
  departDate: string
  returnDate?: string
  durationMinutes: number
  stops: number
  direct: boolean
  baggageIncluded: boolean
  deepLink: string
  hotelIncluded?: boolean
  nights?: number
  isBestDeal: boolean
}

export interface AutocompleteResult {
  id: string
  name: string
  city: string
  country: string
  code: string
  type: string
}export type TripType = 'oneway' | 'roundtrip' | 'package'
export type CabinClass = 'M' | 'C'
export type SortOption = 'price_asc' | 'price_desc' | 'date_asc' | 'duration_asc' | 'popularity'
export type FlexMode = 'exact' | 'pm1' | 'pm3' | 'month' | 'weekends' | 'any3months'
export type StopFilter = 'direct' | 'max1' | 'any'
export type BaggageFilter = 'handonly' | 'checked'
export type DepartureTime = 'morning' | 'afternoon' | 'evening' | 'any'
export type ContinentFilter = 'all' | 'europe' | 'northafrica' | 'caribbean' | 'asia'

export interface SearchParams {
  tripType: TripType
  origins: string[]
  destination: string
  destinationLabel: string
  departDateFrom: string
  departDateTo: string
  returnDateFrom?: string
  returnDateTo?: string
  flexMode: FlexMode
  adults: number
  children: number
  infants: number
  cabinClass: CabinClass
  stops: StopFilter
  baggage: BaggageFilter
  departureTime: DepartureTime
  maxPriceFlight: number
  maxPricePackage: number
  minNights?: number
  maxNights?: number
  filterFlights: boolean
  filterPackages: boolean
  continentFilter: ContinentFilter
}

export interface FlightDeal {
  id: string
  type: 'flight' | 'package'
  airline: string
  airlineCode: string
  airlineColor: string
  fromCode: string
  fromCity: string
  toCode: string
  toCity: string
  toCountry: string
  price: number
  currency: string
  departDate: string
  returnDate?: string
  durationMinutes: number
  stops: number
  direct: boolean
  baggageIncluded: boolean
  deepLink: string
  hotelIncluded?: boolean
  nights?: number
  isBestDeal: boolean
}

export interface AutocompleteResult {
  id: string
  name: string
  city: string
  country: string
  code: string
  type: string
}
