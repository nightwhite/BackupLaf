// 测试用，添加一百万条数据到test数据库
import cloud from '@lafjs/cloud'

export async function main(ctx: FunctionContext) {
  // 循环往test数据库添加100万条数据，每次添加1000条
  
  const collection = cloud.mongo.db.collection('test')
  for (let i = 0; i < 1000; i++) {
    const data: { name: string }[] = []
    for (let j = 0; j < 1000; j++) {
      data.push({ name: `laf${i * 1000 + j}` })
    }
    try {
      await collection.insertMany(data)
      console.log(`插入test表第${i}批数据成功`)
    } catch (error) {
      console.log('插入失败：', error);
    }
  }
  console.log('Hello World')
  return { data: 'hi, laf' }
}
