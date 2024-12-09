import bcrypt from 'bcryptjs';
import User  from '../../models/user';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end(); 

  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }


  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
  
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
}
