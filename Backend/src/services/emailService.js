import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      const emailConfig = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // Skip email configuration if not provided
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.warn('Email configuration not provided. Email features will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransporter(emailConfig);
      this.isConfigured = true;

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
          this.isConfigured = false;
        } else {
          console.log('Email service is ready to send messages');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   */
  async sendEmail(options) {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email to new user
   * @param {Object} user - User object
   * @param {string} verificationToken - Email verification token
   */
  async sendWelcomeEmail(user, verificationToken = null) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to RBAC System!</h2>
        <p>Hi ${user.name},</p>
        <p>Welcome to our Role-Based Access Control System. Your account has been successfully created.</p>
        <p><strong>Account Details:</strong></p>
        <ul>
          <li>Email: ${user.email}</li>
          <li>Role: ${user.role?.name || 'Not assigned'}</li>
        </ul>
    `;

    if (verificationToken) {
      const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;
      emailContent += `
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `;
    }

    emailContent += `
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>RBAC System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to RBAC System',
      html: emailContent,
      text: `Welcome to RBAC System! Your account has been created successfully. Email: ${user.email}, Role: ${user.role?.name || 'Not assigned'}`
    });
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordResetEmail(user, resetToken) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You have requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>RBAC System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: emailContent,
      text: `Password reset requested. Visit: ${resetUrl} (expires in 10 minutes)`
    });
  }

  /**
   * Send email verification
   * @param {Object} user - User object
   * @param {string} verificationToken - Email verification token
   */
  async sendEmailVerification(user, verificationToken) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hi ${user.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>RBAC System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Email Verification Required',
      html: emailContent,
      text: `Please verify your email: ${verificationUrl} (expires in 24 hours)`
    });
  }

  /**
   * Send role assignment notification
   * @param {Object} user - User object
   * @param {Object} role - Role object
   * @param {Object} assignedBy - User who assigned the role
   */
  async sendRoleAssignmentEmail(user, role, assignedBy) {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Role Assignment Update</h2>
        <p>Hi ${user.name},</p>
        <p>Your role in the RBAC System has been updated.</p>
        <p><strong>New Role:</strong> ${role.name}</p>
        <p><strong>Role Description:</strong> ${role.description}</p>
        <p><strong>Assigned by:</strong> ${assignedBy.name} (${assignedBy.email})</p>
        <p>This change is effective immediately. Please log out and log back in to see your updated permissions.</p>
        <p>If you have questions about this change, please contact your administrator.</p>
        <p>Best regards,<br>RBAC System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Role Assignment Updated',
      html: emailContent,
      text: `Your role has been updated to: ${role.name}. Assigned by: ${assignedBy.name}`
    });
  }

  /**
   * Send account deactivation notification
   * @param {Object} user - User object
   * @param {Object} deactivatedBy - User who deactivated the account
   */
  async sendAccountDeactivationEmail(user, deactivatedBy) {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Account Deactivated</h2>
        <p>Hi ${user.name},</p>
        <p>Your account in the RBAC System has been deactivated.</p>
        <p><strong>Deactivated by:</strong> ${deactivatedBy.name} (${deactivatedBy.email})</p>
        <p>You will no longer be able to access the system with this account.</p>
        <p>If you believe this was done in error, please contact your administrator immediately.</p>
        <p>Best regards,<br>RBAC System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Account Deactivated',
      html: emailContent,
      text: `Your account has been deactivated by: ${deactivatedBy.name}`
    });
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;