import {io, Socket} from 'socket.io-client'
import {WPSubject} from '@/services/gordaApi/interfaces/WPSubject'
import {WPObserver} from '@/services/gordaApi/interfaces/WPObserver'
import {WhatsApp} from '@/services/gordaApi/constants/WhatsApp'
import {LoadingType} from '@/types/LoadingType'

export default class WhatsAppClient implements WPSubject {
  
  private static instance: WhatsAppClient
  private socket: Socket
  public state = WhatsApp.STATUS_DISCONNECTED
  public qr: string|null = null
  private observers: WPObserver[] = []
	public loading: LoadingType|null
  
  constructor() {
    const url = process.env.VUE_APP_WP_CLIENT_API_URL as string ?? 'http://localhost'
    const port = process.env.VUE_APP_WP_CLIENT_API_PORT ?? 3000
    this.socket = io( url + ':' + port, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000
    })
    this.onQRCode()
    this.getState()
    this.onReady()
    this.onChangeState()
    this.onDisconnected()
    this.onAuthenticationFailure()
		this.onLoadingScreen()
  }
  
  public static getInstance(): WhatsAppClient {
    if (!WhatsAppClient.instance) {
      WhatsAppClient.instance = new WhatsAppClient()
    }
    
    return WhatsAppClient.instance
  }
  
  auth(): void {
    this.socket.emit(WhatsApp.EVENT_AUTH)
  }
  
  getState(): void {
    this.socket.on(WhatsApp.EVENT_CLIENT, (info) => {
      if(info) this.socket.emit(WhatsApp.EVENT_GET_STATE)
    })
    this.socket.on(WhatsApp.EVENT_GET_STATE, (state: string) => {
      this.state = state
			this.loading = null
			this.qr = null
      this.notify()
    })
  }
  
  onQRCode(): void {
    this.socket.on(WhatsApp.EVENT_QR_CODE, (qr: string) => {
      this.qr = qr
			this.loading = null
			this.state = WhatsApp.STATUS_DISCONNECTED
      this.notify()
    })
  }
	
	onLoadingScreen(): void {
		this.socket.on(WhatsApp.LOADING_SCREEN, (loading: LoadingType) => {
			this.loading = loading
			this.qr = null
			this.notify()
		})
	}
  
  onReady(): void {
    this.socket.on(WhatsApp.EVENT_READY, () => {
      this.state = WhatsApp.STATUS_CONNECTED
			this.qr = null
			this.loading = null
      this.notify()
    })
  }
  
  onChangeState(): void {
    this.socket.on(WhatsApp.EVENT_CHANGE_STATE, (message) => {
      this.state = message
			this.qr = null
			this.loading = null
      this.notify()
    })
  }
  
  onAuthenticationFailure(): void {
    this.socket.on(WhatsApp.EVENT_AUTH_FAILURE, () => {
      this.state = WhatsApp.STATUS_DISCONNECTED
			this.qr = null
			this.loading = null
      this.notify()
    })
  }
  
  onDisconnected(): void {
    this.socket.on(WhatsApp.EVENT_DISCONNECTED, (message) => {
      this.state = message
			this.qr = null
			this.loading = null
      this.notify()
    })
  }
  
  destroy(): void {
    this.socket.emit(WhatsApp.EVENT_DESTROY)
  }
  
  reset(): void {
    this.socket.emit(WhatsApp.EVENT_RESET)
    this.socket.on(WhatsApp.EVENT_RESET, (state) => {
      this.state = state
			this.qr = null
			this.loading = null
      this.notify()
    })
  }
  
  disconnectSocket(): void {
    this.socket.disconnect()
  }
  
  isConnected(): boolean {
    return this.state === WhatsApp.STATUS_CONNECTED
  }
	
	isConnecting(): boolean {
		return this.state === WhatsApp.STATUS_OPENING
	}
  
  attach(observer: WPObserver): void {
    const isExist = this.observers.includes(observer)
    if (!isExist) this.observers.push(observer)
  }
  
  detach(observer: WPObserver): void {
    const observerIndex = this.observers.indexOf(observer)
    if (observerIndex !== -1) this.observers.splice(observerIndex, 1)
  }
  
  notify(): void {
    for (const observer of this.observers) {
      observer.update(this)
    }
  }
}