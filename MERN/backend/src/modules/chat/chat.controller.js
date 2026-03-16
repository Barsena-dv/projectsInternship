const Conversation = require("./conversation.model");
const Message = require("./message.model");



// CREATE CONVERSATION
const createConversation = async (req, res) => {
    try {

        const conversation = await Conversation.create(req.body);

        res.status(201).json({
            success: true,
            data: conversation
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};


// GET ALL CONVERSATIONS
const getAllConversations = async (req, res) => {
    try {

        const getAllConversationsObj = await Conversation
            .find()
            .populate("ownerId", "fullName email")
            .populate("finderId", "fullName email");

        res.status(200).json({
            success: true,
            data: getAllConversationsObj
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};


// GET CONVERSATION BY ID
const getConversationById = async (req, res) => {
    try {

        const getConversationByIdObj = await Conversation
            .findById(req.params.id)
            .populate("ownerId finderId");

        if (getConversationByIdObj) {
            res.status(200).json({
                success: true,
                data: getConversationByIdObj
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};


// DELETE CONVERSATION
const deleteConversation = async (req, res) => {
    try {

        const deleteConversationObj = await Conversation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Conversation deleted"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};



// ===============================
// MESSAGE CRUD
// ===============================


// SEND MESSAGE
const sendMessage = async (req, res) => {
    try {

        const message = await Message.create(req.body);

        res.status(201).json({
            success: true,
            data: message
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};


// GET MESSAGES BY CONVERSATION
const getMessagesByConversation = async (req, res) => {
    try {

        const getMessagesByConversationObj = await Message
            .find({ conversationId: req.params.conversationId })
            .populate("senderId", "fullName role")
            .sort({ sentAt: 1 });

        res.status(200).json({
            success: true,
            data: getMessagesByConversationObj
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};


// UPDATE MESSAGE
const updateMessage = async (req, res) => {
    try {

        const updateMessageObj = await Message.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updateMessageObj
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};


// DELETE MESSAGE
const deleteMessage = async (req, res) => {
    try {

        await Message.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Message deleted"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};

module.exports = {
    createConversation,
    getAllConversations,
    getConversationById,
    deleteConversation,
    sendMessage,
    getMessagesByConversation,
    updateMessage,
    deleteMessage,
}