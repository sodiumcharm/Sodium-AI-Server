import { Types } from 'mongoose';
import { Notification, NotificationReceiver } from '../types/types';
import User from '../models/user.model';

const createNotification = async function (
  type: 'subscribe' | 'communicate' | 'comment' | 'follow' | 'new',
  emitter: Types.ObjectId,
  receiver?: NotificationReceiver
) {
  try {
    let notification: Notification;

    if (receiver) {
      if (receiver.receiverCharacter) {
        notification = {
          notificationType: type,
          emitter,
          receiverUser: receiver.receiverUser,
          receiverCharacter: receiver.receiverCharacter,
        };
      } else {
        notification = {
          notificationType: type,
          emitter,
          receiverUser: receiver.receiverUser,
        };
      }

      const notifiedUser = await User.findByIdAndUpdate(
        receiver.receiverUser,
        {
          $push: {
            notifications: {
              $each: [notification],
              $slice: -50,
            },
          },
        },
        { new: true }
      );

      if (!notifiedUser) return false;
    } else {
      notification = {
        notificationType: type,
        emitter,
      };

      const notifiedUser = await User.updateMany(
        { subscribing: emitter },
        {
          $push: {
            notifications: {
              $each: [notification],
              $slice: -50,
            },
          },
        }
      );

      if (!notifiedUser) return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export default createNotification;
