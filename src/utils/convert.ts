export const getFCoinFactor = (fcoinUnit: number, toEqualPenya: number): {
  xFcoin: number
  xPenya: number
} => {
  const xFcoin = fcoinUnit / toEqualPenya
  const xPenya = toEqualPenya / fcoinUnit
  return {
    xFcoin,
    xPenya,
  }
}
export const getThbFactor = (thbUnit: number, toFCoin: number): {
  xThb: number
} => {
  const xThb = thbUnit / toFCoin
  return {
    xThb,
  }
}
