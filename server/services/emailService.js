import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            if (process.env.NODE_ENV === 'development') {
                // Use Ethereal Email for testing
                const testAccount = await nodemailer.createTestAccount();
                
                this.transporter = nodemailer.createTransporter({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });

                console.log('Email service initialized with Ethereal Email for development');
            } else {
                // Production email configuration
                const emailConfig = {
                    service: process.env.EMAIL_SERVICE || 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                };

                // Alternative configuration for SMTP
                if (process.env.SMTP_HOST) {
                    emailConfig.host = process.env.SMTP_HOST;
                    emailConfig.port = process.env.SMTP_PORT || 587;
                    emailConfig.secure = process.env.SMTP_SECURE === 'true';
                    delete emailConfig.service;
                }

                this.transporter = nodemailer.createTransporter(emailConfig);
                console.log('Email service initialized for production');
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize email service:', error);
            // Fallback to a simple configuration
            this.transporter = nodemailer.createTransporter({
                host: 'localhost',
                port: 1025,
                secure: false,
                ignoreTLS: true,
            });
            this.initialized = true;
        }
    }

    async sendContactMessage({ listing, buyer, seller, message, subject }) {
        try {
            // Ensure email service is initialized
            await this.initialize();
            
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }

            // Generate email content
            const emailContent = this.generateContactEmailTemplate({
                listing,
                buyer,
                seller,
                message
            });

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@genie-marketplace.com',
                to: seller.email,
                subject: subject || `New inquiry about your listing: ${listing.title}`,
                html: emailContent.html,
                text: emailContent.text,
                replyTo: buyer.email, // Allow seller to reply directly to buyer
            };

            const info = await this.transporter.sendMail(mailOptions);

            // Log the result
            if (process.env.NODE_ENV === 'development') {
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
            };

        } catch (error) {
            console.error('Error sending contact email:', error);
            throw new Error(`Failed to send contact email: ${error.message}`);
        }
    }

    async sendModerationNotification({ seller, listing, action, reason, adminName, permanent = false }) {
        try {
            // Ensure email service is initialized
            await this.initialize();
            
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }

            // Generate email content
            const emailContent = this.generateModerationEmailTemplate({
                seller,
                listing,
                action,
                reason,
                adminName,
                permanent
            });

            const actionText = action === 'flagged' ? 'flagged' : action === 'deleted' ? 'removed' : action;
            const subject = `Important: Your marketplace listing has been ${actionText}`;

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@genie-marketplace.com',
                to: seller.email,
                subject: subject,
                html: emailContent.html,
                text: emailContent.text,
            };

            const info = await this.transporter.sendMail(mailOptions);

            // Log the result
            if (process.env.NODE_ENV === 'development') {
                console.log('Moderation notification sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
            };

        } catch (error) {
            console.error('Error sending moderation notification:', error);
            throw new Error(`Failed to send moderation notification: ${error.message}`);
        }
    }

    generateModerationEmailTemplate({ seller, listing, action, reason, adminName, permanent }) {
        const actionText = action === 'flagged' ? 'flagged for review' : action === 'deleted' ? 'removed' : action;
        const actionColor = action === 'flagged' ? '#f59e0b' : action === 'deleted' ? '#ef4444' : '#6b7280';
        const actionIcon = action === 'flagged' ? '⚠️' : action === 'deleted' ? '🗑️' : '📝';

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketplace Listing ${actionText}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid ${actionColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: ${actionColor};
            margin: 0;
            font-size: 24px;
        }
        .alert-box {
            background-color: ${action === 'flagged' ? '#fef3c7' : action === 'deleted' ? '#fee2e2' : '#f3f4f6'};
            border-left: 4px solid ${actionColor};
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .alert-title {
            font-size: 18px;
            font-weight: bold;
            color: ${action === 'flagged' ? '#92400e' : action === 'deleted' ? '#991b1b' : '#374151'};
            margin-bottom: 10px;
        }
        .listing-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .listing-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }
        .reason-section {
            margin: 30px 0;
        }
        .reason-section h3 {
            color: #1e293b;
            margin-bottom: 15px;
        }
        .reason-content {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${actionColor};
        }
        .next-steps {
            background-color: #ecfdf5;
            border: 1px solid #d1fae5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #065f46;
            margin-top: 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${actionIcon} Genie Marketplace</h1>
            <p>Listing Moderation Notice</p>
        </div>

        <div class="alert-box">
            <div class="alert-title">Your listing has been ${actionText}</div>
            <p>Hello ${seller.first_name},</p>
            <p>We're writing to inform you that your marketplace listing has been ${actionText} by our moderation team.</p>
        </div>

        <div class="listing-info">
            <div class="listing-title">${listing.title}</div>
            <p><strong>Listing ID:</strong> ${listing.id}</p>
            <p><strong>Action taken:</strong> ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</p>
            <p><strong>Reviewed by:</strong> ${adminName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="reason-section">
            <h3>📋 Reason for Action</h3>
            <div class="reason-content">
                ${reason}
            </div>
        </div>

        ${action === 'flagged' ? `
        <div class="next-steps">
            <h3>🔄 What happens next?</h3>
            <ul>
                <li>Your listing is temporarily hidden from public view</li>
                <li>You can review and edit your listing to address the concerns</li>
                <li>Once updated, your listing may be reviewed again</li>
                <li>Contact our support team if you have questions</li>
            </ul>
        </div>
        ` : ''}

        ${action === 'deleted' && permanent ? `
        <div class="warning">
            <h3>⚠️ Important Notice</h3>
            <p><strong>This listing has been permanently removed</strong> and cannot be restored. This action was taken due to a violation of our marketplace policies.</p>
        </div>
        ` : ''}

        ${action === 'deleted' && !permanent ? `
        <div class="next-steps">
            <h3>🔄 What you can do</h3>
            <ul>
                <li>Review our marketplace policies and guidelines</li>
                <li>Create a new listing that complies with our terms</li>
                <li>Contact our support team if you believe this was an error</li>
            </ul>
        </div>
        ` : ''}

        <div class="next-steps">
            <h3>📞 Need Help?</h3>
            <p>If you have questions about this action or need assistance, please contact our support team:</p>
            <ul>
                <li>Email: support@genie-marketplace.com</li>
                <li>Phone: 1-800-GENIE-HELP</li>
            </ul>
        </div>

        <div class="footer">
            <p>This is an automated message from the Genie Marketplace moderation system.</p>
            <p>Please review our <a href="#" style="color: #4f46e5;">Community Guidelines</a> and <a href="#" style="color: #4f46e5;">Terms of Service</a>.</p>
            <p>© ${new Date().getFullYear()} Genie Marketplace. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        const text = `
GENIE MARKETPLACE - Listing Moderation Notice

Hello ${seller.first_name},

Your marketplace listing has been ${actionText} by our moderation team.

LISTING DETAILS:
- Title: ${listing.title}
- Listing ID: ${listing.id}
- Action taken: ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}
- Reviewed by: ${adminName}
- Date: ${new Date().toLocaleDateString()}

REASON FOR ACTION:
${reason}

${action === 'flagged' ? `
WHAT HAPPENS NEXT:
- Your listing is temporarily hidden from public view
- You can review and edit your listing to address the concerns
- Once updated, your listing may be reviewed again
- Contact our support team if you have questions
` : ''}

${action === 'deleted' && permanent ? `
IMPORTANT NOTICE:
This listing has been permanently removed and cannot be restored. This action was taken due to a violation of our marketplace policies.
` : ''}

${action === 'deleted' && !permanent ? `
WHAT YOU CAN DO:
- Review our marketplace policies and guidelines
- Create a new listing that complies with our terms
- Contact our support team if you believe this was an error
` : ''}

NEED HELP?
If you have questions about this action or need assistance, please contact our support team:
- Email: support@genie-marketplace.com
- Phone: 1-800-GENIE-HELP

Please review our Community Guidelines and Terms of Service.

---
This is an automated message from the Genie Marketplace moderation system.
© ${new Date().getFullYear()} Genie Marketplace. All rights reserved.
        `;

        return { html, text };
    }

    generateContactEmailTemplate({ listing, buyer, seller, message }) {
        // Helper function to escape HTML
        const escapeHtml = (text) => {
            if (!text) return '';
            return text.toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        // Safely extract and escape data
        const safeTitle = escapeHtml(listing?.title || 'N/A');
        const safePrice = (listing?.price || 0);
        const safeCategory = listing?.category || 'N/A';
        const safeCondition = listing?.condition || 'N/A';
        const safeLocation = escapeHtml(listing?.location || 'N/A');
        const safeBuyerFirstName = escapeHtml(buyer?.first_name || 'N/A');
        const safeBuyerLastName = escapeHtml(buyer?.last_name || 'N/A');
        const safeBuyerEmail = escapeHtml(buyer?.email || 'N/A');
        const safeBuyerPhone = escapeHtml(buyer?.phone || 'N/A');
        const safeSellerFirstName = escapeHtml(seller?.first_name || 'N/A');
        const safeMessage = escapeHtml(message || 'N/A');
        const safeCreatedAt = listing?.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A';
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Inquiry About Your Listing</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 24px;
        }
        .listing-info {
            background-color: #f8fafc;
            border-left: 4px solid #4f46e5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .listing-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }
        .listing-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
        }
        .detail-item {
            font-size: 14px;
        }
        .detail-label {
            font-weight: bold;
            color: #64748b;
        }
        .detail-value {
            color: #1e293b;
        }
        .message-section {
            margin: 30px 0;
        }
        .message-section h3 {
            color: #1e293b;
            margin-bottom: 15px;
        }
        .message-content {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            font-style: italic;
        }
        .buyer-info {
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .buyer-info h3 {
            color: #92400e;
            margin-top: 0;
        }
        .contact-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        .price {
            font-size: 20px;
            font-weight: bold;
            color: #059669;
        }
        @media (max-width: 600px) {
            .listing-details,
            .contact-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛍️ Genie Marketplace</h1>
            <p>You have a new inquiry about your listing!</p>
        </div>

        <div class="listing-info">
            <div class="listing-title">${safeTitle}</div>
            <div class="price">₹${safePrice.toLocaleString('en-IN')}</div>
            
            <div class="listing-details">
                <div class="detail-item">
                    <div class="detail-label">Category:</div>
                    <div class="detail-value">${safeCategory ? safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1).replace('-', ' ') : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Condition:</div>
                    <div class="detail-value">${safeCondition ? safeCondition.charAt(0).toUpperCase() + safeCondition.slice(1).replace('-', ' ') : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location:</div>
                    <div class="detail-value">${safeLocation}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Posted:</div>
                    <div class="detail-value">${safeCreatedAt}</div>
                </div>
            </div>
        </div>

        <div class="buyer-info">
            <h3>👤 Buyer Information</h3>
            <div class="contact-info">
                <div class="detail-item">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">${safeBuyerFirstName} ${safeBuyerLastName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">${safeBuyerPhone}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${safeBuyerEmail}</div>
                </div>
            </div>
        </div>

        <div class="message-section">
            <h3>💬 Message from Buyer</h3>
            <div class="message-content">
                "${safeMessage}"
            </div>
        </div>

        <div style="text-align: center;">
            <p><strong>You can reply directly to this email to contact the buyer.</strong></p>
            <p>The buyer's email (${safeBuyerEmail}) has been set as the reply-to address.</p>
        </div>

        <div class="footer">
            <p>This email was sent from the Genie Marketplace contact system.</p>
            <p>If you believe this email was sent in error, please contact our support team.</p>
            <p>© ${new Date().getFullYear()} Genie Marketplace. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        const text = `
GENIE MARKETPLACE - New Inquiry About Your Listing

Hello ${safeSellerFirstName},

You have received a new inquiry about your listing:

LISTING DETAILS:
- Title: ${safeTitle}
- Price: ₹${safePrice.toLocaleString('en-IN')}
- Category: ${safeCategory ? safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1).replace('-', ' ') : 'N/A'}
- Condition: ${safeCondition ? safeCondition.charAt(0).toUpperCase() + safeCondition.slice(1).replace('-', ' ') : 'N/A'}
- Location: ${safeLocation}
- Posted: ${safeCreatedAt}

BUYER INFORMATION:
- Name: ${safeBuyerFirstName} ${safeBuyerLastName}
- Phone: ${safeBuyerPhone}
- Email: ${safeBuyerEmail}

MESSAGE FROM BUYER:
"${safeMessage}"

You can reply directly to this email to contact the buyer.

---
This email was sent from the Genie Marketplace contact system.
© ${new Date().getFullYear()} Genie Marketplace. All rights reserved.
        `;

        return { html, text };
    }

    async verifyConnection() {
        try {
            await this.initialize();
            
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }
            
            await this.transporter.verify();
            console.log('Email service connection verified');
            return true;
        } catch (error) {
            console.error('Email service verification failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;