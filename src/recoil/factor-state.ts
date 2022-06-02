import { atom, AtomEffect } from 'recoil'

export const BASE_FCOIN = 11500
export const BASE_THB = 3554.9

export const DEFAULT_STATE = {
  penya: 22000000,
  fcoin: 1000,
  thb: 3554.90
}

type FactorState = {
  fcoin: number
  penya: number
  thb: number
}
const localStorageEffect: (key: string) => AtomEffect<FactorState> =
  key =>
    ({ setSelf, onSet }) => {
      if (typeof window !== 'object') return
      const savedValue = localStorage.getItem(key)
      if (savedValue != null) {
        setSelf(JSON.parse(savedValue))
      }
      onSet((newValue, _, isReset) => {
        isReset
          ? localStorage.removeItem(key)
          : localStorage.setItem(key, JSON.stringify(newValue))
      })
    }

const factorState = atom<FactorState>({
  key: 'factorState', // unique ID (with respect to other atoms/selectors)
  default: DEFAULT_STATE, // default value (aka initial value)
  effects: [localStorageEffect('_factor')],
})

export default factorState
