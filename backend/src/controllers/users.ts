import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer storage to use memory so we can base64 encode
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir.'));
    }
  }
});

export const uploadAvatarMiddleware = upload.single('avatar');

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { bio, avatarUrl, username } = req.body;
    
    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    
    // Handle Username Update
    if (username && typeof username === 'string' && username.trim().length > 0) {
      const trimmedUsername = username.trim();
      const existingUser = await prisma.user.findUnique({ where: { username: trimmedUsername } });
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
        return;
      }
      updateData.username = trimmedUsername;
    }
    
    // If a file was uploaded via multer, convert to base64
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      updateData.avatarUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    } else if (avatarUrl !== undefined) {
      // Allow passing a direct URL as fallback
      updateData.avatarUrl = avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        totalPoints: true,
        achievements: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error while updating profile.' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        totalPoints: true,
        achievements: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        predictions: {
          include: {
            match: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error while fetching user profile.' });
  }
};
