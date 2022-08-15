// server/index.js
import 'dotenv/config'
import puppeteer, { Browser, KeyInput, Page, PuppeteerLaunchOptions } from 'puppeteer'
import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import async from 'async'
import path from 'path'

const PORT = process.env.PORT || 3001

enum TaskStatusEnum {
  ACTIVE = 'ACTIVE',
  FREE = 'FREE'
}

const PAGE_WIDTH = 1200
const PAGE_HEIGHT = 640
let browser: Browser
type MyPage = Page
let pages: Record<string, MyPage> = {}
let pageActivity: Record<string, { protectInterrupt?: boolean, taskStatus?: TaskStatusEnum }> = {};

(async () => {
// Read data from JSON file, this will set db.data content
  // const browser = await puppeteer.launch();
  const options: PuppeteerLaunchOptions = {
    headless: false,
    userDataDir: './myUserDataDir',
  }
  console.log('Environment = ', process.env.NODE_ENV)
  if (process.env.NODE_ENV === 'production') {
    options.executablePath = './chromium/chrome.exe'
  }
  browser = await puppeteer.launch(options)
  const configPage = await browser.newPage()
  await configPage.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT })
  if (process.env.NODE_ENV === 'development') {
    await configPage.goto(`https://en.key-test.ru/`)
  } else {
    await configPage.goto(`http://localhost:${process.env.PORT}/tasks`)
  }
  const pageId = configPage.mainFrame()._id
  console.log('Config page id :', pageId)
  pages[pageId] = configPage
  pageActivity[pageId] = { protectInterrupt: false, taskStatus: TaskStatusEnum.FREE }
  // page = await browser.newPage()
})()

const playAction = async (page: MyPage, cmds: KeyInput[], castTime: number) => {
  for (const cmd of cmds) {
    const keys = cmd.split(' ')
    if (keys.length === 1) {
      await page.keyboard.press(cmd)
      await page.waitForTimeout(castTime)
      continue
    }

    // Double Press
    if (keys.length === 2) {
      const [altKey, key] = keys as KeyInput[]
      await page.keyboard.down(altKey)
      await page.keyboard.press(key)
      await page.keyboard.up(altKey)
      await page.waitForTimeout(castTime)
    }
    // await new Promise((resolve) => setTimeout(resolve, 6000))
  }
}

const autoPressQueue = async.queue(async (payload: any, cb) => {
  const { task, pageId } = payload
  const page: MyPage = pages[pageId]
  const currentPageActivity = pageActivity[pageId]
  if (!page) {
    cb()
    return
  }
  if (currentPageActivity.protectInterrupt) {
    console.log('[Auto Press] Task was ignore becuz protectInterrupt', currentPageActivity.protectInterrupt)
    cb()
    return
  }
  const cmds = task.keySets.split(',')
  const castTime = task?.castTime || 400
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${pageId}] payload task : `, JSON.stringify(task))
  }
  await playAction(page, cmds, castTime)
  console.log(`<<< End of Auto buff >>>`)
  cb()
}, 1)
const autoBuffQueue = async.queue(async (payload: any, cb) => {
  const {
    mainPlayerPos = 1,
    mainPlayerKeySets = '',
    buffPlayerKeySets = '',
    castTime = 1400,
    pageId,
  } = payload
  const page = pages[pageId]
  const currentPageActivity = pageActivity[pageId]
  if (!page) {
    cb()
    return
  }
  if (currentPageActivity.protectInterrupt) {
    console.log('[Auto Buff] Task was ignore becuz protectInterrupt', currentPageActivity.protectInterrupt)
    cb()
    return
  }

  currentPageActivity.protectInterrupt = true
  currentPageActivity.taskStatus = TaskStatusEnum.ACTIVE
  await page.waitForTimeout(500)
  await page.keyboard.press('KeyZ')
  await page.keyboard.press('Escape')
  const cmdRMBuff = buffPlayerKeySets.split(',')
  console.log(`Buff >>> Your Ringmaster ${buffPlayerKeySets}`)
  await playAction(page, cmdRMBuff, castTime)
  await page.waitForTimeout(500)

  await page.keyboard.press('KeyP')
  const x = PAGE_WIDTH - 24
  const partyMainPlayerPosition = [
    { x, y: 100 },
    { x, y: 120 },
    { x, y: 140 },
    { x, y: 160 },
    { x, y: 180 },
    { x, y: 200 },
    { x, y: 220 },
    { x, y: 240 },
  ]
  const playerPos = partyMainPlayerPosition[mainPlayerPos - 1] || { x: 0, y: 0 }
  await page.mouse.click(playerPos.x, playerPos.y)
  console.log(`Click at position >>> {${playerPos.x},${playerPos.y}}`)
  const cmdMCBuff = mainPlayerKeySets.split(',')
  console.log(`Buff >>> Your Main character ${mainPlayerKeySets}`)
  await playAction(page, cmdMCBuff, castTime)
  await page.keyboard.press('KeyP')
  await page.waitForTimeout(500)
  await page.keyboard.press('KeyZ')

  currentPageActivity.protectInterrupt = false
  console.log(`<<< End of Auto buff >>>`)
  currentPageActivity.taskStatus = TaskStatusEnum.FREE
  cb()
}, 1)

// assign a callback
autoPressQueue.drain(function () {
  // console.log('all items have been processed')
})

// assign a callback
autoBuffQueue.drain(function () {
  // console.log('all items have been processed')
})

const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.post('/api/launch', async (req: Request, res: Response) => {
  const page = await browser.newPage()
  await page.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT })
  await page.goto('https://universe.flyff.com/play')
  const pageId = page.mainFrame()._id
  pages[pageId] = page
  pageActivity[pageId] = { taskStatus: TaskStatusEnum.FREE, protectInterrupt: false }

  page.on('close', () => {
    delete pages[pageId]
    delete pageActivity[pageId]
  })

  res.json({ page: pageId, message: 'ok' })
})
app.get('/api/check', async (req: Request, res: Response) => {
  res.json({ message: 'ok' })
})
app.post('/api/click', async (req: Request, res: Response) => {
  const { pageId, x = 0, y = 0 } = req.body
  const page = pages[pageId]
  if (!page) {
    return res.json({ message: 'failure' })
  }
  await page.mouse.click(x, y)
  res.json({ message: 'ok' })
})
// app.post('/api/attack', async (req: Request, res: Response) => {
//   const page = pages[req.body.pageId]
//   if (!page) {
//     return res.status(400).json({ message: 'Invalid page id' })
//   }
//   // do something
//   await page.screenshot({                      // Screenshot the website using defined options
//     path: './screenshot.png',
//   })
//   res.json({ message: 'ok' })
// })
app.post('/api/tasks', async (req: Request, res: Response) => {
  autoPressQueue.push(req.body)
  res.json({ message: 'ok' })
})

app.post('/api/auto-buff', async (req: Request, res: Response) => {
  autoBuffQueue.push(req.body)
  res.json({ message: 'ok' })
})

app.get('/api/session', async (req: Request, res: Response) => {
  let pageId
  if (Array.isArray(req.query?.pageId)) {
    pageId = req.query?.pageId[0] || ''
  } else {
    pageId = req.query?.pageId || ''
  }
  if (pages[pageId as string]) {
    return res.json({ page: pageId })
  }
  return res.json({ page: null })
})

if (process.env.NODE_ENV === 'production') {
// Serve any static files
  app.use(express.static(path.join(process.cwd(), '/build')))

// Handle React routing, return all requests to React app
  app.get('*', function (req, res) {
    res.sendFile(path.join(process.cwd(), '/build/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})

export {}
