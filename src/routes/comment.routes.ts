import { Router } from 'express';
import { uploadCommentImage } from '../middlewares/multer.middleware';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import {
  deleteComment,
  editComment,
  getComments,
  getReplies,
  likeComment,
  postComment,
  reportComment,
} from '../controllers/comment/comment.controllers';
import { commentLimiterPerHour, commentLimiterPerMinute } from '../config/expressRateLimit';
import { checkMerit } from '../middlewares/meritChecker.middleware';

const router = Router();

router.route('/load-comments').get(getComments);

router.route('/load-replies').get(getReplies);

router
  .route('/post')
  .post(
    verifyAuth,
    checkMerit,
    commentLimiterPerMinute,
    commentLimiterPerHour,
    uploadCommentImage.single('image'),
    postComment
  );

router.route('/edit').patch(verifyAuth, checkMerit, editComment);

router.route('/delete/:commentId').delete(verifyAuth, deleteComment);

router.route('/like/:commentId').patch(verifyAuth, likeComment);

router.route('/report/:commentId').post(verifyAuth, reportComment);

export default router;
