import { describe, it, expect } from 'vitest';
import { uploadToCloudinary, deleteFromCloudinary } from '../src/services/cloudinary';
import { mockCloudinary } from './config/mocks';

describe('uploadToCloudinary', () => {
  const options = {
    cloudinary: mockCloudinary,
    deleteTempFile: false,
  };

  it('should return a cloudinary upload result upon successful upload', async () => {
    const result = await uploadToCloudinary('filepath', 'folder', options);

    expect(result).toEqual({
      url: `http://mocked.cloudinary.com/filepath`,
      secure_url: `https://mocked.cloudinary.com/filepath`,
      public_id: `mocked-id-filepath`,
    });
  });

  it('should return null if filePath is missing or is an empty string', async () => {
    const filepath1 = undefined;
    const filepath2 = '';

    const resultForUndefined = await uploadToCloudinary(filepath1 as any, 'folder', options);

    const resultForEmptyString = await uploadToCloudinary(filepath2, 'folder', options);

    expect(resultForUndefined).toBeNull();
    expect(resultForEmptyString).toBeNull();
  });
});

describe('deleteFromCloudinary', () => {
  it('should return success result upon successful file deletion', async () => {
    const result = await deleteFromCloudinary('public-id', 'image', mockCloudinary);

    expect(result).toEqual({ result: 'ok' });
  });

  it('should return null if publicId is missing or is an empty string', async () => {
    const publicId1 = undefined;
    const publicId2 = '';

    const resultForUndefined = await deleteFromCloudinary(
      publicId1 as any,
      'image',
      mockCloudinary
    );

    const resultForEmptyString = await deleteFromCloudinary(publicId2, 'image', mockCloudinary);

    expect(resultForUndefined).toBeNull();
    expect(resultForEmptyString).toBeNull();
  });
});
