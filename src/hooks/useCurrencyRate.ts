import useSWR from 'swr'
import { fetcher } from '../utils/fetcher'

export const useCurrencyRate = (): any => {
  const { data } = useSWR('http://www.floatrates.com/daily/usd.json', fetcher)
  return data
}
