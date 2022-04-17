import {mount, VueWrapper} from '@vue/test-utils'
import SideBar from '@/components/SideBar.vue'
import router from '@/router'
import i18n from '@/plugins/i18n'
import AuthService from '@/services/AuthService'

describe('SideBar.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(async () => {
    wrapper = mount(SideBar,
      {
        attachTo: '#root',
        global: {
          plugins: [router, i18n]
        },
      })
    await router.isReady()
  })

  it('an user can show buttons to users and dashboard', async () => {
    expect(wrapper.find('#sidenav-main').exists()).toBeTruthy()
    expect(wrapper.html()).toContain(wrapper.vm.$t('routes.users'))
  })

  it('an user can sign out', async () => {
    const logout = jest.spyOn(AuthService, 'logOut')
    const btn = wrapper.find('#signOut')
    await btn.trigger('click')
    expect(logout).toBeCalled()
  })
})