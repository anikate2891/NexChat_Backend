import {Router} from 'express';
import { sendMessage, getMessages, getChats, deleteChat } from '../controller/chat.controller.js';
import {authUser} from '../middlewares/auth.middleware.js';

const chatRouter = Router();

chatRouter.get('/', authUser, getChats);
chatRouter.post('/message', authUser, sendMessage);
chatRouter.get('/:chatid/messages', authUser, getMessages);
chatRouter.delete('/delete/:chatid', authUser, deleteChat);


export default chatRouter;