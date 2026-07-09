// server/services/syncService.js
// 职责：在页面保存时同步触发文件写入。
// 仅手动保存触发，不阻塞数据库写入流程。

import { savePageFile } from "./fileStorageService.js"

/**
 * 在页面保存时同步触发文件写入。
 * 内部调用 savePageFile，将页面数据写入 filesystem。
 * 所有异常被捕获并 console.error，不抛到上层（数据库写入不受影响）。
 *
 * @param {object} page - 完整 page 对象，需包含 { id, slug?, content }
 */
export function syncPageToFile(page) {
  try {
    savePageFile(page)
    console.log(`[sync] page ${page.id} synced to file`)
  } catch (err) {
    console.error(`[sync] failed to sync page ${page.id}:`, err.message)
    // 不抛异常，数据库写入不受影响
  }
}
