import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { EmployeeRepository, UserRepository, AuditLogRepository } from '../services/dbRepository.js';
import { AuthRequest } from '../middleware/auth.js';
import { IEmployee } from '../models/types.js';

export async function getAllEmployees(req: AuthRequest, res: Response): Promise<void> {
  try {
    const employees = await EmployeeRepository.findAll();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getEmployeeById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function addEmployee(req: AuthRequest, res: Response): Promise<void> {
  const {
    employeeName,
    employeeId,
    department,
    designation,
    mobileNumber,
    email,
    joiningDate,
    username,
    password,
    profilePhoto
  } = req.body;

  if (!employeeName || !employeeId || !department || !designation || !email || !username || !password) {
    res.status(400).json({ message: 'Required fields are missing.' });
    return;
  }

  try {
    // Check if ID or Username already exists
    const existingEmp = await EmployeeRepository.findById(employeeId);
    if (existingEmp) {
      res.status(400).json({ message: `Employee ID ${employeeId} already exists.` });
      return;
    }

    const existingUser = await UserRepository.findByUsername(username);
    if (existingUser) {
      res.status(400).json({ message: `Username '${username}' is already taken.` });
      return;
    }

    // Create User record for auth
    const passwordHash = await bcrypt.hash(password, 10);
    await UserRepository.create({
      id: employeeId,
      username,
      passwordHash,
      role: 'employee',
      status: 'active'
    });

    // Create Employee details record
    const employee: IEmployee = {
      employeeId,
      name: employeeName,
      department,
      designation,
      mobileNumber: mobileNumber || '',
      email,
      joiningDate,
      username,
      profilePhoto: profilePhoto || '',
      status: 'active'
    };

    await EmployeeRepository.create(employee);

    // Log Action
    await AuditLogRepository.create({
      id: `add_${employeeId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Onboard Employee',
      userId: req.user?.id || 'SYSTEM',
      details: `Added new employee ${employeeName} (${employeeId}) in ${department}.`
    });

    res.status(201).json({ message: 'Employee added successfully.', employee });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function editEmployee(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    name,
    department,
    designation,
    mobileNumber,
    email,
    joiningDate,
    profilePhoto
  } = req.body;

  try {
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const updates: Partial<IEmployee> = {};
    if (name) updates.name = name;
    if (department) updates.department = department;
    if (designation) updates.designation = designation;
    if (mobileNumber !== undefined) updates.mobileNumber = mobileNumber;
    if (email) updates.email = email;
    if (joiningDate) updates.joiningDate = joiningDate;
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;

    await EmployeeRepository.update(id, updates);

    // Log Action
    await AuditLogRepository.create({
      id: `edit_${id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Edit Employee',
      userId: req.user?.id || 'SYSTEM',
      details: `Updated details for employee ${id}.`
    });

    res.status(200).json({ message: 'Employee details updated successfully.' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function suspendEmployee(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'suspended'

  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ message: 'Invalid status type. Must be active or suspended.' });
    return;
  }

  try {
    const user = await UserRepository.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    await UserRepository.update(id, { status });
    await EmployeeRepository.update(id, { status });

    // Log Action
    await AuditLogRepository.create({
      id: `status_${id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: status === 'suspended' ? 'Suspend Employee' : 'Activate Employee',
      userId: req.user?.id || 'SYSTEM',
      details: `Changed employee ${id} account status to ${status}.`
    });

    res.status(200).json({ message: `Employee status changed to ${status}.` });
  } catch (error) {
    console.error('Error suspending employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function deleteEmployee(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    await EmployeeRepository.delete(id);
    await UserRepository.delete(id);

    // Log Action
    await AuditLogRepository.create({
      id: `delete_${id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Delete Employee',
      userId: req.user?.id || 'SYSTEM',
      details: `Permanently removed employee record: ${employee.name} (${id}).`
    });

    res.status(200).json({ message: 'Employee deleted permanently.' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
