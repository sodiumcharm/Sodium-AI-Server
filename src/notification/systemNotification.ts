import { Notification, NotificationReceiver, NotificationType } from '../types/types';
import User from '../models/user.model';

const createSystemNotification = async function (
  type: NotificationType,
  receiver?: NotificationReceiver
) {
  const origin = 'system';

  try {
    let notification: Notification;

    if (receiver) {
      if (receiver.receiverCharacter) {
        notification = {
          origin,
          notificationType: type,
          receiverUser: receiver.receiverUser,
          receiverCharacter: receiver.receiverCharacter,
        };
      } else {
        notification = {
          origin,
          notificationType: type,
          receiverUser: receiver.receiverUser,
        };
      }

      const notifiedUser = await User.findByIdAndUpdate(
        receiver.receiverUser,
        {
          $push: {
            notifications: {
              $each: [notification],
              $slice: -30,
            },
          },
        },
        { new: true }
      );

      if (!notifiedUser) return false;
    } else {
      notification = {
        origin,
        notificationType: type,
      };

      const notifiedUser = await User.updateMany(
        {},
        {
          $push: {
            notifications: {
              $each: [notification],
              $slice: -30,
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

export default createSystemNotification;
