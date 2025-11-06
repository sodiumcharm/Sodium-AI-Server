import User from '../models/user.model';
import { Notification } from '../types/types';

const createScheduledNotification = async function (text: string, image: string) {
  const origin = 'system';

  if (!text) return false;
  if (!image) return false;

  try {
    const notification: Notification = {
      origin,
      notificationType: 'casual',
      text,
      image,
    };

    await User.updateMany(
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

    return true;
  } catch (error) {
    return false;
  }
};

export default createScheduledNotification;
