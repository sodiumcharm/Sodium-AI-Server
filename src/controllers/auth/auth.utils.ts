import bcrypt from 'bcrypt';
import { UserDocument, TokenGenerationResult } from '../../types/types';
import User from '../../models/user.model';

export const generateTokens = async function (user: UserDocument): Promise<TokenGenerationResult> {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    return {
      accessToken: '',
      refreshToken: '',
      success: {
        statusCode: 500,
        success: false,
        message: 'Failed to generate authentication tokens!',
      },
    };
  }

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $set: { refreshToken: hashedRefreshToken } },
    { new: true }
  ).select('-password -refreshToken -registeredBy -lastUsernameChanged -usernameCooldown -__v');

  if (!updatedUser) {
    return {
      accessToken: '',
      refreshToken: '',
      success: {
        statusCode: 500,
        success: false,
        message: 'Unable to issue tokens at the moment! Please try again later.',
      },
    };
  }

  return {
    accessToken,
    refreshToken,
    user: updatedUser,
    success: {
      statusCode: 200,
      success: true,
      message: 'Tokens issued successfully.',
    },
  };
};
