const { handleText } = require("./handleText");
const { handleImage } = require("./handleImage");
const { handleAudio } = require("./handleAudio");
const {
getMessageText,
getAttachments,
getAttachmentUrl,
getAttachmentType
} = require("../utils/helpers");

async function handleMessage(message) {
// ✅ ទាញ userId ចេញពី message
const userId = message?.sender?.id || message?.from?.id;

const text = getMessageText(message);
if (text) {
return await handleText(text, userId); // ✅ pass userId
}

const attachments = getAttachments(message);
if (attachments.length > 0) {
const firstAttachment = attachments[0];
const type = getAttachmentType(firstAttachment);
const url = getAttachmentUrl(firstAttachment);
if (!url) {
  return "ขออภัยครับ ระบบอ่านไฟล์แนบไม่สำเร็จ";
}

if (type === "image") {
  return await handleImage(url, userId); // ✅ pass userId
}

if (type === "audio") {
  return await handleAudio(url, userId); // ✅ pass userId
}

return "ขออภัยครับ ตอนนี้ระบบยังไม่รองรับไฟล์แนบประเภทนี้";

}

return "ขออภัยครับ ระบบไม่พบข้อความที่สามารถประมวลผลได้";
}

module.exports = {
handleMessage
};