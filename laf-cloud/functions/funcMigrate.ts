/**
 * 本函数为云函数迁移工具，用于将老应用的云函数迁移到新应用
 * 仅适用于1.0迁移到1.0
 * 运行在任意1.0环境均可
 * 
 * 如果同一个服务器，比如从免费应用迁移到付费应用，oldPat和newPat填相同的，oldServer和newServer填相同的，只需要修改oldAppID和newAppID即可
 * 如果是不同服务器，比如从laf.dev迁移到laf.run，则oldSever填：http://api.laf.dev，newServer填：http://api.laf.run，其他均不同，按实际情况填写
 * 
 * 云函数可以不用发布，填完参数后，可以直接点击运行，如果新应用有相同名称的云函数，则该云函数会迁移失败
 */
import cloud from '@lafjs/cloud'

const oldAppID = 'oldappid' // 老的应用appid
const oldPat = 'laf_xxxxxxxxold' // 老的应用Pat
const oldServer = 'http://api.laf.dev' // 老的Api server地址
const newAppID = 'newappid' // 新的应用appid
const newPat = 'laf_xxxxxxxxnew' // 新的应用Pat
const newServer = 'http://api.laf.run' // 新的Api server地址

export async function main(ctx: FunctionContext) {
  let oldToken, newToken;
  try {
    const oldResponse = await cloud.fetch.post(`${oldServer}/v1/auth/pat2token`, {
      pat: oldPat
    }, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const newResponse = await cloud.fetch.post(`${newServer}/v1/auth/pat2token`, {
      pat: newPat
    }, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    oldToken = oldResponse.data.data
    newToken = newResponse.data.data;
  } catch (error) {
    return { data: "获取Token失败，请检查填写的pat和server地址是否正确，"+error }
  }
  // 获取老应用云函数列表
  const oldResponse = await cloud.fetch.get(`${oldServer}/v1/apps/${oldAppID}/functions`, {
    headers: {
      Accept: 'application/json',
      Authorization: "Bearer "+oldToken
    }
  })
  const oldFuncList = oldResponse.data.data;
  // 导入到新应用
  for (let func of oldFuncList) {
    const newResponse = await cloud.fetch.post(`${newServer}/v1/apps/${newAppID}/functions`, {
      name: func.name,
      code: func.source.code.replace(`@/cloud-sdk`, '@lafjs/cloud'),
      description: func.desc,
      methods: func.methods,
      tags: func.tags
    }, {
      headers: {
        Accept: 'application/json',
        Authorization: "Bearer "+newToken
      }
    })
    if (newResponse.data.error) {
      console.log(`云函数 ${func.name} 迁移失败: ${newResponse.data.error}`)
    } else {
      console.log(`云函数 ${func.name} 迁移成功`)
    }
  }
  return { data: "迁移成功" }
}
