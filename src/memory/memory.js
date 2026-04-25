const memoryStore = new Map();

function getUserMemory(senderId) {
  if (!senderId) {
    senderId = "default-user";
  }

  if (!memoryStore.has(senderId)) {
    memoryStore.set(senderId, {
      stage: "warm",
      name: "",
      interest: "",
      budget: "",
      notes: "",
      history: [],
      updatedAt: Date.now(),
    });
  }

  return memoryStore.get(senderId);
}

function saveUserMemory(senderId, data = {}) {
  const oldData = getUserMemory(senderId);

  const newData = {
    ...oldData,
    ...data,
    history: Array.isArray(data.history) ? data.history : oldData.history,
    updatedAt: Date.now(),
  };

  memoryStore.set(senderId, newData);
  return newData;
}

function addHistory(senderId, role, content) {
  const user = getUserMemory(senderId);

  user.history.push({
    role,
    content,
    time: Date.now(),
  });

  if (user.history.length > 20) {
    user.history = user.history.slice(-20);
  }

  user.updatedAt = Date.now();
  memoryStore.set(senderId, user);

  return user.history;
}

function getHistory(senderId) {
  return getUserMemory(senderId).history || [];
}

function addMessage(senderId, role, content) {
  return addHistory(senderId, role, content);
}

module.exports = {
  getUserMemory,
  saveUserMemory,
  addHistory,
  getHistory,
  addMessage,
};