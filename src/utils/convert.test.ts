import { getFCoinFactor } from './convert'

describe('test convert file', function () {
  test('convertFCoinToPenya', () => {
    const factor = getFCoinFactor(1000, 22000000)
    const penyaAmount = 900000000
    console.log('factor', factor.xFcoin * penyaAmount)
  })
})
