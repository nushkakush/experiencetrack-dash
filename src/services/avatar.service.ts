import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class AvatarService {
  /**
   * Upload an avatar image for a student
   * Only super admins can upload avatars
   */
  static async uploadAvatar(
    studentId: string,
    file: File
  ): Promise<AvatarUploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
        };
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Please upload an image smaller than 5MB.',
        };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        Logger.getInstance().error('Avatar upload error', { error, studentId, fileName });
        return {
          success: false,
          error: 'Failed to upload avatar. Please try again.',
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error) {
      Logger.getInstance().error('Avatar upload error', { error, studentId, fileName });
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Delete an avatar image
   * Only super admins can delete avatars
   */
  static async deleteAvatar(fileName: string): Promise<AvatarUploadResult> {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      if (error) {
        Logger.getInstance().error('Avatar deletion error', { error, fileName });
        return {
          success: false,
          error: 'Failed to delete avatar. Please try again.',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Avatar deletion error', { error, fileName });
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Get avatar URL with optional transformations
   */
  static getAvatarUrl(fileName: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): string {
    if (!fileName) return '';

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    let url = data.publicUrl;

    // Add transformation parameters if provided
    if (options) {
      const params = new URLSearchParams();
      if (options.width) params.append('width', options.width.toString());
      if (options.height) params.append('height', options.height.toString());
      if (options.quality) params.append('quality', options.quality.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return url;
  }

  /**
   * Extract filename from avatar URL
   */
  static getFileNameFromUrl(url: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      return '';
    }
  }
}
