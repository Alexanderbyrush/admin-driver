import {VueWrapper, mount, flushPromises} from '@vue/test-utils'
import Edit from "@/views/drivers/Edit.vue"
import {Field, Form, ErrorMessage} from 'vee-validate'
import i18n from '@/plugins/i18n'
import ImageLoader from '@/components/ImageLoader.vue'
import router from '@/router'
import DriverRepository from "@/repositories/DriverRepository";
import DriverMock from "../../../mocks/entities/DriverMock";
import dayjs from 'dayjs'
import ToastService from "@/services/ToastService";
import waitForExpect from 'wait-for-expect'
import { nextTick } from 'vue'
import Driver from '@/models/Driver'
import DateHelper from '@/helpers/DateHelper'


describe('Edit.vue', () => {
  let wrapper: VueWrapper<any>
  
  beforeEach(() => {
    DriverRepository.getDriver = jest.fn().mockResolvedValue(DriverMock)
    DriverRepository.update = jest.fn().mockResolvedValue(null)
    wrapper = mount(Edit, {
      attachTo: '#root',
      global: {
          plugins: [router, i18n]
        },
    })
  })
  
  afterEach(async () => {
    await flushPromises()
    jest.resetAllMocks()
  })
  
  it('A user can enable a driver', async () => {
    const field = wrapper.find('input[name="enable"]')
    await field.trigger('click')
    
    expect(wrapper.vm.driver.enabled_at).toBe(dayjs().unix())
  })
  
  it('A user can disable a driver', async () => {
    wrapper.vm.driver.enabled_at = dayjs().unix()
    await wrapper.vm.$nextTick()
    const field = wrapper.find('input[name="enable"]')
    await field.trigger('click')
    
    expect(wrapper.vm.driver.enabled_at).toBe(0)
  })
  
  it('A user see the inputs to edit a driver', () => {
    const unix = dayjs().unix()
    DriverMock.vehicle.soat_exp = unix
    DriverMock.vehicle.tec_exp = unix
    DriverRepository.getDriver = jest.fn().mockResolvedValue(DriverMock)
    wrapper = mount(Edit, {
      attachTo: '#root',
      global: {
        plugins: [router, i18n]
      },
    })
    const field = wrapper.findAllComponents(Field)
    const form = wrapper.findComponent(Form)
    const error = wrapper.findAllComponents(ErrorMessage)
    const imageLoader = wrapper.findAllComponents(ImageLoader)
    expect(field.length).toBe(13)
    expect(form.exists()).toBeTruthy()
    expect(error.length).toBe(3)
    expect(imageLoader.length).toBe(2)
    expect(wrapper.text()).toContain(DateHelper.unixToDate(unix, 'YYYY-MM-DD'))
  })

  it('A user sees the Span when submit', async () => {
    DriverRepository.getDriver = jest.fn().mockResolvedValue(new Driver())
    DriverRepository.update = jest.fn().mockResolvedValue(null)
    wrapper = mount(Edit, {
      attachTo: '#root',
      global: {
          plugins: [router, i18n]
        },
    })
    await nextTick()
    const button = wrapper.find('button[type="submit"]')
    await button.trigger('click')
    await nextTick()
    const span = wrapper.findAll('.is-invalid')    
    await nextTick()
    expect(span.length).toBe(10)
  })
  
  it('should show toast success when update driver successfully', async () => {
    const success =  jest.spyOn(ToastService, 'toast')
    await wrapper.vm.updateDriver()
    
    expect(success).toHaveBeenCalledWith('success', wrapper.vm.$t('common.messages.updated'))
  })
  
  it('should show toast error when update driver fail', async () => {
    const error =  jest.spyOn(ToastService, 'toast')
    DriverRepository.update = jest.fn().mockRejectedValue(new Error('new Error'))
    await wrapper.vm.updateDriver()
    
    await waitForExpect(() => {
      expect(error).toHaveBeenCalledWith('error', wrapper.vm.$t('common.messages.error'), 'new Error')
    })
  })
  
  it('it must exec function when child emit event', async () => {
    const imageLoader = wrapper.findAllComponents(ImageLoader)
    await imageLoader.at(1)?.vm.$emit('image-driver-loaded', 'updatedUrl.com')
    await wrapper.vm.$nextTick()
    await imageLoader.at(0)?.vm.$emit('image-vehicle-loaded', 'updatedVehicleUrl.com')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.driver.photoUrl).toMatch('updatedUrl.com')
    expect(wrapper.vm.driver.vehicle.photoUrl).toMatch('updatedVehicleUrl.com')
  })
})