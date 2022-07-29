import React, { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import numeral from 'numeral'
import classNames from 'classnames'
import './App.css'
import { RecoilRoot, useRecoilState } from 'recoil'
import factorState, { BASE_FCOIN, DEFAULT_STATE } from './recoil/factor-state'
import { getFCoinFactor, getThbFactor } from './utils/convert'
import TaskContainers from './TaskContainers'
import { useCurrencyRate } from './hooks/useCurrencyRate'

const inputClassName = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline'
const FactorSetup = () => {
  const [factor, setFactor] = useRecoilState(factorState)
  const rate = useCurrencyRate()
  const onChange = (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFactor({
      ...factor,
      [field]: event.target.value,
    })
  }
  const handleClickReset = () => {
    setFactor(DEFAULT_STATE)
  }
  return (
    <>
      <h1 className="font-semibold text-2xl my-4">Factor Setup</h1>
      <div className="container my-0 mx-auto max-w-[400px]">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <section className="grid grid-cols-2 gap-5">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Penya
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                value={factor.penya}
                onChange={(e) => onChange(e, 'penya')}
                className={inputClassName}
                id="penya"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                FCoin
              </label>
              <input
                type="text"
                onChange={(e) => onChange(e, 'fcoin')}
                pattern="[0-9]*"
                value={factor.fcoin}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="fcoin"
              />
            </div>
          </section>
          <button
            onClick={handleClickReset}
            className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          >
            Reset
          </button>
        </form>
        <p>
          {numeral(BASE_FCOIN).format('0,0.[00]')} fcoin = {numeral((rate?.thb?.rate || 0) * 100).format('0,0.[00]')} THB
        </p>
      </div>
    </>
  )
}

const DisplayFactorConvert = () => {
  const [state, setState] = useState<{ fcoinUnit: number | string, penyaUnit: number | string }>({
    fcoinUnit: '0',
    penyaUnit: '0',
  })
  const [factor] = useRecoilState(factorState)
  const rate = useCurrencyRate()
  const { xFcoin, xPenya } = getFCoinFactor(factor.fcoin, factor.penya)
  const thbUnit = (rate?.thb?.rate || 0) * 100
  const { xThb } = getThbFactor(thbUnit, BASE_FCOIN)
  const handleFcoinUnitChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setState({
      ...state,
      [field]: numeral(e.target.value).value(),
    })
  }
  const penyaDisplay = (+state.fcoinUnit * xPenya)
  const fcoinDisplay = (+state.penyaUnit * xFcoin)
  const thbDisplay = (+state.fcoinUnit * xThb)
  return (
    <div className="container my-0 mx-auto">
      <section className="flex flex-col items-center">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex gap-5 items-center">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              FCoin
            </label>
            <input
              name="fcoinUnit"
              pattern="[0-9]*"
              onChange={(e) => handleFcoinUnitChange(e, 'fcoinUnit')}
              className={inputClassName}
            />
          </div>
          <div>
            {` - >`}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Penya
            </label>
            <input
              name="penyaUnit"
              disabled
              value={numeral(penyaDisplay).format('0,0.[000]a', Math.floor)}
              className={classNames(
                inputClassName,
                'border-0',
              )}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              THB
            </label>
            <input
              name="fcoinUnit"
              pattern="[0-9]*"
              disabled
              value={numeral(thbDisplay).format('0,0.[00]', Math.floor)}
              className={classNames(
                inputClassName,
                'border-0',
              )}
            />
          </div>
        </form>

        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex gap-5 items-center">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Penya
            </label>
            <input
              name="penyaUnit"
              pattern="[0-9]*"
              onChange={(e) => handleFcoinUnitChange(e, 'penyaUnit')}
              className={inputClassName}
            />
          </div>
          <div>
            {` - >`}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              FCoin
            </label>
            <input
              pattern="[0-9]*"
              disabled
              value={numeral(fcoinDisplay).format('0,0.[000]', Math.floor)}
              className={classNames(
                inputClassName,
                'border-0',
              )}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              THB
            </label>
            <input
              name="fcoinUnit"
              pattern="[0-9]*"
              disabled
              value={numeral(fcoinDisplay * xThb).format('0,0.[000]', Math.floor)}
              className={classNames(
                inputClassName,
                'border-0',
              )}
            />
          </div>
        </form>

      </section>
    </div>
  )
}

const FlyffFcoinCalculate = () => {
  return (
    <div className="App">
      <FactorSetup />
      <DisplayFactorConvert />
      <footer>
        powered by <a href="https://hellfactory.com/" target="_blank" className="text-blue-600">Hell Factory </a>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <RecoilRoot>
        <Routes>
          <Route index={true} element={<FlyffFcoinCalculate />} />
          <Route path="/tasks" element={<TaskContainers />} />
        </Routes>
      </RecoilRoot>
    </BrowserRouter>

  )
}

export default App
