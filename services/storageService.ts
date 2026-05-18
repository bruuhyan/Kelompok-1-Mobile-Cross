/**
 * Storage Service - Supabase Storage operations
 */

import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const AVATARS_BUCKET = 'profile-pictures';
const MAX_SIZE = 512;
const JPEG_QUALITY = 0.7;

export interface PickedImage {
  uri: string;
  base64: string;
}


export const storageService = {
  async pickImageFromCamera(): Promise<PickedImage | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: JPEG_QUALITY,
      maxWidth: MAX_SIZE,
      maxHeight: MAX_SIZE,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      throw new Error('Failed to get base64 data from camera');
    }
    return { uri: asset.uri, base64: asset.base64 };
  },

  async pickImageFromGallery(): Promise<PickedImage | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Gallery permission is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: JPEG_QUALITY,
      maxWidth: MAX_SIZE,
      maxHeight: MAX_SIZE,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      throw new Error('Failed to get base64 data from gallery');
    }
    return { uri: asset.uri, base64: asset.base64 };
  },

  async uploadAvatar(userId: string, base64: string): Promise<string> {
    const filePath = userId + '/avatar.jpg';

    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  async deleteAvatar(userId: string): Promise<void> {
    const filePath = userId + '/avatar.jpg';

    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([filePath]);

    if (error && error.message !== 'The resource was not found') {
      throw error;
    }
  },
};
