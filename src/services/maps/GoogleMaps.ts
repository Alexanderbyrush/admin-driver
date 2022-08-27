import {Loader} from '@googlemaps/js-api-loader'
import {PlaceInterface} from '@/types/PlaceInterface'

export class GoogleMaps {
  
  loader: Loader
  map: google.maps.Map
  markers: Array<google.maps.Marker> = []
  icon: string
  
  constructor(icon: string) {
    this.loader = new Loader({
      apiKey: process.env.VUE_APP_GOOGLE_API_KEY?? '',
      version: "weekly"
    })
    this.icon = icon
  }
  
  /* istanbul ignore next */
  async initMap(id: string): Promise<google.maps.Map> {
    await this.loader.load().then((google)=> {
      const options: google.maps.MapOptions = {
        center: { lat: 2.4448143, lng: -76.6147395 },
        zoom: 14
      }
      this.map = new google.maps.Map(document.getElementById(id) as HTMLElement, options)
    }).catch(error => console.error(error))
    
    return Promise.resolve(this.map)
  }
  /* istanbul ignore next */
  addMarker(place: PlaceInterface): void {
    const infoWindow = new google.maps.InfoWindow({
      content: place.name
    });
    const markerOptions: google.maps.MarkerOptions = {
      position: {
        lat: place.lat,
        lng: place.lng
      },
      map: this.map,
      icon: {
        url: this.icon,
        scaledSize: new google.maps.Size(30, 30)
      },
      title: place.name,
      optimized: true
    }
    const marker = new google.maps.Marker(markerOptions)
    infoWindow.open({
      anchor: marker,
      map: this.map,
      shouldFocus: false
    })
    this.markers.push(marker)
  }
  
  /* istanbul ignore next */
  moveCamera(place: PlaceInterface): void {
    this.map.panTo(new google.maps.LatLng(place.lat, place.lng))
  }
  
  /* istanbul ignore next */
  addListener(listener: (latLng: google.maps.LatLng) => void): void {
    this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const marker = new google.maps.Marker()
      if (event.latLng) {
        this.clearMap()
        marker.setPosition(event.latLng)
        marker.setMap(this.map)
        this.markers.push(marker)
        this.map.panTo(event.latLng)
        listener(event.latLng)
      }
    })
  }
  
  /* istanbul ignore next */
  clearMap(): void {
    this.markers.forEach(marker => marker.setMap(null))
    this.markers = []
  }
}