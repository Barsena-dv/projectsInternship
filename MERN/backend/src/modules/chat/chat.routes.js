const router = require("express").Router();
const chatController = require("./chat.controller");


router.post("/conversation/create", chatController.createConversation);
router.get("/conversations", chatController.getAllConversations);
router.get("/conversation/:id", chatController.getConversationById);
router.delete("/conversation/:id", chatController.deleteConversation);

router.post("/message/send", chatController.sendMessage);
router.get("/messages/:conversationId", chatController.getMessagesByConversation);
router.put("/message/:id", chatController.updateMessage);
router.delete("/message/:id", chatController.deleteMessage);


module.exports = router;