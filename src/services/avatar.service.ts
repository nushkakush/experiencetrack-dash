import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/api';

export class AvatarService {
  private static readonly BUCKET_NAME = 'avatars';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

  /**
   * Upload avatar to Supabase Storage
   */
  static async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{ url: string; fileName: string }>> {
    try {
      // Validate file
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
          data: null,
        };
      }

      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: 'File size too large. Please upload an image smaller than 5MB.',
          data: null,
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}-${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting existing files
        });

      if (error) {
        console.error('Avatar upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`,
          data: null,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        success: true,
        error: null,
        data: {
          url: urlData.publicUrl,
          fileName,
        },
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: 'An error occurred while uploading the avatar',
        data: null,
      };
    }
  }

  /**
   * Delete avatar from Supabase Storage
   */
  static async deleteAvatar(fileName: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('Avatar deletion error:', error);
        return {
          success: false,
          error: error.message,
          data: null,
        };
      }

      return {
        success: true,
        error: null,
        data: undefined,
      };
    } catch (error) {
      console.error('Avatar deletion error:', error);
      return {
        success: false,
        error: 'An error occurred while deleting the avatar',
        data: null,
      };
    }
  }

  /**
   * Get optimized avatar URL with parameters
   */
  static getAvatarUrl(fileName: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): string {
    const { width, height, quality } = options;
    const baseUrl = `https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/${this.BUCKET_NAME}/${fileName}`;
    
    if (width || height || quality) {
      const params = new URLSearchParams();
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      if (quality) params.append('quality', quality.toString());
      return `${baseUrl}?${params.toString()}`;
    }
    
    return baseUrl;
  }

  /**
   * Extract filename from avatar URL
   */
  static getFileNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    } catch (error) {
      console.error('Error extracting filename from URL:', error);
      return null;
    }
  }

  /**
   * Get avatar URL for a user (from profiles table)
   */
  static async getAvatarUrlForUser(userId: string): Promise<ApiResponse<string | null>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching avatar URL:', error);
        return {
          success: false,
          error: error.message,
          data: null,
        };
      }

      return {
        success: true,
        error: null,
        data: data?.avatar_url || null,
      };
    } catch (error) {
      console.error('Error fetching avatar URL:', error);
      return {
        success: false,
        error: 'An error occurred while fetching the avatar URL',
        data: null,
      };
    }
  }
}
