/**
 * Location Service
 * Global service for managing states and cities data
 * Provides state-city dependent dropdown functionality
 */

export interface State {
  id: string;
  name: string;
  code: string;
}

export interface City {
  id: string;
  name: string;
  stateId: string;
  stateCode: string;
}

export interface LocationServiceConfig {
  enableCaching: boolean;
  cacheExpiry: number; // in milliseconds
}

class LocationService {
  private config: LocationServiceConfig;
  private statesCache: State[] | null = null;
  private citiesCache: Map<string, City[]> = new Map();
  private cacheTimestamp: number = 0;

  constructor(
    config: LocationServiceConfig = {
      enableCaching: true,
      cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    }
  ) {
    this.config = config;
  }

  /**
   * Get all states
   */
  async getStates(): Promise<State[]> {
    if (this.config.enableCaching && this.statesCache && this.isCacheValid()) {
      return this.statesCache;
    }

    try {
      const states = this.getIndianStates();
      this.statesCache = states;
      this.cacheTimestamp = Date.now();
      return states;
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  /**
   * Get cities by state ID
   */
  async getCitiesByState(stateId: string): Promise<City[]> {
    if (!stateId) return [];

    if (
      this.config.enableCaching &&
      this.citiesCache.has(stateId) &&
      this.isCacheValid()
    ) {
      return this.citiesCache.get(stateId) || [];
    }

    try {
      const cities = this.getIndianCitiesByState(stateId);
      this.citiesCache.set(stateId, cities);
      return cities;
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  /**
   * Get cities by state code
   */
  async getCitiesByStateCode(stateCode: string): Promise<City[]> {
    if (!stateCode) return [];

    const states = await this.getStates();
    const state = states.find(s => s.code === stateCode);

    if (!state) return [];

    return this.getCitiesByState(state.id);
  }

  /**
   * Search cities by name (useful for autocomplete)
   */
  async searchCities(query: string, stateId?: string): Promise<City[]> {
    if (!query || query.length < 2) return [];

    try {
      let cities: City[] = [];

      if (stateId) {
        cities = await this.getCitiesByState(stateId);
      } else {
        // Search across all states
        const states = await this.getStates();
        for (const state of states) {
          const stateCities = await this.getCitiesByState(state.id);
          cities = cities.concat(stateCities);
        }
      }

      return cities
        .filter(city => city.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 50); // Limit results
    } catch (error) {
      console.error('Error searching cities:', error);
      return [];
    }
  }

  /**
   * Get state by ID
   */
  async getStateById(stateId: string): Promise<State | null> {
    const states = await this.getStates();
    return states.find(state => state.id === stateId) || null;
  }

  /**
   * Get state by code
   */
  async getStateByCode(stateCode: string): Promise<State | null> {
    const states = await this.getStates();
    return states.find(state => state.code === stateCode) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.statesCache = null;
    this.citiesCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.config.cacheExpiry;
  }

  /**
   * Get Indian states data
   */
  private getIndianStates(): State[] {
    return [
      { id: 'andhra-pradesh', name: 'Andhra Pradesh', code: 'AP' },
      { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', code: 'AR' },
      { id: 'assam', name: 'Assam', code: 'AS' },
      { id: 'bihar', name: 'Bihar', code: 'BR' },
      { id: 'chhattisgarh', name: 'Chhattisgarh', code: 'CG' },
      { id: 'goa', name: 'Goa', code: 'GA' },
      { id: 'gujarat', name: 'Gujarat', code: 'GJ' },
      { id: 'haryana', name: 'Haryana', code: 'HR' },
      { id: 'himachal-pradesh', name: 'Himachal Pradesh', code: 'HP' },
      { id: 'jharkhand', name: 'Jharkhand', code: 'JH' },
      { id: 'karnataka', name: 'Karnataka', code: 'KA' },
      { id: 'kerala', name: 'Kerala', code: 'KL' },
      { id: 'madhya-pradesh', name: 'Madhya Pradesh', code: 'MP' },
      { id: 'maharashtra', name: 'Maharashtra', code: 'MH' },
      { id: 'manipur', name: 'Manipur', code: 'MN' },
      { id: 'meghalaya', name: 'Meghalaya', code: 'ML' },
      { id: 'mizoram', name: 'Mizoram', code: 'MZ' },
      { id: 'nagaland', name: 'Nagaland', code: 'NL' },
      { id: 'odisha', name: 'Odisha', code: 'OD' },
      { id: 'punjab', name: 'Punjab', code: 'PB' },
      { id: 'rajasthan', name: 'Rajasthan', code: 'RJ' },
      { id: 'sikkim', name: 'Sikkim', code: 'SK' },
      { id: 'tamil-nadu', name: 'Tamil Nadu', code: 'TN' },
      { id: 'telangana', name: 'Telangana', code: 'TG' },
      { id: 'tripura', name: 'Tripura', code: 'TR' },
      { id: 'uttar-pradesh', name: 'Uttar Pradesh', code: 'UP' },
      { id: 'uttarakhand', name: 'Uttarakhand', code: 'UK' },
      { id: 'west-bengal', name: 'West Bengal', code: 'WB' },
      {
        id: 'andaman-nicobar',
        name: 'Andaman and Nicobar Islands',
        code: 'AN',
      },
      { id: 'chandigarh', name: 'Chandigarh', code: 'CH' },
      { id: 'dadra-nagar-haveli', name: 'Dadra and Nagar Haveli', code: 'DH' },
      { id: 'daman-diu', name: 'Daman and Diu', code: 'DD' },
      { id: 'delhi', name: 'Delhi', code: 'DL' },
      { id: 'jammu-kashmir', name: 'Jammu and Kashmir', code: 'JK' },
      { id: 'ladakh', name: 'Ladakh', code: 'LA' },
      { id: 'lakshadweep', name: 'Lakshadweep', code: 'LD' },
      { id: 'puducherry', name: 'Puducherry', code: 'PY' },
    ];
  }

  /**
   * Get cities for a specific state
   */
  private getIndianCitiesByState(stateId: string): City[] {
    const citiesData: Record<string, string[]> = {
      'andhra-pradesh': [
        'Visakhapatnam',
        'Vijayawada',
        'Guntur',
        'Nellore',
        'Kurnool',
        'Tirupati',
        'Kadapa',
        'Anantapur',
        'Chittoor',
        'Ongole',
      ],
      'arunachal-pradesh': [
        'Itanagar',
        'Naharlagun',
        'Pasighat',
        'Tezpur',
        'Bomdila',
        'Ziro',
        'Along',
        'Daporijo',
        'Tezu',
        'Namsai',
      ],
      assam: [
        'Guwahati',
        'Silchar',
        'Dibrugarh',
        'Jorhat',
        'Tezpur',
        'Nagaon',
        'Tinsukia',
        'Barpeta',
        'Dhubri',
        'Sivasagar',
      ],
      bihar: [
        'Patna',
        'Gaya',
        'Bhagalpur',
        'Muzaffarpur',
        'Darbhanga',
        'Purnia',
        'Arrah',
        'Begusarai',
        'Katihar',
        'Munger',
      ],
      chhattisgarh: [
        'Raipur',
        'Bhilai',
        'Bilaspur',
        'Korba',
        'Rajnandgaon',
        'Durg',
        'Raigarh',
        'Jagdalpur',
        'Ambikapur',
        'Bhatapara',
      ],
      goa: [
        'Panaji',
        'Margao',
        'Vasco da Gama',
        'Mapusa',
        'Ponda',
        'Mormugao',
        'Sanquelim',
        'Bicholim',
        'Curchorem',
        'Valpoi',
      ],
      gujarat: [
        'Ahmedabad',
        'Surat',
        'Vadodara',
        'Rajkot',
        'Bhavnagar',
        'Jamnagar',
        'Junagadh',
        'Gandhinagar',
        'Nadiad',
        'Anand',
      ],
      haryana: [
        'Gurgaon',
        'Faridabad',
        'Panipat',
        'Ambala',
        'Yamunanagar',
        'Rohtak',
        'Hisar',
        'Karnal',
        'Sonipat',
        'Panchkula',
      ],
      'himachal-pradesh': [
        'Shimla',
        'Dharamshala',
        'Solan',
        'Mandi',
        'Palampur',
        'Kullu',
        'Chamba',
        'Una',
        'Baddi',
        'Nahan',
      ],
      jharkhand: [
        'Ranchi',
        'Jamshedpur',
        'Dhanbad',
        'Bokaro',
        'Deoghar',
        'Phusro',
        'Hazaribagh',
        'Giridih',
        'Ramgarh',
        'Medininagar',
      ],
      karnataka: [
        'Bangalore',
        'Mysore',
        'Hubli',
        'Mangalore',
        'Belgaum',
        'Gulbarga',
        'Davanagere',
        'Bellary',
        'Bijapur',
        'Shimoga',
      ],
      kerala: [
        'Thiruvananthapuram',
        'Kochi',
        'Kozhikode',
        'Thrissur',
        'Palakkad',
        'Kollam',
        'Malappuram',
        'Kannur',
        'Kasaragod',
        'Alappuzha',
      ],
      'madhya-pradesh': [
        'Bhopal',
        'Indore',
        'Gwalior',
        'Jabalpur',
        'Ujjain',
        'Sagar',
        'Dewas',
        'Satna',
        'Ratlam',
        'Murwara',
      ],
      maharashtra: [
        'Mumbai',
        'Pune',
        'Nagpur',
        'Thane',
        'Nashik',
        'Aurangabad',
        'Solapur',
        'Amravati',
        'Kolhapur',
        'Sangli',
      ],
      manipur: [
        'Imphal',
        'Thoubal',
        'Bishnupur',
        'Churachandpur',
        'Senapati',
        'Tamenglong',
        'Ukhrul',
        'Chandel',
        'Kangpokpi',
        'Jiribam',
      ],
      meghalaya: [
        'Shillong',
        'Tura',
        'Nongstoin',
        'Jowai',
        'Nongpoh',
        'Williamnagar',
        'Baghmara',
        'Mairang',
        'Khliehriat',
        'Resubelpara',
      ],
      mizoram: [
        'Aizawl',
        'Lunglei',
        'Saiha',
        'Champhai',
        'Kolasib',
        'Serchhip',
        'Lawngtlai',
        'Mamit',
        'Saitual',
        'Hnahthial',
      ],
      nagaland: [
        'Kohima',
        'Dimapur',
        'Mokokchung',
        'Tuensang',
        'Wokha',
        'Mon',
        'Phek',
        'Zunheboto',
        'Longleng',
        'Kiphire',
      ],
      odisha: [
        'Bhubaneswar',
        'Cuttack',
        'Rourkela',
        'Berhampur',
        'Sambalpur',
        'Puri',
        'Balasore',
        'Bhadrak',
        'Baripada',
        'Jharsuguda',
      ],
      punjab: [
        'Ludhiana',
        'Amritsar',
        'Jalandhar',
        'Patiala',
        'Bathinda',
        'Mohali',
        'Batala',
        'Pathankot',
        'Moga',
        'Abohar',
      ],
      rajasthan: [
        'Jaipur',
        'Jodhpur',
        'Udaipur',
        'Kota',
        'Bikaner',
        'Ajmer',
        'Bharatpur',
        'Alwar',
        'Bhilwara',
        'Sikar',
      ],
      sikkim: [
        'Gangtok',
        'Namchi',
        'Mangan',
        'Rangpo',
        'Singtam',
        'Gyalshing',
        'Ravangla',
        'Jorethang',
        'Pelling',
        'Lachung',
      ],
      'tamil-nadu': [
        'Chennai',
        'Coimbatore',
        'Madurai',
        'Tiruchirappalli',
        'Salem',
        'Tirunelveli',
        'Tiruppur',
        'Erode',
        'Vellore',
        'Thoothukkudi',
      ],
      telangana: [
        'Hyderabad',
        'Warangal',
        'Nizamabad',
        'Khammam',
        'Karimnagar',
        'Ramagundam',
        'Mahbubnagar',
        'Nalgonda',
        'Adilabad',
        'Suryapet',
      ],
      tripura: [
        'Agartala',
        'Udaipur',
        'Dharmanagar',
        'Ambassa',
        'Kailashahar',
        'Belonia',
        'Khowai',
        'Teliamura',
        'Sabroom',
        'Sonamura',
      ],
      'uttar-pradesh': [
        'Lucknow',
        'Kanpur',
        'Agra',
        'Varanasi',
        'Meerut',
        'Allahabad',
        'Bareilly',
        'Ghaziabad',
        'Moradabad',
        'Aligarh',
      ],
      uttarakhand: [
        'Dehradun',
        'Haridwar',
        'Roorkee',
        'Kashipur',
        'Rudrapur',
        'Haldwani',
        'Rishikesh',
        'Ramnagar',
        'Pithoragarh',
        'Manglaur',
      ],
      'west-bengal': [
        'Kolkata',
        'Asansol',
        'Siliguri',
        'Durgapur',
        'Bardhaman',
        'Malda',
        'Baharampur',
        'Habra',
        'Kharagpur',
        'Shantipur',
      ],
      'andaman-nicobar': [
        'Port Blair',
        'Diglipur',
        'Mayabunder',
        'Rangat',
        'Havelock Island',
        'Neil Island',
        'Long Island',
        'Baratang',
        'Wandoor',
        'Bambooflat',
      ],
      chandigarh: ['Chandigarh', 'Mohali', 'Panchkula'],
      'dadra-nagar-haveli': [
        'Silvassa',
        'Dadra',
        'Naroli',
        'Amli',
        'Khanvel',
        'Masat',
        'Rakholi',
        'Samarvarni',
        'Vasona',
        'Kherdi',
      ],
      'daman-diu': ['Daman', 'Diu', 'Nani Daman', 'Moti Daman'],
      delhi: [
        'New Delhi',
        'Central Delhi',
        'North Delhi',
        'South Delhi',
        'East Delhi',
        'West Delhi',
        'North East Delhi',
        'North West Delhi',
        'South East Delhi',
        'South West Delhi',
      ],
      'jammu-kashmir': [
        'Srinagar',
        'Jammu',
        'Anantnag',
        'Baramulla',
        'Sopore',
        'Kathua',
        'Udhampur',
        'Punch',
        'Rajauri',
        'Kupwara',
      ],
      ladakh: [
        'Leh',
        'Kargil',
        'Drass',
        'Nubra',
        'Zanskar',
        'Changthang',
        'Suru',
        'Aryan Valley',
        'Turtuk',
        'Diskit',
      ],
      lakshadweep: [
        'Kavaratti',
        'Agatti',
        'Amini',
        'Andrott',
        'Bitra',
        'Chetlat',
        'Kadmat',
        'Kalpeni',
        'Kiltan',
        'Minicoy',
      ],
      puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
    };

    const cityNames = citiesData[stateId] || [];
    return cityNames.map((name, index) => ({
      id: `${stateId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      stateId,
      stateCode: this.getStateCodeById(stateId),
    }));
  }

  /**
   * Get state code by state ID
   */
  private getStateCodeById(stateId: string): string {
    const states = this.getIndianStates();
    const state = states.find(s => s.id === stateId);
    return state?.code || '';
  }
}

// Create and export singleton instance
export const locationService = new LocationService();

// Export types
export type { State, City, LocationServiceConfig };
