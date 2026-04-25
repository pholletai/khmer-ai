function getMessageText(message) {
  return message?.text || "";
}

function getAttachments(message) {
  return message?.attachments || [];
}

function getAttachmentUrl(att) {
  return att?.payload?.url || "";
}

function getAttachmentType(att) {
  return att?.type || "";
}

module.exports = {
  getMessageText,
  getAttachments,
  getAttachmentUrl,
  getAttachmentType
};