import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { normalizeCityForStorage, normalizeDepartmentForStorage, normalizeAddressForStorage } from '@/presentation/utils/normalization';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface AddressData {
  address: string;
  city: string;
  department: string;
  country: string;
  postalCode?: string;
  coordinates: LocationData;
  // Propiedades adicionales para compatibilidad
  latitude?: number;
  longitude?: number;
  state?: string;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.LocationPermissionResponse | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000
  } = options;

  // Verificar permisos de ubicación
  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus({ status } as Location.LocationPermissionResponse);
      return status === 'granted';
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError('Error al verificar permisos de ubicación');
      return false;
    }
  };

  // Solicitar permisos de ubicación
  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus({ status } as Location.LocationPermissionResponse);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación',
          'Para usar esta funcionalidad, necesitamos acceso a tu ubicación. Por favor, habilita los permisos de ubicación en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => Location.enableNetworkProviderAsync() }
          ]
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setError('Error al solicitar permisos de ubicación');
      return false;
    }
  };

  // Obtener ubicación actual
  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar permisos
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      // Obtener ubicación
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: timeout,
        distanceInterval: 0
      });

      const locationData: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy || undefined,
        altitude: locationResult.coords.altitude || undefined,
        heading: locationResult.coords.heading || undefined,
        speed: locationResult.coords.speed || undefined
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      console.error('Error getting location:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener ubicación';
      setError(errorMessage);
      
      Alert.alert(
        'Error de Ubicación',
        'No se pudo obtener tu ubicación actual. Verifica que el GPS esté habilitado y que tengas una buena señal.',
        [{ text: 'Entendido' }]
      );
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Geocodificación inversa (coordenadas a dirección)
  const reverseGeocode = async (coordinates: LocationData) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        
        // Normalizar datos obtenidos del GPS
        const rawAddress = `${addr.street || ''} ${addr.streetNumber || ''}`.trim() || 'Dirección no disponible';
        const rawCity = addr.city || addr.subregion || 'Ciudad no disponible';
        const rawDepartment = addr.region || addr.district || 'Departamento no disponible';
        const rawCountry = addr.country || 'Colombia';
        
        console.log('🏙️ Datos GPS originales:', {
          address: rawAddress,
          city: rawCity,
          department: rawDepartment,
          country: rawCountry
        });
        
        const addressData: AddressData = {
          address: normalizeAddressForStorage(rawAddress),
          city: normalizeCityForStorage(rawCity),
          department: normalizeDepartmentForStorage(rawDepartment),
          country: normalizeCityForStorage(rawCountry),
          postalCode: addr.postalCode || undefined,
          coordinates
        };
        
        console.log('🔤 Datos GPS normalizados:', {
          address: addressData.address,
          city: addressData.city,
          department: addressData.department,
          country: addressData.country
        });

        setAddress(addressData);
        return addressData;
      } else {
        throw new Error('No se encontró dirección para estas coordenadas');
      }
    } catch (err) {
      console.error('Error in reverse geocoding:', err);
      setError('Error al obtener dirección desde coordenadas');
      return null;
    }
  };

  // Obtener ubicación y dirección completa
  const getLocationAndAddress = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await getCurrentLocation();
      if (!locationData) {
        setIsLoading(false);
        return null;
      }

      const addressData = await reverseGeocode(locationData);
      setIsLoading(false);
      return addressData;
    } catch (err) {
      console.error('Error getting location and address:', err);
      setError('Error al obtener ubicación y dirección');
      setIsLoading(false);
      return null;
    }
  };

  // Limpiar datos
  const clearLocation = () => {
    setLocation(null);
    setAddress(null);
    setError(null);
  };

  return {
    location,
    address,
    isLoading,
    error,
    permissionStatus,
    getCurrentLocation,
    reverseGeocode,
    getLocationAndAddress,
    clearLocation,
    checkPermissions,
    requestPermissions
  };
};












