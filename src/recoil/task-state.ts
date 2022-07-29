import { atom, AtomEffect } from 'recoil'

export type TaskType = { keySets: string, name: string, interval: number, id: string }
export type SessionType = {
  pageId: string | null
  macroId: string
  tasks: TaskType[]
}
export type TaskStateType = {
  session: SessionType[]
}
const DEFAULT_STATE = {
  session: [],
}
export const localStorageEffect: (key: string) => AtomEffect<TaskStateType> =
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
const taskState = atom<TaskStateType>({
  key: 'taskState', // unique ID (with respect to other atoms/selectors)
  default: DEFAULT_STATE, // default value (aka initial value)
  effects: [
    localStorageEffect('_tasks'),
  ],
})

export default taskState
