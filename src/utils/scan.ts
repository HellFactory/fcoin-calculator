import tesseract, { createWorker } from 'tesseract.js'

export const scanMonster = async (filePath = './screenshot.png') => {
  const worker = createWorker()
  await worker.load()
  await worker.loadLanguage('eng')
  await worker.initialize('eng')

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789Waris',
  });
  const result = await worker
    .recognize(filePath, {
      rectangle: { top: 0, left: 0, width: 100, height: 100 },
    })

  await worker.terminate()

  console.log('result', JSON.stringify(result))

}
