import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository, EmployeeRepository, AuditLogRepository } from '../services/dbRepository.js';
import { AuthRequest } from '../middleware/auth.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback-super-secret-attendance-key';

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  try {
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ message: 'Your account is suspended. Please contact the administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // Fetch profile info if employee
    let profile = null;
    if (user.role === 'employee') {
      profile = await EmployeeRepository.findById(user.id);
    }

    // Create Audit Log
    await AuditLogRepository.create({
      id: `${user.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Login',
      userId: user.id,
      details: `${user.role} logged in successfully.`
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status
      },
      profile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { username, password } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  try {
    const user = await UserRepository.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const updates: any = {};
    if (username) {
      const existingUser = await UserRepository.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ message: 'Username is already taken.' });
        return;
      }
      updates.username = username;
    }

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    await UserRepository.update(userId, updates);

    // Also update username in employee profile if employee
    if (user.role === 'employee' && username) {
      await EmployeeRepository.update(userId, { username });
    }

    await AuditLogRepository.create({
      id: `${userId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Update Credentials',
      userId,
      details: 'User updated username or password.'
    });

    res.status(200).json({ message: 'Credentials updated successfully.' });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
