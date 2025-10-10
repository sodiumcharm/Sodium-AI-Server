import Suspend from '../models/suspend.model';
import User from '../models/user.model';
import { UserDocument, UserModerationResult } from '../types/types';

const userModerator = async function (user: UserDocument): Promise<UserModerationResult> {
  if (user.role === 'admin') {
    return {
      success: true,
      statusCode: 200,
      status: 'allowed',
      message: 'Your account is an admin.',
    };
  }

  if (user.status === 'suspended') {
    const suspensionDocument = await Suspend.findById(user._id);

    if (!suspensionDocument) {
      return {
        success: false,
        statusCode: 500,
        status: 'error',
        message: 'Failed to fetch your suspended account!',
      };
    }

    if (suspensionDocument.suspensionEndDate.getTime() < new Date().getTime()) {
      const activated = await User.findByIdAndUpdate(
        user._id,
        {
          status: 'active',
        },
        { new: true }
      );

      if (!activated || activated.status !== 'active') {
        return {
          success: false,
          statusCode: 500,
          status: 'activation-error',
          message: 'Failed to activate your suspended account!',
        };
      }

      return {
        success: true,
        statusCode: 200,
        status: 'allowed',
        message: 'Your account has been activated.',
      };
    }

    return {
      success: false,
      statusCode: 400,
      status: 'suspended',
      message: `Your account is suspended until ${suspensionDocument.suspensionEndDate.toLocaleDateString()}!`,
    };
  }

  if (user.status === 'banned') {
    return {
      success: false,
      statusCode: 400,
      status: 'banned',
      message: 'Your account has been banned!',
    };
  }

  return {
    success: true,
    statusCode: 200,
    status: 'allowed',
    message: 'Your account is active.',
  };
};

export default userModerator;
