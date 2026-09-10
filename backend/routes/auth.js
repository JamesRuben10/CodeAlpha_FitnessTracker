const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const createVerificationCode = () => String(crypto.randomInt(100000, 1000000));

const hashVerificationCode = (code) => crypto
  .createHash('sha256')
  .update(code)
  .digest('hex');

const sendVerificationEmail = async (user, code) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[DEV] Email is not configured. Verification code for ${user.email}: ${code}`);
    return { sent: false, configured: false };
  }

  const transporter = nodemailer.createTransport({
    ...(process.env.SMTP_SERVICE ? { service: process.env.SMTP_SERVICE } : {}),
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'Your Fitness Tracker verification code',
    text: `Hi ${user.name}, your Fitness Tracker verification code is ${code}. It expires in 15 minutes.`
  });
  return { sent: true, configured: true };
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationCode = createVerificationCode();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationCodeHash: hashVerificationCode(verificationCode),
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000)
    });

    const emailResult = await sendVerificationEmail(user, verificationCode);

    res.status(201).json({
      message: emailResult.sent
        ? 'We sent a verification code to your email.'
        : 'Your account was created, but email delivery is not configured. Configure SMTP, then use Resend code.',
      verificationRequired: true,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+password +isVerified');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        verificationRequired: true,
        email: user.email
      });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      dailyGoal: user.dailyGoal,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify
// @desc    Verify a new account with its email code
router.post('/verify', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { code } = req.body;
    const user = await User.findOne({ email }).select('+verificationCodeHash +verificationExpires');

    if (!user || !user.verificationCodeHash || !user.verificationExpires || user.verificationExpires < new Date()) {
      return res.status(400).json({ message: 'That verification code has expired. Please request a new one.' });
    }

    if (hashVerificationCode(String(code).trim()) !== user.verificationCodeHash) {
      return res.status(400).json({ message: 'The verification code is incorrect.' });
    }

    user.isVerified = true;
    user.verificationCodeHash = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully.',
      _id: user.id,
      name: user.name,
      email: user.email,
      dailyGoal: user.dailyGoal,
      theme: user.theme,
      achievements: user.achievements,
      streak: user.streak,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account exists with that email.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified.' });
    }

    const verificationCode = createVerificationCode();
    user.verificationCodeHash = hashVerificationCode(verificationCode);
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    const emailResult = await sendVerificationEmail(user, verificationCode);

    res.json({
      message: emailResult.sent
        ? 'A new verification code was sent to your email.'
        : 'A new code was generated, but email delivery is not configured. Check the backend terminal.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route   PUT /api/auth/goals
// @desc    Update daily goals
router.put('/goals', protect, async (req, res) => {
  try {
    const { calories, steps, workoutMinutes } = req.body;
    const user = await User.findById(req.user.id);
    
    if (calories) user.dailyGoal.calories = calories;
    if (steps) user.dailyGoal.steps = steps;
    if (workoutMinutes) user.dailyGoal.workoutMinutes = workoutMinutes;
    
    await user.save();
    res.json(user.dailyGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/theme', protect, async (req, res) => {
  try {
    if (!['light', 'dark'].includes(req.body.theme)) {
      return res.status(400).json({ message: 'Theme must be light or dark.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { theme: req.body.theme },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ theme: user.theme });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;