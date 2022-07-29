import { scanMonster } from './scan'
import path from 'path'

describe('Test scan', function () {
  test('Scan monster', async () => {
    const filePath = path.join(process.cwd(), './screenshot.png')
    console.log('filePath', filePath)
    const a = await scanMonster(filePath)
    console.log('a', a)
  }, 500000)
})
