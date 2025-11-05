import mongoose from 'mongoose';
import Suspend from '../../models/suspend.model';
import User from '../../models/user.model';
import { BAN_THRESHOLD, SUSPEND_DAYS } from '../../constants';
import createSystemNotification from '../../notification/systemNotification';

export const registerSuspension = async function (
  userId: string | mongoose.Types.ObjectId,
  reason: string
): Promise<boolean> {
  try {
    const existingSuspension = await Suspend.findOne({ user: userId });

    if (!existingSuspension) {
      const newSuspension = await Suspend.create({
        user: userId,
        reason: reason,
        suspensionEndDate: new Date(Date.now() + SUSPEND_DAYS * 24 * 60 * 60 * 1000),
      });

      if (!newSuspension) return false;

      const suspendedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: { status: 'suspended' },
        },
        { new: true }
      );

      if (!suspendedUser || suspendedUser.status !== 'suspended') return false;

      await createSystemNotification('suspension', { receiverUser: newSuspension.user });
    } else {
      const updatedSuspension = await Suspend.findByIdAndUpdate(
        existingSuspension._id,
        {
          $inc: { suspensionCount: 1 },
          $set: {
            suspensionEndDate: new Date(
              Date.now() + existingSuspension.suspensionCount * SUSPEND_DAYS * 24 * 60 * 60 * 1000
            ),
            reason: reason,
          },
        },
        { new: true }
      );

      if (!updatedSuspension || updatedSuspension.reason !== reason) return false;

      const suspendedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: { status: 'suspended' },
        },
        { new: true }
      );

      if (!suspendedUser || suspendedUser.status !== 'suspended') return false;

      await createSystemNotification('suspension', { receiverUser: existingSuspension.user });

      if (updatedSuspension.suspensionCount >= BAN_THRESHOLD) {
        const bannedUser = await User.findByIdAndUpdate(
          userId,
          {
            $set: { status: 'banned' },
          },
          { new: true }
        );

        if (!bannedUser || bannedUser.status !== 'banned') return false;

        await createSystemNotification('ban', { receiverUser: existingSuspension.user });
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};
