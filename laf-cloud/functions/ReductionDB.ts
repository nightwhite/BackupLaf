/**
 * 本函数在新的1.0Laf上运行，用于还原数据库
 * bucket 配置为新Laf的存储桶名称
 *
 * 需要先在老1.0的云函数中运行备份云函数，将数据备份到新Laf的存储桶中后在运行本云函数
 */
import cloud from "@lafjs/cloud";
const db = cloud.database();
const bucket = `<appid>-<bucketName>`; // 请替换为你的存储桶名称，填目标迁移laf的存储桶名称，打开读写权限
const bucketURL = "https://oss.laf.run"; // 请替换为你的目标迁移laf的oss域名

export async function main(ctx: FunctionContext) {
  // 数据库info.json
  const info: {
    [key: string]: number;
  } = (await cloud.fetch(`${bucket}.${bucketURL}/BackupDB/info.json`))
    .data;
  // 遍历数据库
  for (const [key, value] of Object.entries(info)) {
    //按1000条分批次插入
    const batchTimes = Math.ceil(value / 1000);
    // 遍历数据库中的表
    let start = 0;
    //如果查询到批次
    const batchRes = await db
      .collection("ReductionDB")
      .where({ DbName: key })
      .getOne();
    if (batchRes.data) {
      start = batchRes.data.Batch;
    }
    for (let i = start; i < batchTimes; i++) {
      try {
        const data = (
          await cloud.fetch(
            `${bucket}.${bucketURL}/BackupDB/${key}/${i}.json`
          )
        ).data;
        // 插入数据
        const collection = cloud.mongo.db.collection(key);
        await collection.insertMany(data);
        console.log(`插入${key}表第${i}批数据成功`);
        // 记录插入表的批次，保存到数据库
        await db.collection("ReductionDB").add({
          DbName: key,
          Batch: i,
        });
      } catch (error) {
        console.log("插入失败：", error);
        return { data: error };
      }
    }
  }
  // 记录日志
  console.log("全部数据库恢复完成");
  return { data: "全部数据库恢复完成" };
}
