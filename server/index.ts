// server/index.js

import puppeteer, { Browser, Page } from 'puppeteer'
import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import async from 'async'
import path from 'path'

const PORT = process.env.PORT || 3001

let browser: Browser
let page: Page

(async () => {
// Read data from JSON file, this will set db.data content
  // const browser = await puppeteer.launch();
  browser = await puppeteer.launch({
    headless: false,
    userDataDir: './myUserDataDir',
  })
  const configPage = await browser.newPage()
  await configPage.setViewport({ width: 1296, height: 800 })
  if (process.env.NODE_ENV === 'development') {
    await configPage.goto(`http://localhost:3000/tasks`)
  } else {
    await configPage.goto(`http://localhost:${process.env.PORT}/tasks`)
  }
  // page = await browser.newPage()
})()

const q = async.queue(async (task: any, cb) => {
  if (page) {
    const cmds = task.keySets.split(',')
    for (const cmd of cmds) {
      await page.keyboard.press(cmd)
      await page.waitForTimeout(1000)
      // await new Promise((resolve) => setTimeout(resolve, 6000))
    }
  }
  cb()
}, 1)

// assign a callback
q.drain(function () {
  console.log('all items have been processed')
})

const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.post('/api/launch', async (req: Request, res: Response) => {
  if (page) {
    return res.json({ message: 'ok' })
  }
  page = await browser.newPage()
  await page.setViewport({ width: 1296, height: 800 })
  await page.goto('https://universe.flyff.com/play')
  res.json({ message: 'ok' })
})
app.get('/api/check', async (req: Request, res: Response) => {
  res.json({ message: 'ok' })
})
app.post('/api/tasks', async (req: Request, res: Response) => {
  q.push(req.body)
  res.json({ message: 'ok' })
})

if (process.env.NODE_ENV === 'production') {
// Serve any static files
  app.use(express.static(path.join(__dirname, '../build')))

// Handle React routing, return all requests to React app
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../build', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})

export {}
